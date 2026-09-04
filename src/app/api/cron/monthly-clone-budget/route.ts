import { getVerifiedUid, requireAdminDb } from "@/lib/firebase/auth-helpers";
import { stdSuccess, stdError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/monthly-clone-budget?year&month — clone limit bulan lalu ke bulan target.
 * Diamankan via CRON_SECRET. Dipanggil Vercel Cron tiap tanggal 1.
 * Catatan: clone per-user butuh iterasi users; versi ini clone untuk uid yang
 * diberikan (?uid=) atau seluruh users bila dipanggil dengan service account.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    if ((url.searchParams.get("secret") || "") !== (process.env.CRON_SECRET || "")) {
      return stdError("UNAUTHORIZED", "Cron secret tidak valid.", 401);
    }
    const db = requireAdminDb();
    const now = new Date();
    const targetMonth = Number(url.searchParams.get("month") || now.getMonth() + 1);
    const targetYear = Number(url.searchParams.get("year") || now.getFullYear());
    const prev = new Date(targetYear, targetMonth - 2, 1);
    const pMonth = prev.getMonth() + 1;
    const pYear = prev.getFullYear();
    const onlyUid = url.searchParams.get("uid");

    const usersSnap = onlyUid
      ? { docs: [{ id: onlyUid }] }
      : await db.collection("users").select().get();

    let cloned = 0;
    for (const u of (usersSnap as { docs: { id: string }[] }).docs) {
      const uid = u.id;
      const prevSnap = await db.collection("users").doc(uid).collection("budgets")
        .where("year", "==", pYear).where("month", "==", pMonth).get();
      for (const d of prevSnap.docs) {
        const v = d.data();
        const newId = `${targetYear}_${targetMonth}_${v.categoryId}`;
        const newRef = db.collection("users").doc(uid).collection("budgets").doc(newId);
        const exists = await newRef.get();
        if (!exists.exists) {
          await newRef.set({
            categoryId: v.categoryId, monthlyLimit: Number(v.monthlyLimit || 0),
            month: targetMonth, year: targetYear, spentAmount: 0,
            usedPercentage: 0, status: "safe",
            updatedAt: new Date().toISOString(),
          });
          cloned++;
        }
      }
    }
    return stdSuccess({ targetMonth, targetYear, cloned });
  } catch (e: unknown) {
    return stdError("INTERNAL_ERROR", e instanceof Error ? e.message : "Gagal clone budget.", 500);
  }
}
