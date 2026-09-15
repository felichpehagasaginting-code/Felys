import { getVerifiedUid, requireAdminDb } from "@/lib/firebase/auth-helpers";
import { stdSuccess, stdError } from "@/lib/validation";
import { PushDispatcherService } from "@/server/services/push-dispatcher.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * P9: Cron pengingat proaktif.
 * GET /api/cron/reminders?secret=&uid= — kumpulkan deadline H-1/H-3,
 * budget >=90%, dan kirim notifikasi push langsung ke perangkat pengguna.
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
    const out: Record<string, { notes: string[]; pushSent: number; pushFailed: number }> = {};
    const now = new Date();

    for (const u of users) {
      const uid = u.id;
      const notes: string[] = [];
      const tasks = await db.collection("users").doc(uid).collection("tasks")
        .where("status", "in", ["todo", "in_progress"]).get();
      for (const d of tasks.docs) {
        const t = d.data() as { title: string; deadline: string };
        if (!t.deadline) continue;
        const days = Math.ceil((new Date(t.deadline).getTime() - now.getTime()) / 86400_000);
        if (days === 1) notes.push(`Besok deadline: ${t.title}`);
        else if (days === 3) notes.push(`3 hari lagi: ${t.title}`);
        else if (days < 0) notes.push(`Terlewat: ${t.title} — segera reschedule`);
      }
      const budgets = await db.collection("users").doc(uid).collection("budgets")
        .where("status", "in", ["warning", "overbudget"]).get();
      for (const d of budgets.docs) {
        const b = d.data() as { categoryName?: string; status: string; usedPercentage: number };
        notes.push(`Budget ${b.categoryName || d.id} ${b.status} (${b.usedPercentage || "?"}%)`);
      }

      let pushSent = 0;
      let pushFailed = 0;

      if (notes.length > 0) {
        const pushResult = await PushDispatcherService.sendPushToUser(uid, {
          title: `Pengingat Penting Felys (${notes.length})`,
          body: notes.slice(0, 2).join(" • ") + (notes.length > 2 ? ` (+${notes.length - 2} lainnya)` : ""),
          url: "/",
          tag: `felys-reminder-${uid}`,
        });
        pushSent = pushResult.sent;
        pushFailed = pushResult.failed;
        out[uid] = { notes, pushSent, pushFailed };
      }
    }
    return stdSuccess(out);
  } catch (e: unknown) {
    return stdError("INTERNAL_ERROR", e instanceof Error ? e.message : "Gagal reminders.", 500);
  }
}
