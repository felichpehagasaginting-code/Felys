import { getVerifiedUid } from "@/lib/firebase/auth-helpers";
import { PushDispatcherService } from "@/server/services/push-dispatcher.service";
import { stdSuccess, stdError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) {
      return stdError("UNAUTHORIZED", "Kamu harus masuk akun terlebih dahulu.", 401);
    }

    const { title, body } = await req.json().catch(() => ({}));

    const result = await PushDispatcherService.sendPushToUser(uid, {
      title: title || "Halo dari Felys! ✨",
      body: body || "Uji coba notifikasi push latar belakang berhasil. Kamu siap menerima pengingat deadline & budget!",
      url: "/settings",
      tag: "felys-test-push",
    });

    if (result.sent === 0 && result.failed === 0) {
      return stdError(
        "NO_SUBSCRIPTION",
        "Belum ada perangkat terdaftar untuk notifikasi push. Pastikan kamu sudah klik 'Aktifkan Notifikasi' di perangkat ini.",
        400
      );
    }

    return stdSuccess({
      message: "Notifikasi percobaan berhasil dikirim.",
      sent: result.sent,
      failed: result.failed,
    });
  } catch (err: any) {
    console.error("Test push error:", err);
    return stdError("INTERNAL_ERROR", err.message || "Gagal mengirim notifikasi percobaan.", 500);
  }
}
