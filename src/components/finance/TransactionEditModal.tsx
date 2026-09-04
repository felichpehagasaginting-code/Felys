"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { Transaction } from "@/types/finance";
import { formatCurrencyIDR, cn, getBudgetStatusConfig } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import {
  Utensils, Bus, GraduationCap, Gamepad2, Coffee, ShoppingBag,
  HeartPulse, Laptop, Home, Shirt, Sparkles, Wallet, Briefcase,
  Award, Store, Gift, TrendingUp, Check,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils, Bus, GraduationCap, Gamepad2, Coffee, ShoppingBag,
  HeartPulse, Laptop, Home, Shirt, Sparkles, Wallet, Briefcase,
  Award, Store, Gift, TrendingUp,
};

interface TransactionEditModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

/**
 * P4: edit nominal / kategori / catatan / tanggal transaksi.
 * Server mengoreksi budget + saldo via delta atomik (PATCH).
 * Tipe & akun dikunci (ganti = hapus + catat baru).
 */
export function TransactionEditModal({ transaction, onClose }: TransactionEditModalProps) {
  const { categories, updateTransaction, getMonthlyBudgetSummary } = useDataStore();
  const [amountStr, setAmountStr] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setAmountStr(String(transaction.amount));
      setCategoryId(transaction.categoryId);
      setNote(transaction.note || "");
      try {
        setDateStr(new Date(transaction.date).toISOString().slice(0, 10));
      } catch {
        setDateStr("");
      }
    }
  }, [transaction]);

  if (!transaction) return null;
  const isExpense = transaction.type === "expense";
  const list = categories.filter((c) =>
    isExpense ? c.type !== "income" : c.type === "income"
  );
  const grid = list.length > 0 ? list : categories;
  const numAmount = parseInt(amountStr.replace(/\D/g, ""), 10) || 0;

  // Dampak live bila nominal/kategori berubah
  const summary = getMonthlyBudgetSummary();
  const targetCat = grid.find((c) => c.id === categoryId);
  const impacted = isExpense
    ? summary.categories.find(
        (c) => c.categoryId === categoryId || (targetCat && c.categoryName === targetCat.name)
      )
    : undefined;
  const afterSpent = (impacted?.spentAmount || 0) - transaction.amount + numAmount;
  const afterPct =
    impacted && impacted.monthlyLimit > 0
      ? Math.round((afterSpent / impacted.monthlyLimit) * 100)
      : 0;
  const afterCfg = getBudgetStatusConfig(afterPct);

  const dirty =
    numAmount !== transaction.amount ||
    categoryId !== transaction.categoryId ||
    note.trim() !== (transaction.note || "") ||
    (dateStr && !transaction.date.startsWith(dateStr));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0 || !dirty || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateTransaction(transaction.id, {
        amount: numAmount,
        categoryId,
        categoryName: targetCat?.name,
        categoryIcon: targetCat?.icon,
        categoryColor: targetCat?.color,
        note: note.trim() || null,
        ...(dateStr ? { date: new Date(`${dateStr}T12:00:00`).toISOString() } : {}),
      });
      triggerHaptic("success");
      toast.success("Transaksi diperbarui ✨");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui transaksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Edit ${isExpense ? "Pengeluaran" : "Pemasukan"}`}
        description="Ubah nominal, kategori, catatan, atau tanggal. Budget & saldo dikoreksi otomatis."
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="edit-amount" className="block text-xs font-bold text-foreground mb-1">
              Nominal (Rp)
            </label>
            <input
              id="edit-amount"
              type="text"
              inputMode="numeric"
              value={numAmount > 0 ? numAmount.toLocaleString("id-ID") : ""}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder={String(transaction.amount)}
              aria-label="Nominal transaksi"
              className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-2xl px-4 py-3 text-lg font-extrabold text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Kategori</label>
            <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-0.5" role="radiogroup" aria-label="Kategori transaksi">
              {grid.map((cat) => {
                const Icon = ICON_MAP[cat.icon] || Sparkles;
                const selected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    aria-label={`Kategori ${cat.name}`}
                    aria-pressed={selected}
                    className={cn(
                      "flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all",
                      selected
                        ? "border-[#7C5CFA] ring-2 ring-[#7C5CFA]/50 bg-[#EDE5FF]/50 dark:bg-[#383442]/60"
                        : "bg-surface border-border hover:bg-black/5"
                    )}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-semibold text-foreground truncate w-full text-center">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {impacted && impacted.monthlyLimit > 0 && dirty && (
            <div aria-live="polite" className={cn("rounded-2xl p-3 text-[11px] font-bold", afterCfg.badgeBg, afterCfg.textColor)}>
              Setelah diubah: {impacted.categoryName} {afterPct}% terpakai • sisa{" "}
              {formatCurrencyIDR(Math.max(0, impacted.monthlyLimit - afterSpent))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="edit-date" className="block text-xs font-bold text-foreground mb-1">
                Tanggal
              </label>
              <input
                id="edit-date"
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="edit-note" className="block text-xs font-bold text-foreground mb-1">
                Catatan
              </label>
              <input
                id="edit-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Opsional..."
                maxLength={200}
                className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant={isExpense ? "danger" : "finance"}
            disabled={numAmount <= 0 || !dirty || isSubmitting}
            className="w-full h-11 rounded-2xl font-bold"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </Button>
        </form>
      </ModalContent>
    </Modal>
  );
}
