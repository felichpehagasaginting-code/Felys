"use client";

import { create } from "zustand";

interface ModeState {
  activeMode: "academic" | "finance";
  setActiveMode: (mode: "academic" | "finance") => void;
  toggleMode: () => void;
  initMode: () => void;
}

const MODE_STORAGE_KEY = "felys_active_mode";

export const useModeStore = create<ModeState>((set, get) => ({
  activeMode: "academic",

  initMode: () => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY) as "academic" | "finance" | null;
      if (saved === "academic" || saved === "finance") {
        set({ activeMode: saved });
        document.documentElement.setAttribute("data-mode", saved);
      }
    } catch (e) {
      console.warn("Mode init warning:", e);
    }
  },

  setActiveMode: (mode) => {
    set({ activeMode: mode });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(MODE_STORAGE_KEY, mode);
      } catch (e) {}
      document.documentElement.setAttribute("data-mode", mode);
    }
  },

  toggleMode: () => {
    const next = get().activeMode === "academic" ? "finance" : "academic";
    get().setActiveMode(next);
  },
}));
