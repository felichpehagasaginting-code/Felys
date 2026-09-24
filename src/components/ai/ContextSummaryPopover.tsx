"use client";

import React from "react";
import { Sparkles, Trophy, Wallet, CheckSquare, Calendar, ShieldCheck, X } from "lucide-react";
import { formatCurrencyIDR } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ContextSummaryPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  activeTasksCount: number;
  totalNetWorth: number;
  remainingBudget: number;
  isDeficit: boolean;
  ddayTitle?: string;
  ddayDaysLeft?: number | null;
  coursesCount: number;
}

export function ContextSummaryPopover({
  isOpen,
  onClose,
  activeTasksCount,
  totalNetWorth,
  remainingBudget,
  isDeficit,
  ddayTitle,
  ddayDaysLeft,
  coursesCount,
}: ContextSummaryPopoverProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="absolute top-16 left-4 right-4 z-40">
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="p-4 sm:p-5 rounded-3xl bg-surface/95 dark:bg-[#1C1A20]/95 backdrop-blur-2xl border border-[#7C5CFA]/30 shadow-2xl space-y-3.5 text-xs"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#7C5CFA]/15 text-[#7C5CFA] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-foreground text-xs">
                Data Real-Time Pengguna
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              title="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid Stats */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. D-Day Target */}
            <div className="p-2.5 rounded-2xl bg-[#EDE5FF]/40 dark:bg-[#2B2338]/40 border border-[#B69CFF]/30 space-y-1">
              <div className="flex items-center gap-1.5 text-muted text-[10px] font-bold">
                <Trophy className="w-3 h-3 text-[#7C5CFA]" />
                <span>Target D-Day</span>
              </div>
              <div className="font-extrabold text-foreground truncate">
                {ddayTitle || "Target Belum Diatur"}
              </div>
              <div className="text-[10px] text-[#7C5CFA] font-bold">
                {typeof ddayDaysLeft === "number"
                  ? ddayDaysLeft > 0
                    ? `H-${ddayDaysLeft}`
                    : ddayDaysLeft === 0
                    ? "Hari H!"
                    : "Selesai"
                  : "-"}
              </div>
            </div>

            {/* 2. Total Saldo Kas (Net Worth) */}
            <div className="p-2.5 rounded-2xl bg-[#E0FBF2]/40 dark:bg-[#1E2E28]/40 border border-[#7FE3C0]/30 space-y-1">
              <div className="flex items-center gap-1.5 text-muted text-[10px] font-bold">
                <Wallet className="w-3 h-3 text-[#1F8766]" />
                <span>Saldo Kas Aktif</span>
              </div>
              <div className="font-extrabold text-foreground truncate">
                {formatCurrencyIDR(totalNetWorth)}
              </div>
              <div
                className={`text-[10px] font-bold ${
                  isDeficit ? "text-[#D93D4A]" : "text-[#1F8766]"
                }`}
              >
                {isDeficit
                  ? `Defisit ${formatCurrencyIDR(Math.abs(remainingBudget))}`
                  : `Sisa ${formatCurrencyIDR(remainingBudget)}`}
              </div>
            </div>

            {/* 3. Tugas Aktif */}
            <div className="p-2.5 rounded-2xl bg-surface border border-border space-y-1">
              <div className="flex items-center gap-1.5 text-muted text-[10px] font-bold">
                <CheckSquare className="w-3 h-3 text-[#7C5CFA]" />
                <span>Beban Tugas</span>
              </div>
              <div className="font-extrabold text-foreground">
                {activeTasksCount} Tugas Aktif
              </div>
              <div className="text-[10px] text-muted">Diurutkan AI</div>
            </div>

            {/* 4. Mata Kuliah */}
            <div className="p-2.5 rounded-2xl bg-surface border border-border space-y-1">
              <div className="flex items-center gap-1.5 text-muted text-[10px] font-bold">
                <Calendar className="w-3 h-3 text-[#B69CFF]" />
                <span>Mata Kuliah</span>
              </div>
              <div className="font-extrabold text-foreground">
                {coursesCount} MK Terdaftar
              </div>
              <div className="text-[10px] text-muted">Semester Aktif</div>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted/80 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#7FE3C0] shrink-0" />
            <span>Fio membaca data secara realtime dengan isolasi akun ketat.</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
