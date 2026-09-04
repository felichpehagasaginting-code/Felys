"use client";

import type { User } from "firebase/auth";

/**
 * Helper session klien (non-blocking).
 * - Coba buat __session http-only via /api/auth/session (untuk API server-side).
 * - Selalu set hint cookie `felys_auth=1` agar navigasi tidak mengandalkan
 *   cookie http-only yang tidak terbaca JS.
 * - Kegagalan session TIDAK boleh menggagalkan login: Firestore client-SDK
 *   + API Bearer token tetap berfungsi penuh.
 */
export async function establishSession(user: User): Promise<void> {
  try {
    const idToken = await user.getIdToken();
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }).catch(() => null);
  } catch {
    // abaikan — login tetap valid via Firebase client auth
  }
  try {
    document.cookie = "felys_auth=1; Path=/; SameSite=Lax; Max-Age=2592000";
  } catch {
    // abaikan
  }
}

export async function clearSession(): Promise<void> {
  try {
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => null);
  } catch {
    // abaikan
  }
  try {
    document.cookie = "felys_auth=; Path=/; SameSite=Lax; Max-Age=0";
  } catch {
    // abaikan
  }
}
