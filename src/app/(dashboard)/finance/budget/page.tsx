"use client";

import React, { useState } from "react";
import { Plus, PieChart, Sparkles, AlertCircle, TrendingDown } from "lucide-react";
import { useDataStore } from "@/stores/use-data-store";
import { BudgetProgressBar } from "@/components/finance/BudgetProgressBar";
import { BudgetModal } from "@/components/finance/BudgetModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Budget } from "@/types/finance";
import { formatCurrencyIDR, getBudgetStatusConfig } from "@/lib/utils";

export default function FinanceBudgetPage() {
  const { getMonthlyBudgetSummary, deleteBudgetLimit } = useDataStore();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return;
    try {
      setIsDeleting(true);
      await deleteBudgetLimit(budgetToDelete.categoryId);
    } finally {
      setIsDeleting(false);
      setBudgetToDelete(null);
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider block">
              {summary.totalLimit > 0 ? "Realisasi vs Limit Anggaran" : "Realisasi vs Total Pemasukan"}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  summary.isDeficit ? "text-[#D93D4A]" : "text-foreground"
                }`}
              >
                {formatCurrencyIDR(summary.totalSpent)}
              </span>
              <span className="text-sm text-muted font-bold">
                / {formatCurrencyIDR(summary.effectiveBudgetBase || summary.totalSpent)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted">
              <span>Pemasukan: <b className="text-[#1F8766]">+{formatCurrencyIDR(summary.totalIncome)}</b></span>
              <span>•</span>
              <span>Saldo Kas: <b className={summary.netSavings >= 0 ? "text-[#1F8766]" : "text-[#D93D4A]"}>{formatCurrencyIDR(summary.netSavings)}</b></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                summary.isDeficit
                  ? "bg-[#FFE8EA] text-[#D93D4A]"
                  : `${overallConfig.badgeBg} ${overallConfig.textColor}`
              }`}
            >
              {summary.isDeficit ? "Melebihi Batas (Defisit)" : `${summary.overallPercentage}% Terpakai`}
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-[#EDEAF2] dark:bg-[#383442] rounded-full overflow-hidden">
            <div
              className={`h-full ${
                summary.isDeficit ? "bg-[#FF7A85]" : overallConfig.barColor
              } transition-all duration-500 rounded-full`}
              style={{ width: `${Math.min(100, summary.overallPercentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>Terpakai: {formatCurrencyIDR(summary.totalSpent)}</span>
            <span>
              Sisa {summary.totalLimit > 0 ? "Anggaran" : "Saldo"}:{" "}
              <b className={summary.isDeficit ? "text-[#D93D4A]" : "text-[#1F8766]"}>
                {summary.remaining < 0 ? "-" : ""}
                {formatCurrencyIDR(Math.abs(summary.remaining))}
              </b>
            </span>
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
              onDelete={setBudgetToDelete}
            />
          ))}
        </div>
      </div>

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        budgetToEdit={budgetToEdit}
      />

      <ConfirmDialog
        isOpen={Boolean(budgetToDelete)}
        onClose={() => setBudgetToDelete(null)}
        onConfirm={handleDeleteBudget}
        title="Hapus Batas Budget Kategori?"
        description={`Limit anggaran untuk kategori "${budgetToDelete?.categoryName}" (${formatCurrencyIDR(budgetToDelete?.monthlyLimit || 0)}) akan dihapus dari Firestore.`}
        isSubmitting={isDeleting}
      />
    </div>
  );
}
