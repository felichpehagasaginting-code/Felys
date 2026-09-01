"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Settings, User, Moon, Sun, BookOpen, Layers, Sparkles, LogOut, LogIn } from "lucide-react";
import { useModeStore } from "@/stores/use-mode-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { useDataStore } from "@/stores/use-data-store";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { activeMode, setActiveMode } = useModeStore();
  const { user, signOut } = useAuthStore();
  const { refreshInsights } = useDataStore();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5 group">
          <span>Pengaturan Akun & Aplikasi</span>
          <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-[#7C5CFA] transition-transform duration-700 ease-out group-hover:rotate-180" />
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Kelola preferensi akun Firebase, mode tampilan, dan AI assistant.
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
                  {user.displayName || "Mahasiswa Felys"}
                </h3>
                <p className="text-xs text-muted">{user.email}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E0FBF2] text-[#1F8766] border border-[#9EE9D0]">
                  Cloud Firestore Connected (UID: {user.uid.slice(0, 8)}...)
                </span>
              </div>
            </div>

            <Button
              onClick={() => signOut()}
              variant="secondary"
              size="sm"
              className="rounded-xl border-[#FF7A85]/40 text-[#D93D4A] hover:bg-[#FFE8EA] self-start sm:self-auto"
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

        {/* Mode Preference */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-soft space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <span>Mode Default Saat Buka Aplikasi</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setActiveMode("academic")}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeMode === "academic"
                  ? "bg-[#EDE5FF] dark:bg-[#383442] border-[#7C5CFA] ring-2 ring-[#7C5CFA]"
                  : "bg-[#FAF9FC] dark:bg-[#2F2B3A] border-border hover:bg-black/5"
              }`}
            >
              <span className="text-xs font-bold text-foreground block">Mode Akademik 🎓</span>
              <span className="text-[11px] text-muted block mt-0.5">
                Fokus manajemen tugas & deadline kuliah
              </span>
            </button>

            <button
              onClick={() => setActiveMode("finance")}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeMode === "finance"
                  ? "bg-[#E0FBF2] dark:bg-[#213831] border-[#37B98F] ring-2 ring-[#7FE3C0]"
                  : "bg-[#FAF9FC] dark:bg-[#2F2B3A] border-border hover:bg-black/5"
              }`}
            >
              <span className="text-xs font-bold text-foreground block">Mode Keuangan 💸</span>
              <span className="text-[11px] text-muted block mt-0.5">
                Fokus pencatatan uang saku & budget
              </span>
            </button>
          </div>
        </div>

        {/* AI Persona Info */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#EDE5FF]/60 to-[#E0FBF2]/60 dark:from-[#2A2338] dark:to-[#1E2E28] border border-[#B69CFF]/30 shadow-soft space-y-2">
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
            agar kehidupan kuliah kamu tetap terkendali.
          </p>
        </div>
      </div>
    </div>
  );
}
