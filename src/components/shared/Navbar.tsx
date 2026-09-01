"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Plus, Moon, Sun, Settings } from "lucide-react";
import { ModeSwitcher } from "./ModeSwitcher";
import { Button } from "@/components/ui/Button";
import { useModeStore } from "@/stores/use-mode-store";
import { useAIStore } from "@/stores/use-ai-store";

interface NavbarProps {
  onOpenQuickAdd?: () => void;
}

export function Navbar({ onOpenQuickAdd }: NavbarProps) {
  const { activeMode } = useModeStore();
  const { toggleDrawer } = useAIStore();
  const [isDark, setIsDark] = React.useState(false);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group select-none shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform shrink-0">
            <span className="text-white font-extrabold text-sm sm:text-base tracking-wider">F</span>
          </div>
          <div className="hidden xs:flex flex-col">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-foreground flex items-center gap-1">
              Felys
              <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent">
                AI
              </span>
            </span>
          </div>
        </Link>

        {/* Center: Persistent Mode Switcher */}
        <div className="flex items-center shrink-0">
          <ModeSwitcher />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Add Button (Desktop & Tablet) */}
          {onOpenQuickAdd && (
            <Button
              onClick={onOpenQuickAdd}
              size="sm"
              variant={activeMode === "academic" ? "academic" : "finance"}
              className="hidden sm:inline-flex"
            >
              <Plus className="w-4 h-4" />
              <span>{activeMode === "academic" ? "Tugas Baru" : "Catat Uang"}</span>
            </Button>
          )}

          {/* AI Fio Trigger Button */}
          <button
            onClick={toggleDrawer}
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-[#EDE5FF] to-[#E0FBF2] dark:from-[#383442] dark:to-[#26232E] border border-[#B69CFF]/40 text-[#7C5CFA] dark:text-[#B69CFF] text-xs font-semibold hover:shadow-soft hover:scale-105 transition-all select-none"
            title="Buka Asisten AI Fio"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7C5CFA] animate-pulse" />
            <span className="hidden md:inline">Tanya Fio</span>
            <span className="w-2 h-2 rounded-full bg-[#FF7A85] animate-ping absolute -top-0.5 -right-0.5" />
            <span className="w-2 h-2 rounded-full bg-[#FF7A85] absolute -top-0.5 -right-0.5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 sm:p-2 rounded-xl text-muted hover:text-foreground hover:bg-black/5 transition-colors"
            title="Ganti Tema"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings Link */}
          <Link
            href="/settings"
            className="p-1.5 sm:p-2 rounded-xl text-muted hover:text-foreground hover:bg-black/5 transition-colors"
            title="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
