import { adminAuth } from "@/lib/firebase/admin";
import { stdSuccess, stdError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_COOKIE = "__session";
// 5 hari, sesuai Firebase session cookie max (14 hari)
const EXPIRES_IN = 5 * 24 * 60 * 60 * 1000;

/**
 * POST /api/auth/session — tukar Firebase ID token jadi HTTP-only session cookie.
 * Spec: API-SPEC.md §2.1. Non-blocking: klien tetap bisa jalan murni
 * client-SDK bila Admin SDK belum dikonfigurasi (balas 503, bukan 500 misterius).
 */
export async function POST(req: Request) {
  try {
    if (!adminAuth) {
      return stdError(
        "SERVICE_UNAVAILABLE",
        "Server auth belum dikonfigurasi (FIREBASE_* env). Login tetap berjalan via client SDK.",
        503
      );
    }
    const body = await req.json().catch(() => ({}));
    const idToken = String(body?.idToken || "");
    if (!idToken) return stdError("BAD_REQUEST", "idToken wajib diisi.", 400);

    // Verifikasi dulu agar token palsu tidak jadi cookie
    await adminAuth.verifyIdToken(idToken, true);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: EXPIRES_IN });

    const res = stdSuccess(null, "Session berhasil dibuat.");
    res.headers.set(
      "Set-Cookie",
      `${SESSION_COOKIE}=${encodeURIComponent(sessionCookie)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${EXPIRES_IN / 1000}${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Gagal membuat session.";
    const code = /expired|revoked|invalid/i.test(msg) ? 401 : 500;
    return stdError(code === 401 ? "UNAUTHORIZED" : "INTERNAL_ERROR", msg, code);
  }
}

/**
 * DELETE /api/auth/session — hapus cookie + revoke refresh token.
 * Spec: API-SPEC.md §2.2.
 */
export async function DELETE(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/(?:^|;\s*)__session=([^;]+)/);
    if (match && adminAuth) {
      try {
        const decoded = await adminAuth.verifySessionCookie(decodeURIComponent(match[1]), true);
        if (decoded?.sub) await adminAuth.revokeRefreshTokens(decoded.sub).catch(() => {});
      } catch {
        // cookie basi/invalid — tetap lanjut hapus cookie
      }
    }
    const res = stdSuccess(null, "Session dihapus.");
    res.headers.set(
      "Set-Cookie",
      `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );
    return res;
  } catch (e: unknown) {
    return stdError("INTERNAL_ERROR", e instanceof Error ? e.message : "Gagal logout session.", 500);
  }
}
