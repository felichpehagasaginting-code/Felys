"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileText,
  Flame,
  Calendar,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useDataStore } from "@/stores/use-data-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { DonutExpenseChart } from "@/components/finance/DonutExpenseChart";
import { Button } from "@/components/ui/Button";
import { formatCurrencyIDR } from "@/lib/utils";
import { generateFinancialStatementPDF } from "@/lib/pdf-generator";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";

export default function FinanceReportsPage() {
  const { getMonthlyBudgetSummary, getDailyAllowanceSummary, transactions } = useDataStore();
  const { user } = useAuthStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const summary = getMonthlyBudgetSummary();
  const daily = getDailyAllowanceSummary();

  const handleDownloadPDF = () => {
    try {
      setIsDownloading(true);
      triggerHaptic("medium");

      generateFinancialStatementPDF({
        studentName: user?.displayName || "Mahasiswa Felys",
        studentEmail: user?.email || "student@felys.app",
        summary,
        transactions,
        dailyAllowance: daily,
      });

      triggerHaptic("success");
      toast.success("Laporan Keuangan PDF berhasil diunduh!");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh dokumen PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            Laporan & Grafik Keuangan 📈
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Analisis alokasi uang, laju pengeluaran harian, dan laporan resmi uang saku.
          </p>
        </div>

        <Button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          variant="finance"
          size="md"
          className="rounded-2xl shadow-soft flex items-center gap-2 group"
          title="Unduh dokumen PDF A4 resmi siap kirim ke orang tua atau beasiswa"
        >
          <FileText className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span>{isDownloading ? "Menyiapkan PDF..." : "Unduh PDF untuk Ortu"}</span>
        </Button>
      </div>

      {/* Net Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-1">
          <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#1F8766]" />
            <span>Total Pemasukan</span>
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#1F8766] block tracking-tight">
            {formatCurrencyIDR(summary.totalIncome)}
          </span>
          <span className="text-[11px] text-muted font-medium block">
            Uang saku, gaji & transfer
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-1">
          <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <ArrowDownRight className="w-3.5 h-3.5 text-[#D93D4A]" />
            <span>Total Pengeluaran</span>
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#D93D4A] block tracking-tight">
            {formatCurrencyIDR(summary.totalSpent)}
          </span>
          <span className="text-[11px] text-muted font-medium block">
            {summary.totalIncome > 0
              ? `${Math.round((summary.totalSpent / summary.totalIncome) * 100)}% dari pemasukan`
              : "Bulan berjalan"}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-1">
          <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-[#7C5CFA]" />
            <span>Saldo Dompet Bersih</span>
          </span>
          <span
            className={`text-xl sm:text-2xl font-extrabold block tracking-tight ${
              summary.netSavings >= 0 ? "text-[#1F8766]" : "text-[#D93D4A]"
            }`}
          >
            {summary.netSavings < 0 ? "-" : ""}
            {formatCurrencyIDR(Math.abs(summary.netSavings))}
          </span>
          <span
            className={`text-[11px] font-medium block ${
              summary.netSavings >= 0 ? "text-[#1F8766]" : "text-[#D93D4A]"
            }`}
          >
            {summary.netSavings >= 0 ? "Surplus kas bulan ini" : "Defisit pengeluaran"}
          </span>
        </div>
      </div>

      {/* Burn Rate Forecast & Cashflow Velocity Card */}
      <div className="p-6 rounded-3xl bg-surface border border-border shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF7A85] to-[#FFC978] flex items-center justify-center text-white shadow-soft shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Analisis Kecepatan Belanja (*Burn Rate Velocity*)
              </h3>
              <p className="text-xs text-muted">
                Proyeksi ketahanan saldo kas mahasiswa berdasarkan tren belanja harian.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                daily.isCriticalBurn
                  ? "bg-[#FFE8EA] text-[#D93D4A]"
                  : "bg-[#E0FBF2] text-[#1F8766]"
              }`}
            >
              {daily.isCriticalBurn ? "⚠️ Burn Rate Tinggi" : "✓ Ritme Pengeluaran Stabil"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#FAF9FC] dark:bg-[#2A2634] border border-border/80 text-xs">
          <div>
            <span className="text-muted block font-semibold">Rata-rata Pengeluaran:</span>
            <span className="text-base font-extrabold text-foreground mt-0.5 block">
              {formatCurrencyIDR(daily.dailyBurnRate)} / hari
            </span>
          </div>
          <div>
            <span className="text-muted block font-semibold">Jatah Belanja Aman:</span>
            <span className="text-base font-extrabold text-[#1F8766] mt-0.5 block">
              {formatCurrencyIDR(daily.dailyAllowance)} / hari
            </span>
          </div>
          <div>
            <span className="text-muted block font-semibold">Prediksi Tanggal Saldo Kritis:</span>
            <span
              className={`text-base font-extrabold mt-0.5 block ${
                daily.projectedBurnDate ? "text-[#D93D4A]" : "text-[#1F8766]"
              }`}
            >
              {daily.projectedBurnDate ? `Sekitar ${daily.projectedBurnDate}` : "Aman Hingga Akhir Bulan ✨"}
            </span>
          </div>
        </div>
      </div>

      {/* Donut Chart & Category Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-6 rounded-3xl bg-surface border border-border shadow-soft space-y-3">
          <h3 className="text-sm font-bold text-foreground">Distribusi Kategori</h3>
          <DonutExpenseChart budgets={summary.categories} />
        </div>

        <div className="lg:col-span-7 p-6 rounded-3xl bg-surface border border-border shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-foreground">Rincian Per Kategori</h3>
          <div className="divide-y divide-border">
            {summary.categories.map((cat) => (
              <div key={cat.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.categoryColor }}
                  />
                  <div>
                    <span className="font-bold text-foreground block">{cat.categoryName}</span>
                    <span className="text-[10px] text-muted">
                      {cat.isEssential ? "Kebutuhan Esensial" : "Non-esensial"}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-foreground block">
                    {formatCurrencyIDR(cat.spentAmount)}
                  </span>
                  <span className="text-[10px] text-muted">
                    {cat.monthlyLimit > 0 ? `${cat.usedPercentage}% dari limit` : "Tidak ada limit"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
