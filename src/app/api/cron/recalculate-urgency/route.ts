import { getVerifiedUid, requireAdminDb } from "@/lib/firebase/auth-helpers";
import { stdSuccess, stdError } from "@/lib/validation";
import { recomputeUrgency } from "@/server/services/finance-ledger.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/recalculate-urgency?secret= — cron harian 00:00 (P5).
 * Hitung ulang deadlineFactor semua task aktif karena "hari tersisa" berubah.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    if ((url.searchParams.get("secret") || "") !== (process.env.CRON_SECRET || "")) {
      return stdError("UNAUTHORIZED", "Cron secret tidak valid.", 401);
    }
    const db = requireAdminDb();
    const onlyUid = url.searchParams.get("uid");
    const users = onlyUid ? [{ id: onlyUid }] : (await db.collection("users").select().get()).docs;

    let updated = 0;
    for (const u of users) {
      const uid = u.id;
      const snap = await db.collection("users").doc(uid).collection("tasks")
        .where("status", "in", ["todo", "in_progress"]).get();
      for (const d of snap.docs) {
        const t = d.data() as { deadline: string; priority: "low" | "medium" | "high"; estimatedHours?: number | null };
        if (!t.deadline) continue;
        const score = recomputeUrgency({ deadline: t.deadline, priority: t.priority || "medium", estimatedHours: t.estimatedHours ?? null });
        await d.ref.set({ urgencyScore: score, updatedAt: new Date().toISOString() }, { merge: true });
        updated++;
      }
    }
    return stdSuccess({ updated });
  } catch (e: unknown) {
    return stdError("INTERNAL_ERROR", e instanceof Error ? e.message : "Gagal recalculate.", 500);
  }
}
