import { FieldValue } from "firebase-admin/firestore";
import { requireAdminDb } from "@/lib/firebase/auth-helpers";

const CHAT_LIMIT = 50;
const PDF_LIMIT = 10;

function dayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * P4: Persistent per-user daily AI quota (works across serverless instances).
 * Counter disimpan di users/{uid}/ai_usage/{yyyy-mm-dd}.
 */
export async function checkAiQuota(
  uid: string,
  kind: "chat" | "pdf"
): Promise<{ allowed: boolean; remaining: number }> {
  const db = requireAdminDb();
  const ref = db.collection("users").doc(uid).collection("ai_usage").doc(dayKey());
  const snap = await ref.get();
  const data = snap.exists ? snap.data() || {} : {};
  const chatUsed = Number(data.chatUsed || 0);
  const pdfUsed = Number(data.pdfUsed || 0);

  if (kind === "chat") {
    if (chatUsed >= CHAT_LIMIT) return { allowed: false, remaining: 0 };
    await ref.set(
      { chatUsed: FieldValue.increment(1), updatedAt: new Date().toISOString() },
      { merge: true }
    );
    return { allowed: true, remaining: CHAT_LIMIT - chatUsed - 1 };
  }
  if (pdfUsed >= PDF_LIMIT) return { allowed: false, remaining: 0 };
  await ref.set(
    { pdfUsed: FieldValue.increment(1), updatedAt: new Date().toISOString() },
    { merge: true }
  );
  return { allowed: true, remaining: PDF_LIMIT - pdfUsed - 1 };
}

/** P4: batasi context PDF agar biaya token tidak jebol. */
export function truncateDocText(text: string, maxChars = 8000): string {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[...dokumen dipotong — tampilkan 8000 karakter pertama...]";
}
