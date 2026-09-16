import { getVerifiedUid } from "@/lib/firebase/auth-helpers";
import { TelegramBotService } from "@/server/services/telegram-bot.service";
import { stdSuccess, stdError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/user/bot-pairing — Cek status pairing bot Telegram */
export async function GET(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) return stdError("UNAUTHORIZED", "Silakan masuk akun terlebih dahulu.", 401);

    const isPaired = TelegramBotService.isUserPaired(uid);
    const chatId = TelegramBotService.getChatIdByUid(uid);

    return stdSuccess({
      isPaired,
      chatId,
      botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "FelysAssistantBot",
    });
  } catch (e: unknown) {
    return stdError("INTERNAL_ERROR", e instanceof Error ? e.message : "Gagal memeriksa status bot.", 500);
  }
}

/** POST /api/user/bot-pairing — Buat kode pairing 6-digit */
export async function POST(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) return stdError("UNAUTHORIZED", "Silakan masuk akun terlebih dahulu.", 401);

    const code = TelegramBotService.generatePairingCode(uid);
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "FelysAssistantBot";

    return stdSuccess({
      code,
      expiresInSeconds: 600,
      botUsername,
      deepLink: `https://t.me/${botUsername}?start=${code}`,
    });
  } catch (e: unknown) {
    return stdError("INTERNAL_ERROR", e instanceof Error ? e.message : "Gagal membuat kode pairing.", 500);
  }
}

/** DELETE /api/user/bot-pairing — Putuskan koneksi bot */
export async function DELETE(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) return stdError("UNAUTHORIZED", "Silakan masuk akun terlebih dahulu.", 401);

    const removed = TelegramBotService.unpairUser(uid);
    return stdSuccess({ success: true, removed });
  } catch (e: unknown) {
    return stdError("INTERNAL_ERROR", e instanceof Error ? e.message : "Gagal memutuskan koneksi bot.", 500);
  }
}
