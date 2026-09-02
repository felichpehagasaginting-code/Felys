import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { taskTitle, courseName, deadline, estimatedHours } = await req.json();

    if (!taskTitle || typeof taskTitle !== "string" || !taskTitle.trim()) {
      return new Response(JSON.stringify({ error: "Judul tugas diperlukan" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    // Fallback if no API Key is set in production
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          subtasks: [
            { title: "Riset dan kumpulkan materi/referensi", estimatedHours: 1 },
            { title: "Buat kerangka atau rancangan pengerjaan", estimatedHours: 1.5 },
            { title: "Eksekusi dan susun isi tugas utama", estimatedHours: 2.5 },
            { title: "Review, periksa format, dan siap dikumpul", estimatedHours: 0.5 },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const prompt = `
Kamu adalah asisten akademik AI "Fio" untuk mahasiswa Indonesia.
Tugas: Pecah judul tugas kuliah berikut menjadi 4 sampai 6 subtask (tahapan langkah kerja) yang kronologis, realistis, dan siap dieksekusi.

INFORMASI TUGAS:
- Judul Tugas: "${taskTitle}"
- Mata Kuliah: "${courseName || "Umum"}"
- Deadline: "${deadline || "Segera"}"
- Estimasi Total Waktu: "${estimatedHours || 4} jam"

ATURAN OUTPUT:
- Berikan respon HANYA dalam format JSON valid murni tanpa markdown formatting (tanpa \`\`\`json).
- Format schema JSON:
{
  "subtasks": [
    { "title": "Nama subtask langkah 1", "estimatedHours": 1 },
    { "title": "Nama subtask langkah 2", "estimatedHours": 1.5 }
  ]
}
- Bahasa Indonesia yang santai, jelas, dan memotivasi mahasiswa.
    `.trim();

    let rawOutput = "";
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

    for (const modelName of modelsToTry) {
      try {
        const { text } = await generateText({
          model: google(modelName),
          prompt,
        });

        if (text) {
          rawOutput = text;
          break;
        }
      } catch (err: any) {
        console.warn(`Breakdown model ${modelName} failed, trying next. Error:`, err.message || err);
      }
    }

    if (!rawOutput) {
      throw new Error("All Gemini models failed for task breakdown.");
    }

    // Clean JSON response if wrapped in markdown codeblocks
    const cleanedText = rawOutput
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedText);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("AI Task Breakdown Error:", error);

    // Reliable fallback subtasks
    return new Response(
      JSON.stringify({
        subtasks: [
          { title: "Kumpulkan bahan rujukan & baca instruksi dosen", estimatedHours: 1 },
          { title: "Susun kerangka atau struktur pengerjaan tugas", estimatedHours: 1 },
          { title: "Kerjakan isi utama tugas sesuai panduan", estimatedHours: 2 },
          { title: "Cek plagiasi, format dokumen, dan submit ke portal", estimatedHours: 0.5 },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
