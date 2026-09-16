import { parseStudentNLP, ParsedNLPResult } from "@/lib/nlp-parser";
import { parseBankMutation } from "@/lib/mutation-parser";
import { formatCurrencyIDR, formatDateRelative } from "@/lib/utils";

// In-memory or cache pairing store (can be backed by Firestore in production)
const pairingStore = new Map<string, { uid: string; expiresAt: number }>();
const userTelegramMap = new Map<string, string>(); // telegramChatId -> uid
const telegramUserMap = new Map<string, string>(); // uid -> telegramChatId

export class TelegramBotService {
  /**
   * Generates a 6-digit numeric pairing code valid for 10 minutes.
   */
  public static generatePairingCode(uid: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    pairingStore.set(code, { uid, expiresAt });
    return code;
  }

  /**
   * Verifies pairing code from Telegram and associates chatId with user uid.
   */
  public static verifyPairing(code: string, chatId: string): { success: boolean; uid?: string; message: string } {
    const record = pairingStore.get(code.trim());

    if (!record) {
      return { success: false, message: "Kode pairing tidak ditemukan atau salah. Buka menu Pengaturan di web Felys untuk membuat kode baru." };
    }

    if (Date.now() > record.expiresAt) {
      pairingStore.delete(code.trim());
      return { success: false, message: "Kode pairing sudah kedaluwarsa. Silakan buat kode baru di menu Pengaturan web Felys." };
    }

    // Link user
    userTelegramMap.set(chatId, record.uid);
    telegramUserMap.set(record.uid, chatId);
    pairingStore.delete(code.trim());

    return {
      success: true,
      uid: record.uid,
      message: "Akun Telegram berhasil terhubung dengan akun Felys kamu! ✨\nSekarang kamu bisa langsung ketik atau kirim pesan pengeluaran atau tugas kuliah di sini.",
    };
  }

  /**
   * Resolves user uid from chatId
   */
  public static getUidByChatId(chatId: string): string | null {
    return userTelegramMap.get(chatId) || null;
  }

  /**
   * Resolves chatId from uid
   */
  public static getChatIdByUid(uid: string): string | null {
    return telegramUserMap.get(uid) || null;
  }

  /**
   * Checks if user is paired
   */
  public static isUserPaired(uid: string): boolean {
    return telegramUserMap.has(uid);
  }

  /**
   * Unpairs user
   */
  public static unpairUser(uid: string): boolean {
    const chatId = telegramUserMap.get(uid);
    if (chatId) {
      userTelegramMap.delete(chatId);
      telegramUserMap.delete(uid);
      return true;
    }
    return false;
  }

  /**
   * Processes incoming text message from Telegram.
   */
  public static processIncomingText(
    text: string,
    chatId: string
  ): {
    replyText: string;
    action?: "task_added" | "transaction_added" | "paired" | "help";
    data?: any;
  } {
    const trimmed = text.trim();

    // 1. Handle commands
    if (trimmed.startsWith("/start") || trimmed.startsWith("/link")) {
      const parts = trimmed.split(" ");
      if (parts.length > 1 && parts[1]) {
        const res = this.verifyPairing(parts[1], chatId);
        return { replyText: res.message, action: res.success ? "paired" : undefined };
      }
      return {
        replyText: `Hai Mahasiswa! 🎓\nSelamat datang di Bot Asisten Felys.\n\nUntuk menghubungkan bot ini ke akun kamu, buka web Felys > Pengaturan > Bot Chat, lalu kirim perintah:\n/link KODE\n(Contoh: /link 123456)`,
        action: "help",
      };
    }

    if (trimmed === "/help" || trimmed === "/bantuan") {
      return {
        replyText: `Panduan Pintas Bot Felys 💡\n\n• Catat Pengeluaran: "Beli geprek 18rb pake gopay" atau "Makan siang 15000"\n• Catat Pemasukan: "Dikasih uang saku 200rb"\n• Catat Tugas: "Tugas kalkulus jumat jam 23:59" atau "Makalah AI lusa"\n• Paste SMS Bank: Cukup tempelkan SMS/notifikasi mutasi BCA/SeaBank kamu di sini!`,
        action: "help",
      };
    }

    // 2. Check if it's an academic task or student natural expense first
    const isAcademicQuery = /tugas|makalah|\bpr\b|deadline|ujian|uts|uas|baca|resume|skripsi|presentasi/i.test(trimmed);
    const nlpResult = parseStudentNLP(trimmed);

    if (nlpResult && (isAcademicQuery || nlpResult.type === "task")) {
      if (nlpResult.type === "task" && nlpResult.taskData) {
        return {
          replyText: `Tugas Berhasil Dijadwalkan! 📚\n\n• Judul: ${nlpResult.taskData.title}\n• Mata Kuliah: ${nlpResult.taskData.courseName || "Umum"}\n• Deadline: ${formatDateRelative(nlpResult.taskData.deadline)}\n• Prioritas: ${nlpResult.taskData.priority.toUpperCase()}\n\n✓ Sudah masuk ke papan tugas Felys kamu.`,
          action: "task_added",
          data: nlpResult.taskData,
        };
      }
    }

    // 3. Try parsing bank/e-wallet mutation
    const hasBankKeyword = /bca|gopay|seabank|ovo|dana|shopee|transfer|berhasil|m-transfer|qris|rekening|saldo|atm/i.test(trimmed);
    if (hasBankKeyword) {
      const bankMutation = parseBankMutation(trimmed);
      if (bankMutation) {
        return {
          replyText: `Transaksi Mutasi Dicatat! 💸\n\n• Rekening: ${bankMutation.provider.toUpperCase()}\n• Tipe: ${bankMutation.type === "income" ? "Pemasukan 🟢" : "Pengeluaran 🔴"}\n• Nominal: ${formatCurrencyIDR(bankMutation.amount)}\n• Keterangan: ${bankMutation.merchantOrNote}\n\n✓ Transaksi berhasil dicatat.`,
          action: "transaction_added",
          data: bankMutation,
        };
      }
    }

    // 4. Try parsing natural language transaction
    if (nlpResult && nlpResult.type === "transaction" && nlpResult.transactionData) {
      return {
        replyText: `Pengeluaran Berhasil Dicatat! 💸\n\n• Nominal: ${formatCurrencyIDR(nlpResult.transactionData.amount)}\n• Kategori: ${nlpResult.transactionData.categoryName || "Umum"}\n• Keterangan: ${nlpResult.transactionData.note}\n\n✓ Saldo jatah harianmu telah disesuaikan di Felys.`,
        action: "transaction_added",
        data: nlpResult.transactionData,
      };
    }

    // 4. Default friendly prompt
    return {
      replyText: `Fio kurang memahami teks ini 🤔\nCoba ketik seperti ini:\n• "Makan siang 15rb"\n• "Tugas algoritma selasa jam 12:00"\n\nAtau ketik /bantuan untuk melihat contoh.`,
      action: "help",
    };
  }
}
