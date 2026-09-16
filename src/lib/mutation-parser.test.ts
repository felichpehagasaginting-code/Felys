import { describe, it, expect } from "vitest";
import { parseNominalIDR, parseBankMutation } from "./mutation-parser";

describe("parseNominalIDR", () => {
  it("parses various Indonesian currency formats", () => {
    expect(parseNominalIDR("Rp. 25.000,00")).toBe(25000);
    expect(parseNominalIDR("Rp18.500")).toBe(18500);
    expect(parseNominalIDR("150000")).toBe(150000);
    expect(parseNominalIDR("sebesar Rp 1.500.000")).toBe(1500000);
  });
});

describe("parseBankMutation", () => {
  it("parses BCA Mobile transfer notification", () => {
    const text = "m-Transfer: BERHASIL 16/09 10:15 ke 1234567890 AN BUDI SANTOSO Rp. 45.000,00 Ref 88219";
    const result = parseBankMutation(text);

    expect(result).not.toBeNull();
    expect(result?.provider).toBe("bca");
    expect(result?.type).toBe("expense");
    expect(result?.amount).toBe(45000);
    expect(result?.merchantOrNote).toContain("BUDI SANTOSO");
  });

  it("parses GoPay merchant payment notification", () => {
    const text = "Pembayaran berhasil! Kamu telah bayar Rp15.000 di Kopi Kenangan pakai GoPay.";
    const result = parseBankMutation(text);

    expect(result).not.toBeNull();
    expect(result?.provider).toBe("gopay");
    expect(result?.type).toBe("expense");
    expect(result?.amount).toBe(15000);
    expect(result?.merchantOrNote).toBe("Kopi Kenangan");
  });

  it("parses SeaBank incoming transfer notification", () => {
    const text = "SeaBank: Transfer masuk sebesar Rp250.000 dari ORANG TUA berhasil pada 16/09.";
    const result = parseBankMutation(text);

    expect(result).not.toBeNull();
    expect(result?.provider).toBe("seabank");
    expect(result?.type).toBe("income");
    expect(result?.amount).toBe(250000);
  });

  it("parses OVO merchant transaction", () => {
    const text = "Berhasil! Pembayaran OVO sebesar Rp 28.000 di HokBen telah selesai.";
    const result = parseBankMutation(text);

    expect(result).not.toBeNull();
    expect(result?.provider).toBe("ovo");
    expect(result?.type).toBe("expense");
    expect(result?.amount).toBe(28000);
  });
});
