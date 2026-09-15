import { getVerifiedUid } from "@/lib/firebase/auth-helpers";
import { UserMetricsService } from "@/server/services/user-metrics.service";
import { stdSuccess, stdError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) {
      return stdError("UNAUTHORIZED", "Belum terautentikasi.", 401);
    }

    const metrics = await UserMetricsService.recalculateAndSync(uid);
    return stdSuccess(metrics);
  } catch (err: any) {
    return stdError("INTERNAL_ERROR", err.message || "Gagal menyinkronkan ringkasan metrik pengguna.", 500);
  }
}
