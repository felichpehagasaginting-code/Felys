import { describe, it, expect } from "vitest";
import { parseAmountIDR, detectSkillIntent } from "./fio-skills-client";

describe("fio-skills-client", () => {
  it("parse nominal IDR: rb/jt/ribuan", () => {
    expect(parseAmountIDR("boleh jajan 30rb?")).toBe(30000);
    expect(parseAmountIDR("Rp 30.000")).toBe(30000);
    expect(parseAmountIDR("1,5jt")).toBe(1500000);
    expect(parseAmountIDR("kopi 50k")).toBe(50000);
    expect(parseAmountIDR("halo apa kabar")).toBeNull();
  });

  it("detect can-i-spend bila ada nominal", () => {
    const r = detectSkillIntent("Fio, boleh aku jajan 25000 hari ini?");
    expect(r?.skill).toBe("can-i-spend");
    expect(r?.amount).toBe(25000);
  });

  it("tanpa nominal → null (biar LLM tanya balik)", () => {
    expect(detectSkillIntent("boleh jajan?")).toBeNull();
  });

  it("detect plan-tasks & simulate-saving", () => {
    expect(detectSkillIntent("buatkan rencana cicil tugas")?.skill).toBe("plan-tasks");
    const s = detectSkillIntent("simulasi hemat 50% jajan");
    expect(s?.skill).toBe("simulate-saving");
    expect(s?.cutPct).toBe(50);
  });
});
