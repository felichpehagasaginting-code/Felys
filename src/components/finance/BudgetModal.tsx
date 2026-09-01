"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { Budget } from "@/types/finance";
import { formatCurrencyIDR } from "@/lib/utils";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit?: Budget | null;
}

export function BudgetModal({ isOpen, onClose, budgetToEdit }: BudgetModalProps) {
  const { categories, setBudgetLimit } = useDataStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [limit, setLimit] = useState(500000);

  useEffect(() => {
    if (budgetToEdit) {
      setSelectedCategoryId(budgetToEdit.categoryId);
      setLimit(budgetToEdit.monthlyLimit);
    } else if (categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
      setLimit(500000);
    }
  }, [budgetToEdit, isOpen, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId || limit <= 0) return;

    setBudgetLimit(selectedCategoryId, limit);
    onClose();
  };

  const quickLimits = [200000, 500000, 1000000, 1500000, 2000000];

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={budgetToEdit ? `Ubah Limit: ${budgetToEdit.categoryName}` : "Atur Budget Kategori"}
        description="Tentukan batas pengeluaran bulanan agar Fio bisa memberikan notifikasi peringatan jika mendekati batas."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Category Select */}
          {!budgetToEdit && (
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Kategori Pengeluaran
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#7FE3C0]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.isEssential ? "Esensial" : "Non-esensial"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount Display */}
          <div className="text-center py-2 bg-[#FAF9FC] dark:bg-[#2F2B3A] rounded-2xl border border-border">
            <span className="text-xs text-muted block mb-0.5">Batas Pengeluaran Bulanan</span>
            <span className="text-2xl font-extrabold text-[#1F8766]">
              {formatCurrencyIDR(limit)}
            </span>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {quickLimits.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setLimit(amount)}
                className="px-2.5 py-1 rounded-xl bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border text-xs font-semibold text-foreground hover:bg-[#E0FBF2] hover:text-[#1F8766] transition-colors"
              >
                {formatCurrencyIDR(amount)}
              </button>
            ))}
          </div>

          {/* Manual Input */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Nominal Manual (IDR)
            </label>
            <input
              type="number"
              min="10000"
              step="10000"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#7FE3C0]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="finance" size="sm">
              Simpan Budget
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
