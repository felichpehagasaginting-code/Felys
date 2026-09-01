"use client";

import React from "react";
import { useDataStore } from "@/stores/use-data-store";
import { formatCurrencyIDR } from "@/lib/utils";
import { Sparkles, TrendingDown, AlertTriangle, CheckCircle2, ShieldCheck, Flame } from "lucide-react";

export function DailyAllowanceCard() {
  const { getDailyAllowanceSummary } = useDataStore();
  const daily = getDailyAllowanceSummary();

  const percentageUsed = daily.dailyAllowance > 0
    ? Math.min(100, Math.round((daily.todaySpent / daily.dailyAllowance) * 100))
    : daily.todaySpent > 0 ? 100 : 0;

  return (
    <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-3.5 relative overflow-hidden group">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7FE3C0] to-[#37B98F] flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">
              Jatah Belanja Aman Hari Ini
            </h3>
            <p className="text-[10px] text-muted">
              Dihitung dari sisa saldo setelah tagihan rutin ({daily.remainingDays} hari tersisa)
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
            daily.isOverDailyLimit
              ? "bg-[#FFE8EA] text-[#D93D4A]"
              : percentageUsed > 80
              ? "bg-[#FFF4E5] text-[#B86B14]"
              : "bg-[#E0FBF2] text-[#1F8766]"
          }`}
        >
          {daily.isOverDailyLimit
            ? "Melebihi Jatah"
            : `${percentageUsed}% Terpakai`}
        </span>
      </div>

      {/* Main Numbers */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#2A2634] border border-border/80 text-center">
        <div>
          <span className="text-[10px] font-bold text-muted block">Jatah Harian</span>
          <span className="text-xs sm:text-sm font-extrabold text-foreground mt-0.5 block truncate">
            {formatCurrencyIDR(daily.dailyAllowance)}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-muted block">Keluar Hari Ini</span>
          <span className="text-xs sm:text-sm font-extrabold text-[#D93D4A] mt-0.5 block truncate">
            {formatCurrencyIDR(daily.todaySpent)}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-muted block">Sisa Jatah Hari Ini</span>
          <span
            className={`text-xs sm:text-sm font-extrabold mt-0.5 block truncate ${
              daily.todayRemaining < 0 ? "text-[#D93D4A]" : "text-[#1F8766]"
            }`}
          >
            {daily.todayRemaining < 0 ? "-" : "+"}
            {formatCurrencyIDR(Math.abs(daily.todayRemaining))}
          </span>
        </div>
      </div>

      {/* Daily Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-2.5 bg-[#EDEAF2] dark:bg-[#383442] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              daily.isOverDailyLimit
                ? "bg-[#FF7A85]"
                : percentageUsed > 80
                ? "bg-[#FFC978]"
                : "bg-[#7FE3C0]"
            }`}
            style={{ width: `${percentageUsed}%` }}
          />
        </div>
      </div>

      {/* Burn Rate Forecast Warning */}
      {daily.projectedBurnDate && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FFF4E5] dark:bg-[#382B1E] border border-[#FFD59E]/60 text-[11px] text-[#B86B14] dark:text-[#FFC978]">
          <Flame className="w-4 h-4 shrink-0 text-[#E87A1E] animate-pulse" />
          <span className="leading-tight">
            <b>Peringatan Burn Rate:</b> Rata-rata pengeluaran <b>{formatCurrencyIDR(daily.dailyBurnRate)}/hari</b>. Saldo diproyeksikan habis pada <b>{daily.projectedBurnDate}</b>.
          </span>
        </div>
      )}
    </div>
  );
}
