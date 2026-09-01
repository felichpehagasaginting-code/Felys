"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Plus, CheckSquare, Receipt, Camera, CalendarClock, Users } from "lucide-react";
import { useModeStore } from "@/stores/use-mode-store";
import { useDataStore } from "@/stores/use-data-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { TaskCard } from "@/components/academic/TaskCard";
import { TransactionCard } from "@/components/finance/TransactionCard";
import { DonutExpenseChart } from "@/components/finance/DonutExpenseChart";
import { InsightCard } from "@/components/ai/InsightCard";
import { NLPQuickBar } from "@/components/shared/NLPQuickBar";
import { ReceiptScanModal } from "@/components/finance/ReceiptScanModal";
import { RecurringBillsModal } from "@/components/finance/RecurringBillsModal";
import { SplitBillModal } from "@/components/finance/SplitBillModal";
import { DailyAllowanceCard } from "@/components/finance/DailyAllowanceCard";
import { Button } from "@/components/ui/Button";
import { TaskFormModal } from "@/components/academic/TaskFormModal";
import { NumpadQuickEntry } from "@/components/finance/NumpadQuickEntry";
import { formatCurrencyIDR, getBudgetStatusConfig } from "@/lib/utils";
import { Task } from "@/types/academic";

export default function DashboardPage() {
  const { activeMode } = useModeStore();
  const { user } = useAuthStore();
  const { tasks, transactions, insights, getMonthlyBudgetSummary, isLoaded } = useDataStore();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const displayName = user?.displayName ? user.displayName.split(" ")[0] : "Mahasiswa";

  // Active top urgent tasks (sorted by urgencyScore desc)
  const activeTasks = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .slice(0, 4);

  // Monthly budget summary
  const summary = getMonthlyBudgetSummary();
  const budgetConfig = getBudgetStatusConfig(summary.overallPercentage);

  // Recent 4 transactions
  const recentTransactions = transactions.slice(0, 4);

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Greeting & Status Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            {getGreeting()}, {displayName}! ✨
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {activeMode === "academic"
              ? `Kamu punya ${activeTasks.length} tugas aktif yang sedang berjalan.`
              : `Sisa saldo aman kamu bulan ini: ${formatCurrencyIDR(summary.remaining)}.`}
          </p>
        </div>

        {/* Quick Mode Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeMode === "academic" ? (
            <Button
              onClick={handleCreateTask}
              variant="academic"
              size="md"
              className="rounded-2xl"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tugas</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
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
                title="Pindai Struk / Bukti QRIS"
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
                onClick={() => setIsFinanceModalOpen(true)}
                variant="finance"
                size="md"
                className="rounded-2xl"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Transaksi</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Smart Natural Language Quick Input Bar */}
      <NLPQuickBar />

      {/* 3. Active AI Insight Card (Cross-Mode or Recommendation) */}
      {insights.length > 0 && (
        <section>
          <InsightCard insight={insights[0]} />
        </section>
      )}

      {/* 3. Main Dual-Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Academic Top Urgent Tasks */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#EDE5FF] dark:bg-[#383442] flex items-center justify-center text-[#7C5CFA]">
                <CheckSquare className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base font-bold text-foreground">
                Tugas Prioritas Utama
              </h2>
            </div>
            <Link
              href="/academic"
              className="text-xs font-bold text-[#7C5CFA] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {activeTasks.length > 0 ? (
            <div className="space-y-3">
              {activeTasks.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-surface border border-border text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#E0FBF2] text-[#1F8766] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Semua Tugas Beres!</h4>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Tidak ada deadline mendesak saat ini. Istirahat sejenak atau cicil materi berikutnya.
              </p>
              <Button
                onClick={handleCreateTask}
                variant="academic"
                size="sm"
                className="mt-2"
              >
                + Tambah Tugas Baru
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Finance Budget & Recent Spending */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#E0FBF2] dark:bg-[#213831] flex items-center justify-center text-[#1F8766]">
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base font-bold text-foreground">
                Ringkasan Budget Bulan Ini
              </h2>
            </div>
            <Link
              href="/finance"
              className="text-xs font-bold text-[#1F8766] hover:underline flex items-center gap-1"
            >
              <span>Detail</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Budget Overview Card */}
          <div className="p-5 rounded-3xl bg-surface border border-border space-y-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted font-bold uppercase tracking-wider block">
                  {summary.totalLimit > 0 ? "Sisa Anggaran Terencana" : "Sisa Saldo Dompet"}
                </span>
                <span
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight block ${
                    summary.isDeficit ? "text-[#D93D4A]" : "text-foreground"
                  }`}
                >
                  {summary.remaining < 0 ? "-" : ""}
                  {formatCurrencyIDR(Math.abs(summary.remaining))}
                </span>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted">
                  <span>Masuk: <b className="text-[#1F8766]">+{formatCurrencyIDR(summary.totalIncome)}</b></span>
                  <span>•</span>
                  <span>Keluar: <b className="text-[#D93D4A]">-{formatCurrencyIDR(summary.totalSpent)}</b></span>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-block ${
                    summary.isDeficit
                      ? "bg-[#FFE8EA] text-[#D93D4A]"
                      : `${budgetConfig.badgeBg} ${budgetConfig.textColor}`
                  }`}
                >
                  {summary.isDeficit ? "Defisit" : `${summary.overallPercentage}% Terpakai`}
                </span>
                {summary.totalLimit > 0 && summary.totalIncome > 0 && (
                  <span className="text-[10px] text-muted block mt-1">
                    Saldo Kas: {formatCurrencyIDR(summary.netSavings)}
                  </span>
                )}
              </div>
            </div>

            {/* Total Budget Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2.5 bg-[#EDEAF2] dark:bg-[#383442] rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    summary.isDeficit ? "bg-[#FF7A85]" : budgetConfig.barColor
                  } transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(100, summary.overallPercentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted">
                <span>Terpakai: {formatCurrencyIDR(summary.totalSpent)}</span>
                <span>
                  Batas: {formatCurrencyIDR(summary.effectiveBudgetBase || summary.totalSpent)}
                </span>
              </div>
            </div>

            {/* Quick Chart */}
            <div className="pt-2 border-t border-border/60">
              <h4 className="text-xs font-bold text-foreground mb-1 text-center">
                Distribusi Pengeluaran
              </h4>
              <DonutExpenseChart budgets={summary.categories} />
            </div>

            {/* Quick Numpad Button */}
            <Button
              onClick={() => setIsFinanceModalOpen(true)}
              variant="finance"
              size="sm"
              className="w-full rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Pengeluaran Cepat</span>
            </Button>
          </div>

          {/* Daily Allowance & Burn Rate Forecast */}
          <DailyAllowanceCard />

          {/* Recent Transactions */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider px-1">
              Transaksi Terkini
            </h3>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((trx) => (
                <TransactionCard key={trx.id} transaction={trx} />
              ))
            ) : (
              <p className="text-xs text-muted italic p-3 text-center">Belum ada transaksi</p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
      />
      <NumpadQuickEntry
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
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
    </div>
  );
}
