"use client";

import React from "react";
import { BarChart3, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useDataStore } from "@/stores/use-data-store";
import { DonutExpenseChart } from "@/components/finance/DonutExpenseChart";
import { formatCurrencyIDR } from "@/lib/utils";

export default function FinanceReportsPage() {
  const { getMonthlyBudgetSummary, transactions } = useDataStore();
  const summary = getMonthlyBudgetSummary();

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          Laporan & Grafik Keuangan 📈
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Analisis alokasi uang dan tren pengeluaran bulanan kamu.
        </p>
      </div>

      {/* Net Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-1">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">
            Total Pemasukan
          </span>
          <span className="text-xl font-extrabold text-[#1F8766] block">
            {formatCurrencyIDR(totalIncome)}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-1">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">
            Total Pengeluaran
          </span>
          <span className="text-xl font-extrabold text-[#D93D4A] block">
            {formatCurrencyIDR(totalExpense)}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-1">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">
            Tabungan Bersih
          </span>
          <span
            className={`text-xl font-extrabold block ${
              netSavings >= 0 ? "text-[#1F8766]" : "text-[#D93D4A]"
            }`}
          >
            {formatCurrencyIDR(netSavings)}
          </span>
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
                  <span className="text-[10px] text-muted">{cat.usedPercentage}% dari limit</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
