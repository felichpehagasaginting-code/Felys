"use client";

import { create } from "zustand";
import { User, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useDataStore } from "./use-data-store";
import { FirestoreService } from "@/lib/firebase/firestore-service";
import { clearSession } from "@/lib/auth-session-client";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  /** Nama panggilan cache (localStorage) — tampil instant sebelum Auth resolve. */
  cachedDisplayName: string | null;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
}

function loadCachedName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("felys_display_name");
  } catch {
    return null;
  }
}

function saveCachedName(name: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (name) localStorage.setItem("felys_display_name", name);
    else localStorage.removeItem("felys_display_name");
  } catch {}
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  cachedDisplayName: loadCachedName(),
  setUser: (user) => {
    const first = user?.displayName?.split(" ")[0] || null;
    if (first) {
      saveCachedName(first);
      set({ user, isLoading: false, cachedDisplayName: first });
    } else {
      set({ user, isLoading: false });
    }
  },
  signOut: async () => {
    try {
      await fbSignOut(auth);
      saveCachedName(null);
      set({ user: null, cachedDisplayName: null });
      useDataStore.getState().resetDataStore();
    } catch (e) {
      console.error("Sign out error:", e);
    }
  },
}));

// Initialize global auth listener
if (typeof window !== "undefined") {
  onAuthStateChanged(auth, (currentUser) => {
    useAuthStore.getState().setUser(currentUser);
    if (currentUser) {
      FirestoreService.syncUserProfile(currentUser.uid, {
        id: currentUser.uid,
        name: currentUser.displayName || "Mahasiswa Felys",
        email: currentUser.email || "",
        photoURL: currentUser.photoURL || null,
      }).catch((e) => console.warn("Profile sync error:", e));

      // Instantly start real-time Firestore sync on any device
      useDataStore.getState().initFirestoreSync(currentUser.uid);
    }
  });
}
