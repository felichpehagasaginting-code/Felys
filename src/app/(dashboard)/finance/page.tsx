"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Wallet, PieChart as PieChartIcon, Camera, CalendarClock, Users } from "lucide-react";
import { useDataStore } from "@/stores/use-data-store";
import { TransactionCard } from "@/components/finance/TransactionCard";
import { MetricCardSkeleton, ChartSkeleton, ListSkeleton } from "@/components/ui/Skeleton";
// P10: heavy components lazy-loaded (recharts/tesseract/unpdf hanya saat dibuka)
const DonutExpenseChart = dynamic(() => import("@/components/finance/DonutExpenseChart").then((m) => m.DonutExpenseChart), { ssr: false, loading: () => <ChartSkeleton /> });
const NumpadQuickEntry = dynamic(() => import("@/components/finance/NumpadQuickEntry").then((m) => m.NumpadQuickEntry), { ssr: false });
const ReceiptScanModal = dynamic(() => import("@/components/finance/ReceiptScanModal").then((m) => m.ReceiptScanModal), { ssr: false });
import { RecurringBillsModal } from "@/components/finance/RecurringBillsModal";
import { SplitBillModal } from "@/components/finance/SplitBillModal";
import { SavingsGoalModal } from "@/components/finance/SavingsGoalModal";
import { EmergencyFundModal } from "@/components/finance/EmergencyFundModal";
import { NLPQuickBar } from "@/components/shared/NLPQuickBar";
import { DailyAllowanceCard } from "@/components/finance/DailyAllowanceCard";
import { AccountOverviewGrid } from "@/components/finance/AccountOverviewGrid";
import { Button } from "@/components/ui/Button";
import { formatCurrencyIDR, cn } from "@/lib/utils";
import { Target, Shield } from "lucide-react";

