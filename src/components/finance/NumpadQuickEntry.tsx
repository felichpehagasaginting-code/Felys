"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { TransactionType, Category } from "@/types/finance";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "@/lib/firebase/firestore-service";
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
  Delete,
  Check,
} from "lucide-react";
import { formatCurrencyIDR, cn } from "@/lib/utils";

interface NumpadQuickEntryProps {
  isOpen: boolean;
  onClose: () => void;
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

const STATIC_DEFAULT_EXPENSES: Category[] = DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({
  ...c,
  id: `def_exp_${i}`,
}));

const STATIC_DEFAULT_INCOMES: Category[] = DEFAULT_INCOME_CATEGORIES.map((c, i) => ({
  ...c,
  id: `def_inc_${i}`,
}));

export function NumpadQuickEntry({ isOpen, onClose }: NumpadQuickEntryProps) {
  const { categories, addTransaction } = useDataStore();

  const [type, setType] = useState<TransactionType>("expense");
  const [amountStr, setAmountStr] = useState("0");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter categories by type (expense vs income)
  const currentCategoryList: Category[] = React.useMemo(() => {
    if (type === "expense") {
      const userExpenses = categories.filter((c) => c.type === "expense" || (!c.type && c.isDefault));
      return userExpenses.length > 0 ? userExpenses : STATIC_DEFAULT_EXPENSES;
    } else {
      const userIncomes = categories.filter((c) => c.type === "income");
      return userIncomes.length > 0 ? userIncomes : STATIC_DEFAULT_INCOMES;
    }
  }, [categories, type]);

  // Auto-select first category on type toggle or modal open
  useEffect(() => {
    if (!isOpen) return;
    if (currentCategoryList.length > 0) {
      const existing = currentCategoryList.find((c) => c.name === selectedCategory?.name);
      setSelectedCategory(existing || currentCategoryList[0]);
    }
  }, [type, isOpen, categories.length]);

  if (!isOpen) return null;

  const numAmount = parseInt(amountStr, 10) || 0;

  const handleNumpadPress = (digit: string) => {
    if (amountStr === "0") {
      setAmountStr(digit);
    } else if (amountStr.length < 9) {
      setAmountStr(amountStr + digit);
    }
  };

  const handleBackspace = () => {
    if (amountStr.length <= 1) {
      setAmountStr("0");
    } else {
      setAmountStr(amountStr.slice(0, -1));
    }
  };

  const handleQuickAddZeroes = (zeros: string) => {
    if (amountStr !== "0" && amountStr.length + zeros.length <= 9) {
      setAmountStr(amountStr + zeros);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0 || !selectedCategory || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addTransaction({
        type,
        amount: numAmount,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        categoryIcon: selectedCategory.icon,
        categoryColor: selectedCategory.color,
        note: note.trim() || null,
        date: new Date().toISOString(),
      });

      // Reset & Close
      setAmountStr("0");
      setNote("");
      onClose();
    } catch (err) {
      console.error("Error saving transaction:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Catat Keuangan Cepat"
        description="Input kilat dengan numpad dan pilih kategori 1-tap."
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Income vs Expense Toggle */}
          <div className="grid grid-cols-2 p-1 bg-[#EDEAF2] dark:bg-[#383442] rounded-2xl">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={cn(
                "py-2 rounded-xl text-xs font-bold transition-all",
                type === "expense"
                  ? "bg-[#FF7A85] text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              )}
            >
              Pengeluaran 💸
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={cn(
                "py-2 rounded-xl text-xs font-bold transition-all",
                type === "income"
                  ? "bg-[#7FE3C0] text-[#1F8766] shadow-sm"
                  : "text-muted hover:text-foreground"
              )}
            >
              Pemasukan 💰
            </button>
          </div>

          {/* Big Amount Display */}
          <div className="text-center py-2.5 bg-[#FAF9FC] dark:bg-[#2F2B3A] rounded-2xl border border-border">
            <span className="text-[11px] text-muted block mb-0.5">Nominal Transaksi</span>
            <span
              className={cn(
                "text-2xl sm:text-3xl font-extrabold tracking-tight",
                type === "expense" ? "text-[#D93D4A]" : "text-[#1F8766]"
              )}
            >
              {formatCurrencyIDR(numAmount)}
            </span>
          </div>

          {/* 1-Tap Category Grid (Dynamic based on Expense/Income) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-foreground">
                Pilih Kategori {type === "expense" ? "Pengeluaran" : "Pemasukan"}
              </label>
              <span className="text-[10px] text-muted font-semibold">
                {currentCategoryList.length} Pilihan
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-0.5">
              {currentCategoryList.map((cat) => {
                const IconComponent = ICON_MAP[cat.icon] || Sparkles;
                const isSelected = selectedCategory?.name === cat.name;

                return (
                  <button
                    key={cat.id || cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all text-center select-none",
                      isSelected
                        ? type === "expense"
                          ? "bg-[#FFE8EA] dark:bg-[#382329] border-[#FF7A85] ring-2 ring-[#FF7A85] scale-102"
                          : "bg-[#E0FBF2] dark:bg-[#213831] border-[#37B98F] ring-2 ring-[#7FE3C0] scale-102"
                        : "bg-surface border-border hover:bg-black/5"
                    )}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-semibold text-foreground truncate w-full">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Numpad Grid (3x4) */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleNumpadPress(key)}
                className="h-10 rounded-xl bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border text-base font-bold text-foreground hover:bg-[#EDEAF2] active:scale-95 transition-all"
              >
                {key}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleQuickAddZeroes("000")}
              className="h-10 rounded-xl bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border text-xs font-bold text-muted hover:bg-[#EDEAF2] active:scale-95 transition-all"
            >
              +000
            </button>
            <button
              type="button"
              onClick={() => handleNumpadPress("0")}
              className="h-10 rounded-xl bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border text-base font-bold text-foreground hover:bg-[#EDEAF2] active:scale-95 transition-all"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-10 rounded-xl bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border flex items-center justify-center text-muted hover:text-[#FF7A85] active:scale-95 transition-all"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          {/* Optional Note */}
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Catatan opsional (misal: ${
              type === "expense" ? "Nasi Padang, bensin" : "Uang saku bulanan, bonus"
            })...`}
            className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />

          {/* Submit */}
          <Button
            type="submit"
            variant={type === "expense" ? "danger" : "finance"}
            disabled={numAmount <= 0 || !selectedCategory || isSubmitting}
            className="w-full h-11 rounded-2xl font-bold"
          >
            <Check className="w-4 h-4" />
            <span>
              {isSubmitting
                ? "Menyimpan ke Cloud..."
                : `Simpan ${type === "expense" ? "Pengeluaran" : "Pemasukan"}`}
            </span>
          </Button>
        </form>
      </ModalContent>
    </Modal>
  );
}
