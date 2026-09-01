"use client";

import React, { useState } from "react";
import { Transaction } from "@/types/finance";
import { useDataStore } from "@/stores/use-data-store";
import { formatCurrencyIDR, formatDateRelative } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
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
  Shirt,
  Sparkles,
  Wallet,
  Briefcase,
  Award,
  Store,
  Gift,
  TrendingUp,
  Trash2,
} from "lucide-react";

interface TransactionCardProps {
  transaction: Transaction;
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
  Shirt,
  Sparkles,
  Wallet,
  Briefcase,
  Award,
  Store,
  Gift,
  TrendingUp,
};

export function TransactionCard({ transaction }: TransactionCardProps) {
  const { deleteTransaction, addTransaction } = useDataStore();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const IconComponent = ICON_MAP[transaction.categoryIcon || ""] || Sparkles;
  const isExpense = transaction.type === "expense";

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      triggerHaptic("warning");
      const backup = { ...transaction };
      await deleteTransaction(transaction.id);

      toast.info(`Transaksi ${transaction.categoryName || "Keuangan"} dihapus`, {
        action: {
          label: "Batalkan",
          onClick: () => {
            triggerHaptic("success");
            addTransaction(backup);
            toast.success("Transaksi berhasil dikembalikan!");
          },
        },
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="group flex items-center justify-between p-3.5 rounded-2xl bg-surface border border-border hover:shadow-soft transition-all">
        {/* Left: Icon + Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            style={{ backgroundColor: transaction.categoryColor || "#7FE3C0" }}
          >
            <IconComponent className="w-5 h-5 transition-transform group-hover:scale-105" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-foreground truncate transition-colors group-hover:text-foreground">
              {transaction.categoryName || "Kategori"}
            </h4>
            <p className="text-[11px] text-muted truncate">
              {transaction.note ? transaction.note : formatDateRelative(transaction.date)}
            </p>
          </div>
        </div>

        {/* Right: Amount & Delete Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span
              className={`text-sm font-bold block ${
                isExpense ? "text-[#D93D4A]" : "text-[#1F8766]"
              }`}
            >
              {isExpense ? "-" : "+"}
              {formatCurrencyIDR(transaction.amount)}
            </span>
            <span className="text-[10px] text-muted block">
              {formatDateRelative(transaction.date)}
            </span>
          </div>

          <button
            onClick={() => setIsConfirmOpen(true)}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg text-muted hover:text-[#FF7A85] hover:bg-[#FFE8EA] dark:hover:bg-[#382024] transition-all hover:scale-115 active:scale-95"
            title="Hapus transaksi"
          >
            <Trash2 className="w-3.5 h-3.5 transition-transform duration-200 hover:rotate-12" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Catatan Transaksi?"
        description={`Transaksi ${transaction.categoryName || "Keuangan"} sebesar ${formatCurrencyIDR(transaction.amount)} akan dihapus secara permanen.`}
        isSubmitting={isDeleting}
      />
    </>
  );
}
