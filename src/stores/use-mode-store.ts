"use client";

import { create } from "zustand";

interface ModeState {
  activeMode: "academic" | "finance";
  setActiveMode: (mode: "academic" | "finance") => void;
  toggleMode: () => void;
}

export const useModeStore = create<ModeState>((set, get) => ({
  activeMode: "academic",
  setActiveMode: (mode) => {
    set({ activeMode: mode });
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-mode", mode);
    }
  },
  toggleMode: () => {
    const next = get().activeMode === "academic" ? "finance" : "academic";
    get().setActiveMode(next);
  },
}));
