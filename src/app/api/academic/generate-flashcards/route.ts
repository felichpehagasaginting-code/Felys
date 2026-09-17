import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { RateLimiterService } from "@/server/services/rate-limiter.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const clientId = RateLimiterService.getClientIdentifier(req);
    const limit = await RateLimiterService.checkRateLimit(clientId, "ai_flashcards", {
      windowMs: 60_000,
      maxRequests: 6,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak permintaan generate flashcard. Tunggu ${limit.resetInSeconds} detik lagi.` },
        { status: 429, headers: { "Retry-After": String(limit.resetInSeconds) } }
      );
    }

    const { text, topic } = await req.json();

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Teks materi kuliah terlalu pendek untuk dibuat flashcard." },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    if (!apiKey) {
      // Generate baseline card directly from uploaded user text
      const extractedCards = [
        {
          id: `card-${Date.now()}-1`,
          question: `Apa konsep utama dari ${topic || "materi ini"}?`,
          answer: text.slice(0, 180) + "...",
          explanation: "Konsep dasar dari materi kuliah pengguna.",
          interval: 0,
          repetition: 0,
          easeFactor: 2.5,
          dueDate: new Date().toISOString(),
        },
      ];
      return NextResponse.json({ cards: extractedCards });
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const model = google("gemini-1.5-flash");

    const prompt = `Anda adalah asisten dosen dan pakar belajar aktif (Active Recall) di Felys.
Tugas Anda adalah membaca materi kuliah berikut dan menghasilkan 5 hingga 10 kartu tanya-jawab (Flashcards) berkualitas tinggi untuk persiapan ujian mahasiswa.

Topik: ${topic || "Materi Perkuliahan"}
Materi:
"""
${text.slice(0, 8000)}
"""

Format Output: Anda WAJIB membalas HANYA dengan JSON array murni tanpa markdown formatting atau backtick, seperti ini:
[
  {
    "question": "Pertanyaan tajam mengenai konsep kunci atau definisi",
    "answer": "Jawaban ringkas, jelas, dan tepat sasaran",
    "explanation": "Penjelasan singkat atau tips mengingat"
  }
]`;

    const { text: aiResponse } = await generateText({
      model,
      prompt,
      temperature: 0.3,
    });

    let cleaned = aiResponse.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsedJson = JSON.parse(cleaned);

    const cards = Array.isArray(parsedJson)
      ? parsedJson.map((item: any, idx: number) => ({
          id: `card-${Date.now()}-${idx + 1}`,
          question: item.question || "Pertanyaan",
          answer: item.answer || "Jawaban",
          explanation: item.explanation || "",
          interval: 0,
          repetition: 0,
          easeFactor: 2.5,
          dueDate: new Date().toISOString(),
        }))
      : [];

    return NextResponse.json({ cards });
  } catch (error: any) {
    console.error("[generate-flashcards] Error:", error);
    return NextResponse.json(
      { error: "Gagal membuat flashcards otomatis: " + error.message },
      { status: 500 }
    );
  }
}
