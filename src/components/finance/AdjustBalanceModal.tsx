"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FinancialAccount } from "@/types/finance";
import { useDataStore } from "@/stores/use-data-store";
import { AccountProviderLogo } from "./AccountProviderLogo";
import { formatCurrencyIDR } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { Check, Edit3, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface AdjustBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: FinancialAccount | null;
}

export function AdjustBalanceModal({ isOpen, onClose, account }: AdjustBalanceModalProps) {
  const { adjustAccountBalance } = useDataStore();
  const [newBalanceInput, setNewBalanceInput] = useState("");

  useEffect(() => {
    if (account) {
      setNewBalanceInput(String(account.currentBalance || 0));
    }
  }, [account]);

  if (!account || !isOpen) return null;

  const currentBal = account.currentBalance || 0;
  const targetBal = Number(newBalanceInput) || 0;
  const difference = targetBal - currentBal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic("medium");

    await adjustAccountBalance(account.id, targetBal);
    toast.success(`Saldo ${account.name} berhasil disesuaikan menjadi ${formatCurrencyIDR(targetBal)}! ✨`);
    onClose();
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Ubah Saldo Langsung (Rekonsiliasi) ✏️"
        description="Ubah saldo dompet/rekening sesuai nominal asli tanpa memengaruhi grafik pemasukan dan pengeluaran bulanan."
        className="max-w-md w-[95vw]"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Target Account Badge */}
          <div className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#2A2634] border border-border flex items-center gap-3">
            <AccountProviderLogo provider={account.provider} size="md" />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-foreground truncate">{account.name}</h4>
              <span className="text-[10px] text-muted">
                {account.accountNumber ? `No. Akun: •••• ${account.accountNumber}` : "Penyimpanan Utama"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted block uppercase">Saldo Tercatat</span>
              <span className="text-xs font-bold text-foreground font-mono">
                {formatCurrencyIDR(currentBal)}
              </span>
            </div>
          </div>

          {/* New Balance Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">
              Masukkan Saldo Riil di Aplikasi Bank / E-Wallet:
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                Rp
              </span>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={newBalanceInput}
                onChange={(e) => setNewBalanceInput(e.target.value)}
                placeholder="Contoh: 1500000"
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-2xl text-sm font-bold text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
              />
            </div>
          </div>

          {/* Difference Calculation Note */}
          <div className="p-3 rounded-2xl bg-surface border border-border space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted">Selisih Penyesuaian:</span>
              <span
                className={`font-bold font-mono ${
                  difference > 0
                    ? "text-[#1F8766] dark:text-[#7FE3C0]"
                    : difference < 0
                    ? "text-[#FF7A85]"
                    : "text-muted"
                }`}
              >
                {difference > 0 ? `+${formatCurrencyIDR(difference)}` : formatCurrencyIDR(difference)}
              </span>
            </div>
            <p className="text-[10px] text-muted leading-relaxed">
              💡 <b>Catatan Praktis:</b> Penyesuaian saldo ini murni menyinkronkan nominal uang riil kamu tanpa dicatat sebagai transaksi pengeluaran/pemasukan.
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 rounded-2xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="finance"
              className="flex-1 rounded-2xl font-bold flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Saldo Baru</span>
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
