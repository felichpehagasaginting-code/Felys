"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { TransactionType, Category } from "@/types/finance";
import { AccountProviderLogo } from "./AccountProviderLogo";
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
  Shirt,
  Delete,
  Check,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { playTick, playSuccessChime } from "@/lib/sounds";
import { IOSSegmentedControl, SegmentOption } from "@/components/ui/IOSSegmentedControl";
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
  Shirt,
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
  const { categories, addTransaction, accounts } = useDataStore();

  const [type, setType] = useState<TransactionType>("expense");
  const [amountStr, setAmountStr] = useState("0");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];
      setSelectedAccountId(defaultAcc.id);
    }
  }, [accounts, selectedAccountId]);

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

  // Auto-select first category when modal opens or type changes
  useEffect(() => {
    if (currentCategoryList.length > 0) {
      setSelectedCategory(currentCategoryList[0]);
    }
  }, [type, currentCategoryList]);

  const numAmount = parseInt(amountStr, 10) || 0;

  const handleNumpadPress = (val: string) => {
    triggerHaptic("light");
    playTick();
    if (amountStr === "0") {
      setAmountStr(val);
    } else {
      if (amountStr.length >= 10) return;
      setAmountStr(amountStr + val);
    }
  };

  const handleQuickAddZeroes = (zeroes: string) => {
    triggerHaptic("light");
    playTick();
    if (amountStr !== "0" && amountStr.length + zeroes.length <= 11) {
      setAmountStr(amountStr + zeroes);
    }
  };

  const handleBackspace = () => {
    triggerHaptic("light");
    playTick();
    if (amountStr.length <= 1) {
      setAmountStr("0");
    } else {
      setAmountStr(amountStr.slice(0, -1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0 || !selectedCategory) return;

    setIsSubmitting(true);
    try {
      const selectedAcc = accounts.find((a) => a.id === selectedAccountId);
      await addTransaction({
        type,
        amount: numAmount,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        categoryIcon: selectedCategory.icon,
        categoryColor: selectedCategory.color,
        accountId: selectedAccountId || undefined,
        accountName: selectedAcc?.name,
        note: note.trim() || null,
        date: new Date().toISOString(),
      });

      triggerHaptic("success");
      playSuccessChime();

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
        title="Catat Keuangan Cepat 💸"
        description="Input kilat dengan numpad, pilih kategori, dan alokasikan ke dompet/rekening."
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Income vs Expense Toggle */}
          <IOSSegmentedControl<TransactionType>
            options={[
              {
                id: "expense",
                label: "Pengeluaran 💸",
                activeColor: "bg-[#FF7A85]",
                activeTextColor: "text-white",
              },
              {
                id: "income",
                label: "Pemasukan 💰",
                activeColor: "bg-[#7FE3C0]",
                activeTextColor: "text-[#0F3E30] dark:text-[#0F3E30]",
              },
            ]}
            value={type}
            onChange={(val) => {
              triggerHaptic("light");
              setType(val);
            }}
            size="md"
            className="w-full shadow-xs"
          />

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

          {/* Account Source Selector (GoPay, SeaBank, Cash, etc.) */}
          {accounts.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                {type === "expense" ? "Sumber Dana / Akun:" : "Disimpan ke Akun:"}
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {accounts.map((acc) => {
                  const isSelected = selectedAccountId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`p-1.5 px-2.5 rounded-xl border flex items-center gap-1.5 transition-all shrink-0 text-left ${
                        isSelected
                          ? "bg-surface border-[#7C5CFA] ring-2 ring-[#7C5CFA]/40 shadow-xs"
                          : "bg-[#FAF9FC] dark:bg-[#2F2B3A] border-border text-muted hover:text-foreground"
                      }`}
                    >
                      <AccountProviderLogo provider={acc.provider} size="sm" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-foreground block truncate max-w-[100px]">
                          {acc.name}
                        </span>
                        <span className="text-[9px] text-muted font-mono block">
                          {formatCurrencyIDR(acc.currentBalance)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1-Tap Category Grid */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-foreground">
                Pilih Kategori {type === "expense" ? "Pengeluaran" : "Pemasukan"}
              </label>
              <span className="text-[10px] text-muted font-semibold">
                {currentCategoryList.length} Pilihan
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-0.5">
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
