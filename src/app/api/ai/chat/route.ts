import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { getVerifiedUid } from "@/lib/firebase/auth-helpers";
import { checkAiQuota, truncateDocText } from "@/server/services/ai-usage.service";
import { RateLimiterService } from "@/server/services/rate-limiter.service";
import { AIContextService } from "@/server/services/ai-context.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // P2+P4: identitas dari session terverifikasi, kuota persisten di Firestore
    const uid = await getVerifiedUid(req);

    // Burst Protection: maksimal 10 pesan / menit per user/IP
    const clientId = RateLimiterService.getClientIdentifier(req, uid);
    const burstLimit = await RateLimiterService.checkRateLimit(clientId, "ai_chat", {
      windowMs: 60_000,
      maxRequests: 10,
    });

    if (!burstLimit.allowed) {
      return new Response(
        `Fio lagi istirahat sejenak nih ✨ Terlalu banyak pesan terkirim dalam 1 menit. Silakan tunggu ${burstLimit.resetInSeconds} detik lagi ya!`,
        {
          status: 429,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Retry-After": String(burstLimit.resetInSeconds),
            "X-RateLimit-Limit": String(burstLimit.totalLimit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(burstLimit.resetInSeconds),
          },
        }
      );
    }

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

    // Construct rich & isolated context summary for system prompt via AIContextService
    const userRealtimeContext = AIContextService.formatRealtimeContext(context);

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
- Jawaban kamu HARUS mengacu pada data mahasiswa yang sedang aktif login di bawah ini.

DATA REAL-TIME MAHASISWA SAAT INI (ISOLATED SESSION):
${userRealtimeContext}
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
