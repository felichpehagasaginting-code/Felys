"use client";

import { Category } from "@/types/finance";

export type SkillName = "can-i-spend" | "plan-tasks" | "simulate-saving";

export interface SkillIntent {
  skill: SkillName;
  amount?: number;
  categoryId?: string;
  cutPct?: number;
}

/** Parse nominal IDR dari teks bebas: "30rb", "Rp 30.000", "1,5jt", "50k", "100000" */
export function parseAmountIDR(text: string): number | null {
  const t = text.toLowerCase().replace(/rp\.?/g, "").trim();

  const jt = t.match(/(\d+(?:[.,]\d+)?)\s*jt/);
  if (jt) return Math.round(parseFloat(jt[1].replace(",", ".")) * 1_000_000);

  const k = t.match(/(\d+(?:[.,]\d+)?)\s*k\b/);
  if (k) return Math.round(parseFloat(k[1].replace(",", ".")) * 1_000);

  const rb = t.match(/(\d+(?:[.,]\d+)?)\s*rb/);
  if (rb) return Math.round(parseFloat(rb[1].replace(",", ".")) * 1_000);

  const grouped = t.match(/(\d{1,3}(?:[.,]\d{3})+)/);
  if (grouped) return Math.round(parseFloat(grouped[1].replace(/[.,]/g, "")));

  const plain = t.match(/\b(\d{4,9})\b/);
  if (plain) return parseInt(plain[1], 10);

  return null;
}

/** Cocokkan kategori dari teks berdasarkan nama kategori user. */
export function detectCategoryId(text: string, categories: Category[]): string | undefined {
  const lower = text.toLowerCase();
  // Cari nama kategori yang muncul di teks (terpanjang dulu biar spesifik menang)
  const sorted = [...categories].sort((a, b) => b.name.length - a.name.length);
  for (const c of sorted) {
    const keywords = c.name.toLowerCase().split(/[\s&/]+/).filter((w) => w.length >= 4);
    if (keywords.some((kw) => lower.includes(kw))) return c.id;
  }
  // Alias umum anak kos
  const alias: Record<string, string[]> = {
    makan: ["makan", "kantin", "warteg", "gofood", "grabfood"],
    kopi: ["kopi", "jajan", "kafe", "kongkow"],
    hiburan: ["hiburan", "nongkrong", "nobar", "bioskop", "game"],
    transport: ["transport", "ojol", "grab", "gojek", "bensin", "parkir"],
    belanja: ["belanja", "shopee", "tokopedia", "skincare"],
  };
  for (const [key, words] of Object.entries(alias)) {
    if (words.some((w) => w && lower.includes(w))) {
      const found = categories.find((c) => c.name.toLowerCase().includes(key));
      if (found) return found.id;
    }
  }
  return undefined;
}

/**
 * Deteksi intent skill dari pesan user. Return null bila tidak cocok
 * (drawer lanjut ke LLM chat biasa).
 */
export function detectSkillIntent(text: string, categories: Category[] = []): SkillIntent | null {
  const lower = text.toLowerCase();

  const spendKw = ["boleh", "bisa", "jajan", "nongkrong", "kopi", "beli", "belanja", "spend", "pakai uang", "pake uang"];
  const planKw = ["rencana", "cicil", "jadwal", "plan", "bagi waktu", "atur belajar", "schedule"];
  const saveKw = ["simulasi", "hemat", "potong", "kurangi", "pangkas", "save", "irit"];

  const has = (kws: string[]) => kws.some((k) => lower.includes(k));

  if (has(saveKw)) {
    const pctMatch = lower.match(/(\d{1,3})\s*%/);
    return {
      skill: "simulate-saving",
      categoryId: detectCategoryId(text, categories),
      cutPct: pctMatch ? Math.min(90, Math.max(5, parseInt(pctMatch[1], 10))) : 50,
    };
  }

  if (has(planKw)) return { skill: "plan-tasks" };

  if (has(spendKw)) {
    const amount = parseAmountIDR(text);
    if (amount === null) return null; // tanpa nominal → biar LLM yang tanya balik
    return { skill: "can-i-spend", amount, categoryId: detectCategoryId(text, categories) };
  }

  return null;
}

interface SkillApiOk {
  success: true;
  data: {
    allowed?: boolean;
    message?: string;
    plans?: { taskId: string; title: string; hoursPerDay: number; daysLeft: number }[];
  };
}

/** Panggil POST /api/ai/skills. Throw bila 401/500 agar caller bisa fallback. */
export async function callFioSkill(
  intent: SkillIntent,
  token?: string
): Promise<SkillApiOk["data"]> {
  const res = await fetch("/api/ai/skills", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      skill: intent.skill,
      ...(intent.amount !== undefined ? { amount: intent.amount } : {}),
      ...(intent.categoryId ? { categoryId: intent.categoryId } : {}),
      ...(intent.cutPct !== undefined ? { cutPct: intent.cutPct } : {}),
    }),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error(`Skill API ${res.status}`);
  const json = (await res.json()) as SkillApiOk | { success: false };
  if (!json.success) throw new Error("Skill gagal diproses");
  return (json as SkillApiOk).data;
}

/** Format hasil skill jadi pesan chat Fio yang ramah + faktual. */
export function formatSkillReply(skill: SkillName, data: SkillApiOk["data"]): string {
  if (skill === "can-i-spend") {
    const icon = data.allowed ? "✅" : "⛔";
    return `${icon} ${data.message || "Skill selesai."}`;
  }
  if (skill === "plan-tasks") {
    const plans = data.plans || [];
    if (plans.length === 0) return "🎉 Tidak ada tugas aktif — nikmati waktu luangmu!";
    const lines = plans.map(
      (p, i) => `${i + 1}. **${p.title}** — ~${p.hoursPerDay} jam/hari × ${p.daysLeft} hari`
    );
    return `📚 **Rencana cicil tugasmu (diurutkan paling mendesak):**\n\n${lines.join("\n")}\n\nTips Fio: kerjakan dengan timer Pomodoro 25 menit + jeda 5 menit. Semangat! 💪`;
  }
  return `💡 ${data.message || "Simulasi selesai."}`;
}
