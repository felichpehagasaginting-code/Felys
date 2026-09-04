"use client";

import React from "react";
import Link from "next/link";
import { Settings, User, Moon, Sun, Laptop, Layers, Sparkles, LogOut, LogIn, ShieldCheck } from "lucide-react";
import { useModeStore } from "@/stores/use-mode-store";
import { useThemeStore } from "@/stores/use-theme-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/Button";
import { triggerHaptic } from "@/lib/haptics";

export default function SettingsPage() {
  const { activeMode, setActiveMode } = useModeStore();
  const { theme, setTheme } = useThemeStore();
  const { user, signOut, cachedDisplayName } = useAuthStore();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5 group">
          <span>Pengaturan Akun & Aplikasi</span>
          <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-[#7C5CFA] transition-transform duration-700 ease-out group-hover:rotate-180" />
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Kelola preferensi akun Firebase, tema tampilan perangkat, dan AI assistant.
        </p>
      </div>

      <div className="space-y-4">
        {/* Real Profile Card */}
        {user ? (
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center text-white font-extrabold text-xl shadow-soft">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {user.displayName || cachedDisplayName || "Mahasiswa Felys"}
                </h3>
                <p className="text-xs text-muted">{user.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E0FBF2] text-[#1F8766] border border-[#9EE9D0] dark:bg-[#1E332A] dark:text-[#7FE3C0] dark:border-[#2E5244]">
                  <ShieldCheck className="w-3 h-3" /> Cloud Firestore Connected
                </span>
              </div>
            </div>

            <Button
              onClick={() => {
                triggerHaptic("medium");
                signOut();
              }}
              variant="secondary"
              size="sm"
              className="rounded-xl border-[#FF7A85]/40 text-[#D93D4A] hover:bg-[#FFE8EA] dark:hover:bg-[#382329] self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Akun</span>
            </Button>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Belum Masuk Akun</h3>
              <p className="text-xs text-muted">
                Masuk atau daftar untuk menyinkronkan data tugas dan transaksi kamu secara real-time ke Cloud Firestore.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="academic" size="sm" className="rounded-xl">
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Akun</span>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Theme Preference (Per-Device Persistence) */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Tema Tampilan (Tersimpan di Perangkat Ini)</span>
            </h3>
            <span className="text-[10px] font-semibold text-muted bg-surface border border-border px-2 py-0.5 rounded-full">
              {theme === "dark" ? "Mode Gelap 🌙" : theme === "light" ? "Mode Terang ☀️" : "Sistem Otomatis 💻"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                triggerHaptic("light");
                setTheme("light");
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                theme === "light"
                  ? "bg-[#EDE5FF] dark:bg-[#383442] border-[#7C5CFA] ring-2 ring-[#7C5CFA] shadow-soft"
                  : "bg-surface border-border hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-foreground block">Mode Terang</span>
              </div>
              <span className="text-[11px] text-muted block">
                Tampilan bersih & kontras cerah
              </span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setTheme("dark");
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                theme === "dark"
                  ? "bg-[#EDE5FF] dark:bg-[#383442] border-[#7C5CFA] ring-2 ring-[#7C5CFA] shadow-soft"
                  : "bg-surface border-border hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Moon className="w-4 h-4 text-[#B69CFF]" />
                <span className="text-xs font-bold text-foreground block">Mode Gelap</span>
              </div>
              <span className="text-[11px] text-muted block">
                Nyaman di mata saat malam & hemat baterai OLED
              </span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setTheme("system");
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                theme === "system"
                  ? "bg-[#EDE5FF] dark:bg-[#383442] border-[#7C5CFA] ring-2 ring-[#7C5CFA] shadow-soft"
                  : "bg-surface border-border hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Laptop className="w-4 h-4 text-[#37B98F]" />
                <span className="text-xs font-bold text-foreground block">Ikuti Sistem</span>
              </div>
              <span className="text-[11px] text-muted block">
                Otomatis menyesuaikan mode OS HP/Laptop
              </span>
            </button>
          </div>
        </div>

        {/* Mode Preference (Last Open Persistence) */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-soft space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <span>Mode Default Saat Buka Aplikasi ("Last Open")</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveMode("academic");
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeMode === "academic"
                  ? "bg-[#EDE5FF] dark:bg-[#383442] border-[#7C5CFA] ring-2 ring-[#7C5CFA] shadow-soft"
                  : "bg-surface border-border hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <span className="text-xs font-bold text-foreground block">Mode Akademik 🎓</span>
              <span className="text-[11px] text-muted block mt-0.5">
                Fokus manajemen tugas & deadline kuliah
              </span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveMode("finance");
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeMode === "finance"
                  ? "bg-[#E0FBF2] dark:bg-[#213831] border-[#37B98F] ring-2 ring-[#7FE3C0] shadow-soft"
                  : "bg-surface border-border hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <span className="text-xs font-bold text-foreground block">Mode Keuangan 💸</span>
              <span className="text-[11px] text-muted block mt-0.5">
                Fokus pencatatan uang saku, rekening & budget
              </span>
            </button>
          </div>
        </div>

        {/* AI Persona Info */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#EDE5FF]/60 to-[#E0FBF2]/60 dark:from-[#252033] dark:to-[#1B2924] border border-[#B69CFF]/30 shadow-soft space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7C5CFA] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Fio Assistant Engine</h3>
              <span className="text-[11px] text-muted">Powered by Google Gemini (Live API Connected)</span>
            </div>
          </div>
          <p className="text-xs text-muted leading-relaxed pt-1">
            Fio terus menganalisis beban tugas dan pengeluaran kamu secara cerdas tanpa menghakimi,
            agar kehidupan kuliah kamu tetap terkendali dan tenang.
          </p>
        </div>
      </div>
    </div>
  );
}
