import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

export const runtime = "nodejs";

// In-memory sliding window rate limiter: Map<identifier, timestamp[]>
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_WINDOW = 40;
const WINDOW_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_DURATION_MS;
  const timestamps = rateLimitMap.get(identifier) || [];

  // Filter timestamps within current 24h window
  const recentTimestamps = timestamps.filter((t) => t > windowStart);

  if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  recentTimestamps.push(now);
  rateLimitMap.set(identifier, recentTimestamps);
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - recentTimestamps.length };
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    const userIdentifier = authHeader.replace("Bearer ", "").trim() || ip;

    // 1. Rate Limiting Check
    const { allowed, remaining } = checkRateLimit(userIdentifier);
    if (!allowed) {
      return new Response(
        `Hai! Kamu sudah mencapai batas maksimal 40 pertanyaan AI untuk hari ini. Silakan coba lagi besok ya! ✨`,
        { status: 429, headers: { "Content-Type": "text/plain; charset=utf-8", "X-RateLimit-Remaining": "0" } }
      );
    }

    const { messages, context } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // Construct context summary for system prompt
    const tasksContext = context?.tasks
      ? context.tasks
          .map(
            (t: any, i: number) =>
              `${i + 1}. ${t.title} (MK: ${t.course || "-"}, Deadline: ${t.deadline}, Urgensi: ${t.urgencyScore}/100, Prioritas: ${t.priority})`
          )
          .join("\n")
      : "Tidak ada data tugas aktif.";

    const budgetContext = context?.budgetSummary
      ? `Total Limit: Rp ${context.budgetSummary.totalLimit?.toLocaleString("id-ID")}, Terpakai: Rp ${context.budgetSummary.totalSpent?.toLocaleString("id-ID")}, Sisa: Rp ${context.budgetSummary.remaining?.toLocaleString("id-ID")}\nRincian Kategori:\n${context.budgetSummary.categories
          ?.map(
            (c: any) =>
              `- ${c.name}: Terpakai Rp ${c.spent?.toLocaleString("id-ID")} dari Limit Rp ${c.limit?.toLocaleString("id-ID")} (${c.usedPercentage}%, Status: ${c.status})`
          )
          .join("\n")}`
      : "Tidak ada data budget.";

    const systemPrompt = `
Kamu adalah "Fio", asisten pribadi cerdas, suportif, dan ramah di aplikasi Felys untuk mahasiswa.
Felys menggabungkan manajemen beban akademik dan pencatatan keuangan mahasiswa dalam satu ekosistem terpadu.

Gaya Komunikasi & Persona:
- Ramah, empatis, pintar, dan menggunakan bahasa Indonesia santai yang bersahabat ("kamu", bukan "Anda").
- Berikan respon yang kontekstual, cerdas, kreatif, dan spesifik sesuai pertanyaan dan data mahasiswa di bawah.
- Ringkas, to-the-point, dan actionable (maksimal 2-3 paragraf pendek).
- Selalu hubungkan saran akademik dengan kondisi keuangan jika relevan (misal: saat minggu deadline padat, ingatkan untuk menjaga fisik tanpa boros jajan pesan-antar makanan).

DATA REAL-TIME MAHASISWA:
--- TUGAS AKADEMIK AKTIF ---
${tasksContext}

--- ANGGARAN & PENGELUARAN BULAN INI ---
${budgetContext}
---
    `.trim();

    if (!apiKey) {
      return new Response(
        `Hai! Fio di sini ✨. Berdasarkan jadwalmu, prioritaskan tugas dengan skor urgensi tertinggi ya! Sisa budget kamu juga masih termonitor dengan baik di dashboard. Ada yang mau kamu tanyakan seputar tugas atau budget?`,
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8", "X-RateLimit-Remaining": String(remaining) } }
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("AI Chat API Error:", error);
    return new Response(
      `Hai! Fio siap bantu kamu mengatur tugas kuliah dan pengeluaran bulan ini ✨`,
      { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
}
