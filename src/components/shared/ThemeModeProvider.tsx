"use client";

import React, { useEffect } from "react";
import { useThemeStore } from "@/stores/use-theme-store";
import { useModeStore } from "@/stores/use-mode-store";

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const { initTheme } = useThemeStore();
  const { initMode } = useModeStore();

  useEffect(() => {
    initTheme();
    initMode();

    // Listen to OS theme changes if user has 'system' theme
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const saved = localStorage.getItem("felys_theme_preference");
      if (saved === "system" || !saved) {
        if (mediaQuery.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [initTheme, initMode]);

  return <>{children}</>;
}
