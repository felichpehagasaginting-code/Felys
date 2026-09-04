import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { getVerifiedUid } from "@/lib/firebase/auth-helpers";
import { checkAiQuota, truncateDocText } from "@/server/services/ai-usage.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // P2+P4: identitas dari session terverifikasi, kuota persisten di Firestore
    const uid = await getVerifiedUid(req);

    let remaining = 50;
    try {
      if (uid) {
        const q = await checkAiQuota(uid, "chat");
        if (!q.allowed) {
          return new Response(
            `Hai! Kamu sudah mencapai batas maksimal 50 pertanyaan AI untuk hari ini. Silakan coba lagi besok ya! ✨`,
            { status: 429, headers: { "Content-Type": "text/plain; charset=utf-8", "X-RateLimit-Remaining": "0" } }
          );
        }
        remaining = q.remaining;
      }
    } catch {
      // fail-open bila Admin DB belum dikonfigurasi (dev lokal)
    }

    const { messages, context } = await req.json();

    // Check all possible environment variable names for Gemini in production
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    // Construct context summary for system prompt
    const tasksContext = context?.tasks && context.tasks.length > 0
      ? context.tasks
          .map(
            (t: any, i: number) =>
              `${i + 1}. ${t.title} (MK: ${t.course || "-"}, Deadline: ${t.deadline}, Urgensi: ${t.urgencyScore}/100, Prioritas: ${t.priority})`
          )
          .join("\n")
      : "Tidak ada data tugas aktif saat ini.";

    const budgetContext = context?.budgetSummary
      ? `Total Limit: Rp ${context.budgetSummary.totalLimit?.toLocaleString("id-ID")}, Terpakai: Rp ${context.budgetSummary.totalSpent?.toLocaleString("id-ID")}, Sisa: Rp ${context.budgetSummary.remaining?.toLocaleString("id-ID")}\nRincian Kategori:\n${context.budgetSummary.categories
          ?.map(
            (c: any) =>
              `- ${c.name}: Terpakai Rp ${c.spent?.toLocaleString("id-ID")} dari Limit Rp ${c.limit?.toLocaleString("id-ID")} (${c.usedPercentage}%, Status: ${c.status})`
          )
          .join("\n")}`
      : "Tidak ada data budget.";

    const pdfContext = context?.lectureDocText
      ? `
--- DOKUMEN / SLIDE MATERI KULIAH AKTIF ("${context.lectureDocName || "Dokumen Materi"}") ---
${truncateDocText(String(context.lectureDocText), 8000)}
--- AKHIR ISI DOKUMEN ---
Instruksi Tambahan: Mahasiswa sedang membuka dan mempelajari dokumen di atas. Kamu memiliki akses PENUH ke seluruh isi teks dokumen tersebut. Jawab pertanyaan, buatkan rangkuman, kuis kilat, atau jelaskan konsep secara spesifik mengacu pada data/isi dokumen di atas.`
      : "";

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
${pdfContext}
---
    `.trim();

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not configured in environment variables.");
      return new Response(
        `Hai! Fio di sini ✨. Saat ini API Key Gemini belum terpasang di environment production (Vercel/Hosting). Berdasarkan datamu, prioritaskan tugas dengan urgensi tertinggi dan jaga sisa budget kamu ya!`,
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8", "X-RateLimit-Remaining": String(remaining) } }
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });

    // Multi-model resilience fallback: 2.5-flash -> 2.0-flash -> 1.5-flash
    let responseText = "";
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

    for (const modelName of modelsToTry) {
      try {
        const result = await generateText({
          model: google(modelName),
          system: systemPrompt,
          messages,
        });

        if (result.text) {
          responseText = result.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed, trying fallback. Error:`, err.message || err);
      }
    }

    if (!responseText) {
      throw new Error("All Gemini models failed to generate response.");
    }

    return new Response(responseText, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (error: any) {
    console.error("AI Chat API Error:", error);
    return new Response(
      `Hai! Fio siap bantu kamu mengatur tugas kuliah dan pengeluaran bulan ini ✨ Silakan periksa kembali koneksi atau API Key Gemini kamu.`,
      { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
}
