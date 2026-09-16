import { describe, it, expect } from "vitest";
import { TelegramBotService } from "./telegram-bot.service";

describe("TelegramBotService", () => {
  it("generates a valid 6-digit pairing code and verifies it", () => {
    const code = TelegramBotService.generatePairingCode("user-123");
    expect(code).toMatch(/^[0-9]{6}$/);

    const result = TelegramBotService.verifyPairing(code, "chat-888");
    expect(result.success).toBe(true);
    expect(result.uid).toBe("user-123");

    // Once used, the code cannot be reused
    const reuse = TelegramBotService.verifyPairing(code, "chat-888");
    expect(reuse.success).toBe(false);

    // Verify lookup & unpair
    expect(TelegramBotService.isUserPaired("user-123")).toBe(true);
    expect(TelegramBotService.getChatIdByUid("user-123")).toBe("chat-888");
    expect(TelegramBotService.getUidByChatId("chat-888")).toBe("user-123");

    const unpairRes = TelegramBotService.unpairUser("user-123");
    expect(unpairRes).toBe(true);
    expect(TelegramBotService.isUserPaired("user-123")).toBe(false);
    expect(TelegramBotService.getChatIdByUid("user-123")).toBeNull();
  });

  it("processes natural language expense message", () => {
    const res = TelegramBotService.processIncomingText("Makan siang geprek 18rb", "chat-888");
    expect(res.action).toBe("transaction_added");
    expect(res.replyText).toContain("Pengeluaran Berhasil Dicatat");
    expect(res.data?.amount).toBe(18000);
  });

  it("processes natural language task message", () => {
    const res = TelegramBotService.processIncomingText("Tugas kalkulus jumat jam 23:59", "chat-888");
    expect(res.action).toBe("task_added");
    expect(res.replyText).toContain("Tugas Berhasil Dijadwalkan");
    expect(res.data?.title).toContain("kalkulus");
  });

  it("processes bank mutation text", () => {
    const text = "m-Transfer: BERHASIL 16/09 ke BCA 1234567890 AN BUDI Rp. 50.000,00";
    const res = TelegramBotService.processIncomingText(text, "chat-888");
    expect(res.action).toBe("transaction_added");
    expect(res.replyText).toContain("Transaksi Mutasi Dicatat");
  });
});
