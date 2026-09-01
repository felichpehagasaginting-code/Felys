"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Moon,
  Sun,
  Settings,
  User,
  LogOut,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { ModeSwitcher } from "./ModeSwitcher";
import { Button } from "@/components/ui/Button";
import { useModeStore } from "@/stores/use-mode-store";
import { useAIStore } from "@/stores/use-ai-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { triggerHaptic } from "@/lib/haptics";

interface NavbarProps {
  onOpenQuickAdd?: () => void;
}

export function Navbar({ onOpenQuickAdd }: NavbarProps) {
  const { activeMode, setActiveMode } = useModeStore();
  const { toggleDrawer } = useAIStore();
  const { user, signOut } = useAuthStore();
  const [isDark, setIsDark] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  const toggleDarkMode = () => {
    triggerHaptic("light");
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleSettingsMenu = () => {
    triggerHaptic("medium");
    setIsSettingsOpen((prev) => !prev);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSettingsOpen]);

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-border transition-colors duration-300 pt-[env(safe-area-inset-top,0px)] safe-top">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo with Playful Spring Tilt & Spin on Hover */}
        <Link href="/" className="flex items-center gap-2 group select-none shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center shadow-soft transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-md shrink-0">
            <span className="text-white font-extrabold text-sm sm:text-base tracking-wider transition-transform duration-300 group-hover:scale-105">
              F
            </span>
          </div>
          <div className="hidden xs:flex flex-col">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-foreground flex items-center gap-1 group-hover:text-[#7C5CFA] transition-colors">
              Felys
              <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent transition-transform group-hover:scale-105">
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
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 relative">
          {/* Quick Add Button (Desktop & Tablet) */}
          {onOpenQuickAdd && (
            <Button
              onClick={onOpenQuickAdd}
              size="sm"
              variant={activeMode === "academic" ? "academic" : "finance"}
              className="hidden sm:inline-flex group"
            >
              <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
              <span>{activeMode === "academic" ? "Tugas Baru" : "Catat Uang"}</span>
            </Button>
          )}

          {/* AI Fio Trigger Button with Sparkle Micro-Interactions */}
          <button
            onClick={toggleDrawer}
            className="group relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-[#EDE5FF] to-[#E0FBF2] dark:from-[#383442] dark:to-[#26232E] border border-[#B69CFF]/40 text-[#7C5CFA] dark:text-[#B69CFF] text-xs font-semibold hover:shadow-soft hover:scale-105 active:scale-95 transition-all select-none"
            title="Buka Asisten AI Fio"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7C5CFA] animate-pulse transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125" />
            <span className="hidden md:inline">Tanya Fio</span>
            <span className="w-2 h-2 rounded-full bg-[#FF7A85] animate-ping absolute -top-0.5 -right-0.5" />
            <span className="w-2 h-2 rounded-full bg-[#FF7A85] absolute -top-0.5 -right-0.5" />
          </button>

          {/* Theme Toggle with 90° Orbit Spin on Hover */}
          <button
            onClick={toggleDarkMode}
            className="group p-1.5 sm:p-2 rounded-xl text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-90"
            title="Ganti Tema"
          >
            {isDark ? (
              <Sun className="w-4 h-4 transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 transition-transform duration-500 group-hover:-rotate-45 group-hover:scale-110 text-[#7C5CFA]" />
            )}
          </button>

          {/* Settings Menu Button with Smooth 180° Gear Spin on Hover & Toggle Popover */}
          <div className="relative" ref={settingsMenuRef}>
            <button
              onClick={toggleSettingsMenu}
              className={`group p-1.5 sm:p-2 rounded-xl transition-all active:scale-90 select-none ${
                isSettingsOpen
                  ? "bg-[#EDE5FF] dark:bg-[#383442] text-[#7C5CFA] ring-2 ring-[#7C5CFA]/40 shadow-soft"
                  : "text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
              }`}
              title="Pengaturan Cepat"
              aria-expanded={isSettingsOpen}
            >
              <Settings
                className={`w-4 h-4 transition-transform duration-500 ease-out ${
                  isSettingsOpen
                    ? "rotate-180 text-[#7C5CFA]"
                    : "group-hover:rotate-180"
                }`}
              />
            </button>

            {/* Interactive Settings Dropdown / Quick Preferences Menu */}
            {isSettingsOpen && (
              <div className="absolute right-0 top-12 w-72 sm:w-80 rounded-3xl bg-surface/95 dark:bg-[#26232E]/95 backdrop-blur-xl border border-border shadow-float p-4 space-y-3.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                {/* Profile Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center text-white font-extrabold text-sm shadow-soft">
                    {user?.displayName
                      ? user.displayName.charAt(0).toUpperCase()
                      : user?.email
                      ? user.email.charAt(0).toUpperCase()
                      : "F"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-foreground truncate">
                      {user?.displayName || "Mahasiswa Felys"}
                    </h4>
                    <p className="text-[10px] text-muted truncate">
                      {user?.email || "Belum Masuk Akun"}
                    </p>
                    {user ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#1F8766] dark:text-[#7FE3C0]">
                        <ShieldCheck className="w-3 h-3" /> Cloud Connected
                      </span>
                    ) : (
                      <span className="text-[9px] text-muted">Mode Demo Lokal</span>
                    )}
                  </div>
                </div>

                {/* Quick Mode Toggle */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                    Mode Aplikasi
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#EDEAF2] dark:bg-[#383442] rounded-2xl text-xs font-bold">
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        setActiveMode("academic");
                      }}
                      className={`py-1.5 rounded-xl transition-all ${
                        activeMode === "academic"
                          ? "bg-surface text-[#7C5CFA] shadow-xs"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      🎓 Akademik
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        setActiveMode("finance");
                      }}
                      className={`py-1.5 rounded-xl transition-all ${
                        activeMode === "finance"
                          ? "bg-surface text-[#1F8766] shadow-xs"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      💸 Finansial
                    </button>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-1 pt-1">
                  <Link
                    href="/settings"
                    onClick={() => setIsSettingsOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold text-foreground hover:bg-[#EDE5FF] dark:hover:bg-[#383442] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4 text-[#7C5CFA] transition-transform duration-500 group-hover:rotate-180" />
                      <span>Halaman Pengaturan Penuh</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* Footer Sign Out / Sign In */}
                <div className="pt-2 border-t border-border">
                  {user ? (
                    <button
                      onClick={() => {
                        triggerHaptic("medium");
                        setIsSettingsOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center justify-center gap-2 p-2 rounded-2xl text-xs font-bold text-[#D93D4A] hover:bg-[#FFE8EA] dark:hover:bg-[#382024] transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar Akun</span>
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsSettingsOpen(false)}
                      className="w-full flex items-center justify-center gap-2 p-2 rounded-2xl text-xs font-bold text-[#7C5CFA] hover:bg-[#EDE5FF] dark:hover:bg-[#383442] transition-colors"
                    >
                      <span>Masuk / Daftar Akun</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
