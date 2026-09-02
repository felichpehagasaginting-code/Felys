"use client";

import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const STORAGE_KEY = "felys_theme_preference";

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  resolvedTheme: "light",

  initTheme: () => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      let effectiveTheme: ThemeMode = saved || "light";

      // If user hasn't explicitly set, check system preference
      let resolved: "light" | "dark" = "light";
      if (effectiveTheme === "system") {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        resolved = effectiveTheme === "dark" ? "dark" : "light";
      }

      if (resolved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      set({ theme: effectiveTheme, resolvedTheme: resolved });
    } catch (e) {
      console.warn("Theme init warning:", e);
    }
  },

  setTheme: (theme: ThemeMode) => {
    let resolved: "light" | "dark" = "light";
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {}

      if (theme === "system") {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        resolved = theme === "dark" ? "dark" : "light";
      }

      if (resolved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    set({ theme, resolvedTheme: resolved });
  },

  toggleTheme: () => {
    const currentResolved = get().resolvedTheme;
    const nextTheme = currentResolved === "dark" ? "light" : "dark";
    get().setTheme(nextTheme);
  },
}));
