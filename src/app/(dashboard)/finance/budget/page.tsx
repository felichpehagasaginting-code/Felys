"use client";

import React, { useState } from "react";
import { Plus, PieChart, Sparkles, AlertCircle, TrendingDown } from "lucide-react";
import { useDataStore } from "@/stores/use-data-store";
import { BudgetProgressBar } from "@/components/finance/BudgetProgressBar";
import { BudgetModal } from "@/components/finance/BudgetModal";
import { Button } from "@/components/ui/Button";
import { Budget } from "@/types/finance";
import { formatCurrencyIDR, getBudgetStatusConfig } from "@/lib/utils";

export default function FinanceBudgetPage() {
  const { getMonthlyBudgetSummary } = useDataStore();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);

  const summary = getMonthlyBudgetSummary();
  const overallConfig = getBudgetStatusConfig(summary.overallPercentage);

  const handleEditBudget = (budget: Budget) => {
    setBudgetToEdit(budget);
    setIsBudgetModalOpen(true);
  };

  const handleOpenNewBudget = () => {
    setBudgetToEdit(null);
    setIsBudgetModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            Alokasi Budget Bulanan 📊
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Atur limit pengeluaran per kategori agar pengeluaran kamu tetap terkontrol.
          </p>
        </div>

        <Button
          onClick={handleOpenNewBudget}
          variant="finance"
          size="md"
          className="rounded-2xl"
        >
          <Plus className="w-4 h-4" />
          <span>Atur Limit Kategori</span>
        </Button>
      </div>

      {/* Overall Budget Progress Banner */}
      <div className="p-6 rounded-3xl bg-surface border border-border shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider block">
              Status Keseluruhan Bulan Ini
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {formatCurrencyIDR(summary.totalSpent)} / {formatCurrencyIDR(summary.totalLimit)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${overallConfig.badgeBg} ${overallConfig.textColor}`}
            >
              {overallConfig.label} ({summary.overallPercentage}% terpakai)
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-[#EDEAF2] dark:bg-[#383442] rounded-full overflow-hidden">
            <div
              className={`h-full ${overallConfig.barColor} transition-all duration-500 rounded-full`}
              style={{ width: `${Math.min(100, summary.overallPercentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>Terpakai: {formatCurrencyIDR(summary.totalSpent)}</span>
            <span>Sisa Aman: <b className="text-[#1F8766]">{formatCurrencyIDR(summary.remaining)}</b></span>
          </div>
        </div>
      </div>

      {/* Categories Budget Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Batas Anggaran Per Kategori
          </h2>
          <span className="text-xs text-muted font-semibold">
            {summary.categories.length} Kategori
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.categories.map((budget) => (
            <BudgetProgressBar
              key={budget.id}
              budget={budget}
              onEdit={handleEditBudget}
            />
          ))}
        </div>
      </div>

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        budgetToEdit={budgetToEdit}
      />
    </div>
  );
}
