"use client";

import React from "react";
import { Budget } from "@/types/finance";
import { formatCurrencyIDR, getBudgetStatusConfig } from "@/lib/utils";
import {
  Utensils,
  Bus,
  GraduationCap,
  Gamepad2,
  Coffee,
  ShoppingBag,
  HeartPulse,
  Laptop,
  Home,
  Sparkles,
  Wallet,
  Briefcase,
  Award,
  Store,
  Gift,
  TrendingUp,
  Trash2,
} from "lucide-react";

interface BudgetProgressBarProps {
  budget: Budget;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budget: Budget) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Bus,
  GraduationCap,
  Gamepad2,
  Coffee,
  ShoppingBag,
  HeartPulse,
  Laptop,
  Home,
  Sparkles,
  Wallet,
  Briefcase,
  Award,
  Store,
  Gift,
  TrendingUp,
};

export function BudgetProgressBar({ budget, onEdit, onDelete }: BudgetProgressBarProps) {
  const IconComponent = ICON_MAP[budget.categoryIcon || ""] || Sparkles;
  const statusConfig = getBudgetStatusConfig(budget.usedPercentage);

  return (
    <div className="bg-surface border border-border p-4 rounded-2xl hover:shadow-soft transition-all">
      {/* Top: Icon + Name + Badge */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
            style={{ backgroundColor: budget.categoryColor || "#7FE3C0" }}
          >
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-foreground truncate">
              {budget.categoryName || "Kategori"}
            </h4>
            <span className="text-[10px] text-muted">
              Limit: {formatCurrencyIDR(budget.monthlyLimit)}
            </span>
          </div>
        </div>

        {/* Status Badge & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.badgeBg} ${statusConfig.textColor}`}
          >
            {statusConfig.label} ({budget.usedPercentage}%)
          </span>
          {onEdit && (
            <button
              onClick={() => onEdit(budget)}
              className="text-[11px] font-semibold text-muted hover:text-foreground px-1"
            >
              Ubah
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(budget)}
              className="p-1 rounded-lg text-muted hover:text-[#FF7A85] hover:bg-black/5 transition-colors"
              title="Hapus limit budget"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-[#EDEAF2] dark:bg-[#383442] rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${statusConfig.barColor} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.min(100, budget.usedPercentage)}%` }}
        />
      </div>

      {/* Bottom Summary: Spent vs Remaining */}
      <div className="flex items-center justify-between text-[11px] text-muted">
        <span>Terpakai: <b className="text-foreground">{formatCurrencyIDR(budget.spentAmount)}</b></span>
        <span>Sisa: <b className={budget.remainingAmount > 0 ? "text-[#1F8766]" : "text-[#D93D4A]"}>{formatCurrencyIDR(budget.remainingAmount)}</b></span>
      </div>
    </div>
  );
}
