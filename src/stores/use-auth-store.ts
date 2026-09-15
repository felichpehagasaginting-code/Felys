"use client";

import { create } from "zustand";
import { User, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useDataStore } from "./use-data-store";
import { useAIStore } from "./use-ai-store";
import { usePomodoroStore } from "./use-pomodoro-store";
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
      if (activeSyncUnsubscribe) {
        activeSyncUnsubscribe();
        activeSyncUnsubscribe = null;
      }
      await fbSignOut(auth);
      await clearSession().catch(() => {});
      saveCachedName(null);
      set({ user: null, cachedDisplayName: null });

      // Clean all in-memory stores and local storage to prevent data leakage between users
      useDataStore.getState().resetDataStore();
      useAIStore.getState().resetAIStore();
      usePomodoroStore.getState().resetPomodoroStore();
    } catch (e) {
      console.error("Sign out error:", e);
    }
  },
}));

let activeSyncUnsubscribe: (() => void) | null = null;

// Initialize global auth listener with comprehensive Firestore synchronization
if (typeof window !== "undefined") {
  onAuthStateChanged(auth, async (currentUser) => {
    useAuthStore.getState().setUser(currentUser);

    if (currentUser) {
      // 1. Migrate any guest data created before login into this Google account in Firestore
      await FirestoreService.migrateLocalGuestData(currentUser.uid);

      // 2. Sync profile document /users/{userId}
      await FirestoreService.syncUserProfile(currentUser.uid, {
        id: currentUser.uid,
        name: currentUser.displayName || "Mahasiswa Felys",
        email: currentUser.email || "",
        photoURL: currentUser.photoURL || null,
      }).catch((e) => console.warn("Profile sync error:", e));

      // 3. Stop previous listener if any
      if (activeSyncUnsubscribe) {
        activeSyncUnsubscribe();
        activeSyncUnsubscribe = null;
      }

      // 4. Instantly start real-time Firestore sync across all stores
      const unsubData = useDataStore.getState().initFirestoreSync(currentUser.uid);
      const unsubAI = useAIStore.getState().initFirestoreSync(currentUser.uid);
      const unsubPomodoro = usePomodoroStore.getState().initFirestoreSync(currentUser.uid);

      activeSyncUnsubscribe = () => {
        unsubData();
        unsubAI();
        unsubPomodoro();
      };

      // 5. Trigger background user summary metrics update for Firebase Console admin visibility
      fetch("/api/user/sync-stats", { method: "POST" }).catch(() => {});
    } else {
      // User is logged out or unauthenticated: teardown listeners & clean memory
      if (activeSyncUnsubscribe) {
        activeSyncUnsubscribe();
        activeSyncUnsubscribe = null;
      }
      useDataStore.getState().resetDataStore();
      useAIStore.getState().resetAIStore();
      usePomodoroStore.getState().resetPomodoroStore();
    }
  });
}
