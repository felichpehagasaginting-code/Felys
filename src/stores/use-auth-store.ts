"use client";

import { create } from "zustand";
import { User, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  signOut: async () => {
    try {
      await fbSignOut(auth);
      set({ user: null });
    } catch (e) {
      console.error("Sign out error:", e);
    }
  },
}));

// Initialize listener
if (typeof window !== "undefined") {
  onAuthStateChanged(auth, (currentUser) => {
    useAuthStore.getState().setUser(currentUser);
  });
}
