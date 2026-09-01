"use client";

import React, { useState } from "react";
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Wallet, PieChart as PieChartIcon, Camera, CalendarClock } from "lucide-react";
import { useDataStore } from "@/stores/use-data-store";
import { TransactionCard } from "@/components/finance/TransactionCard";
import { DonutExpenseChart } from "@/components/finance/DonutExpenseChart";
import { NumpadQuickEntry } from "@/components/finance/NumpadQuickEntry";
import { ReceiptScanModal } from "@/components/finance/ReceiptScanModal";
import { RecurringBillsModal } from "@/components/finance/RecurringBillsModal";
import { NLPQuickBar } from "@/components/shared/NLPQuickBar";
import { Button } from "@/components/ui/Button";
import { formatCurrencyIDR, cn } from "@/lib/utils";

export default function FinanceTransactionsPage() {
  const { transactions, categories, getMonthlyBudgetSummary } = useDataStore();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "expense" | "income">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);

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
            Catat pengeluaran dan pemasukan dengan input kilat atau scan struk.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
            <CalendarClock className="w-4 h-4 text-[#7C5CFA]" />
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

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Sisa Budget */}
        <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-1">
          <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-[#37B98F]" />
            <span>Sisa Anggaran</span>
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-foreground block">
            {formatCurrencyIDR(summary.remaining)}
          </span>
          <span className="text-[11px] text-[#1F8766] font-medium">
            {100 - summary.overallPercentage}% batas tersedia
          </span>
        </div>

        {/* Total Pengeluaran */}
        <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-1">
          <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-[#FF7A85]" />
            <span>Pengeluaran Bulan Ini</span>
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#D93D4A] block">
            {formatCurrencyIDR(summary.totalSpent)}
          </span>
          <span className="text-[11px] text-muted font-medium">
            Dari limit {formatCurrencyIDR(summary.totalLimit)}
          </span>
        </div>

        {/* Total Pemasukan */}
        <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-1">
          <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#7FE3C0]" />
            <span>Total Pemasukan</span>
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#1F8766] block">
            {formatCurrencyIDR(totalIncome)}
          </span>
          <span className="text-[11px] text-muted font-medium">
            Uang saku & pendapatan lain
          </span>
        </div>
      </div>

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
    </div>
  );
}
