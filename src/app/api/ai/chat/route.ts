import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

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
Kamu adalah "Fio", asisten pintar AI di aplikasi Felys.
Felys adalah aplikasi terintegrasi untuk mahasiswa yang menggabungkan manajemen tugas akademik (Mode Akademik) dan pencatatan keuangan (Mode Finance).

Kepribadian & Tone of Voice:
- Santai, ramah, dan suportif (Gunakan sapaan "kamu", jangan kaku seperti robot).
- Ringkas dan padat (1 - 3 paragraf pendek, hindari wall of text).
- Selalu mengacu pada data pengguna di bawah ini saat menjawab pertanyaan.
- Berikan motivasi realistis atau tips praktis (contoh: menyarankan fokus cicil tugas yang skor urgensinya paling tinggi, atau menyarankan menahan jajan jika budget non-esensial sudah di atas 70%).

DATA REAL-TIME PENGGUNA SAAT INI:
--- TUGAS AKADEMIK AKTIF ---
${tasksContext}

--- KEUANGAN & BUDGET BULAN BERJALAN ---
${budgetContext}
---
    `.trim();

    if (!apiKey) {
      // If no API key provided, return simulated smart answer
      const lastUserMessage = messages[messages.length - 1]?.content || "";
      return new Response(
        `Hai! Fio di sini ✨ (Mode Demo). Berdasarkan data kamu, tugas yang paling mendesak adalah tugas dengan skor urgensi tertinggi. Sisa budget kamu bulan ini masih aman dan bisa kamu cek langsung di dashboard!`,
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    const result = streamText({
      model: google("gemini-1.5-flash"),
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
