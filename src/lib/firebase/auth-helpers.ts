import { adminAuth, adminDb } from "@/lib/firebase/admin";

/**
 * Resolve UID from __session cookie (preferred) or Bearer ID token.
 * Returns null when unauthenticated. Never trust client headers/IP.
 */
export async function getVerifiedUid(req: Request): Promise<string | null> {
  try {
    const cookie = req.headers.get("cookie") || "";
    const sessionMatch = cookie.match(/(?:^|;\s*)__session=([^;]+)/);
    if (sessionMatch && adminAuth) {
      try {
        const decoded = await adminAuth.verifySessionCookie(decodeURIComponent(sessionMatch[1]), true);
        if (decoded?.uid) return decoded.uid;
      } catch {
        // fall through to Bearer check
      }
    }
    const authHeader = req.headers.get("authorization") || "";
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    if (m && adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(m[1], true);
        if (decoded?.uid) return decoded.uid;
      } catch {
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function requireAdminDb() {
  if (!adminDb) throw new Error("Firestore Admin tidak terinisialisasi. Cek FIREBASE_* env.");
  return adminDb;
}