export default function FinanceTransactionsPage() {
  const { transactions, categories, getMonthlyBudgetSummary, emergencyFund, isLoaded } = useDataStore();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "expense" | "income">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);
  const [isSavingsGoalOpen, setIsSavingsGoalOpen] = useState(false);
  const [isEmergencyFundOpen, setIsEmergencyFundOpen] = useState(false);

  // Fresh-boot: sync belum tiba + cache kosong → skeleton (bukan empty state palsu)
  if (!isLoaded && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
        <ChartSkeleton />
        <ListSkeleton rows={4} variant="transaction" />
      </div>
    );
  }

  const summary = getMonthlyBudgetSummary();

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  // Filter transactions
  const filteredTransactions = transactions.filter((trx) => {
    if (search.trim() && !trx.note?.toLowerCase().includes(search.toLowerCase()) && !trx.categoryName?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedType !== "all" && trx.type !== selectedType) {
      return false;
    }
    if (selectedCategoryId !== "all" && trx.categoryId !== selectedCategoryId) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            Pencatatan Keuangan 💸
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Catat pengeluaran, scan struk, dan bagi tagihan patungan.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setIsSavingsGoalOpen(true)}
            variant="secondary"
            size="md"
            className="rounded-2xl"
            title="Celengan Impian Mahasiswa"
          >
            <Target className="w-4 h-4 text-[#7C5CFA]" />
            <span className="hidden sm:inline">Celengan</span>
          </Button>
          <Button
            onClick={() => setIsEmergencyFundOpen(true)}
            variant="secondary"
            size="md"
            className="rounded-2xl"
            title="Kantong Dana Darurat Kos"
          >
            <Shield className="w-4 h-4 text-[#1F8766]" />
            <span className="hidden sm:inline">Dana Darurat</span>
          </Button>
          <Button
            onClick={() => setIsSplitBillOpen(true)}
            variant="secondary"
            size="md"
            className="rounded-2xl"
            title="Split Bill & Catatan Talangan"
          >
            <Users className="w-4 h-4 text-[#7C5CFA]" />
            <span className="hidden sm:inline">Split Bill</span>
          </Button>
          <Button
            onClick={() => setIsScanModalOpen(true)}
            variant="secondary"
            size="md"
            className="rounded-2xl"
            title="Scan Foto Struk / QRIS"
          >
            <Camera className="w-4 h-4 text-[#1F8766]" />
            <span className="hidden sm:inline">Scan Struk</span>
          </Button>
          <Button
            onClick={() => setIsRecurringModalOpen(true)}
            variant="secondary"
            size="md"
            className="rounded-2xl"
            title="Tagihan & Biaya Rutin"
          >
            <CalendarClock className="w-4 h-4 text-[#FF7A85]" />
            <span className="hidden sm:inline">Biaya Rutin</span>
          </Button>
          <Button
            onClick={() => setIsNumpadOpen(true)}
            variant="finance"
            size="md"
            className="rounded-2xl"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </Button>
        </div>
      </div>

      {/* NLP Quick Bar */}
      <NLPQuickBar />

      {/* Multi-Account & E-Wallet Allocation Grid */}
      <AccountOverviewGrid />

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Sisa Anggaran / Saldo Bersih */}
        <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-1">
          <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#37B98F]" />
              <span>{summary.totalLimit > 0 ? "Sisa Kuota Anggaran" : "Sisa Saldo Dompet"}</span>
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                summary.isDeficit
                  ? "bg-[#FFE8EA] text-[#D93D4A]"
                  : "bg-[#E0FBF2] text-[#1F8766]"
              }`}
            >
              {summary.isDeficit ? "Defisit" : "Aman"}
            </span>
          </span>
          <span
            className={`text-xl sm:text-2xl font-extrabold block tracking-tight ${
              summary.isDeficit ? "text-[#D93D4A]" : "text-foreground"
            }`}
          >
            {summary.remaining < 0 ? "-" : ""}
            {formatCurrencyIDR(Math.abs(summary.remaining))}
          </span>
          <span
            className={`text-[11px] font-medium block ${
              summary.isDeficit ? "text-[#D93D4A]" : "text-[#1F8766]"
            }`}
          >
            {summary.isDeficit
              ? `Pengeluaran melebihi ${summary.totalLimit > 0 ? "limit" : "pemasukan"}`
              : `${Math.max(0, 100 - summary.overallPercentage)}% batas masih tersedia`}
          </span>
        </div>

        {/* Total Pengeluaran */}
        <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-1">
          <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <ArrowDownRight className="w-3.5 h-3.5 text-[#FF7A85]" />
            <span>Pengeluaran Bulan Ini</span>
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#D93D4A] block tracking-tight">
            {formatCurrencyIDR(summary.totalSpent)}
          </span>
          <span className="text-[11px] text-muted font-medium block">
            {summary.totalLimit > 0
              ? `Dari limit Rp ${summary.totalLimit.toLocaleString("id-ID")} (${summary.overallPercentage}%)`
              : `${summary.overallPercentage}% dari total pemasukan`}
          </span>
        </div>

        {/* Total Pemasukan */}
        <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-1">
          <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#7FE3C0]" />
            <span>Total Pemasukan</span>
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#1F8766] block tracking-tight">
            {formatCurrencyIDR(summary.totalIncome)}
          </span>
          <span className="text-[11px] text-muted font-medium block">
            Saldo Kas Bersih: <b className={summary.netSavings >= 0 ? "text-[#1F8766]" : "text-[#D93D4A]"}>{formatCurrencyIDR(summary.netSavings)}</b>
          </span>
        </div>
      </div>

      {/* Safe-to-Spend Daily Allowance & Burn Rate Forecast */}
      <DailyAllowanceCard />

      {/* 3. Main Grid: Transactions List & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Filter & Transaction List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Type Switcher */}
            <div className="flex items-center gap-1 p-1 bg-[#EDEAF2] dark:bg-[#383442] rounded-2xl w-full sm:w-auto">
              {[
                { id: "all", label: "Semua" },
                { id: "expense", label: "Keluar 💸" },
                { id: "income", label: "Masuk 💰" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id as any)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all select-none",
                    selectedType === t.id
                      ? "bg-[#7FE3C0] text-[#1F8766] shadow-sm"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari transaksi..."
                className="w-full bg-surface border border-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#7FE3C0]"
              />
            </div>
          </div>

          {/* Transactions List */}
          {filteredTransactions.length > 0 ? (
            <div className="space-y-2.5">
              {filteredTransactions.map((trx) => (
                <TransactionCard key={trx.id} transaction={trx} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center rounded-3xl bg-surface border border-border p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#E0FBF2] text-[#1F8766] flex items-center justify-center mx-auto">
                <Wallet className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground">Tidak Ada Transaksi</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Belum ada transaksi pada filter ini.
              </p>
              <Button onClick={() => setIsNumpadOpen(true)} variant="finance" size="sm">
                + Catat Transaksi
              </Button>
            </div>
          )}
        </div>

        {/* Right: Expense Chart Breakdown */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#37B98F]" />
              <span>Proporsi Pengeluaran</span>
            </h3>
            <DonutExpenseChart budgets={summary.categories} />
          </div>
        </div>
      </div>

      <NumpadQuickEntry
        isOpen={isNumpadOpen}
        onClose={() => setIsNumpadOpen(false)}
      />

      <ReceiptScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />

      <RecurringBillsModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
      />

      <SplitBillModal
        isOpen={isSplitBillOpen}
        onClose={() => setIsSplitBillOpen(false)}
      />

      <SavingsGoalModal
        isOpen={isSavingsGoalOpen}
        onClose={() => setIsSavingsGoalOpen(false)}
      />

      <EmergencyFundModal
        isOpen={isEmergencyFundOpen}
        onClose={() => setIsEmergencyFundOpen(false)}
      />
    </div>
  );
}
