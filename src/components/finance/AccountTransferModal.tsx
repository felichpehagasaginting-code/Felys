"use client";

import React, { useState } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { AccountProviderLogo } from "./AccountProviderLogo";
import { formatCurrencyIDR } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { ArrowRight, ArrowLeftRight, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AccountTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFromId?: string;
}

export function AccountTransferModal({
  isOpen,
  onClose,
  defaultFromId,
}: AccountTransferModalProps) {
  const { accounts, transferBetweenAccounts } = useDataStore();

  const [fromId, setFromId] = useState(defaultFromId || accounts[0]?.id || "");
  const [toId, setToId] = useState(
    accounts.find((a) => a.id !== fromId)?.id || accounts[1]?.id || ""
  );
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  if (!isOpen || accounts.length < 2) return null;

  const fromAcc = accounts.find((a) => a.id === fromId);
  const toAcc = accounts.find((a) => a.id === toId);
  const transferNum = Number(amount) || 0;
  const isInsufficient = fromAcc ? transferNum > fromAcc.currentBalance : false;

  const handleSwap = () => {
    triggerHaptic("light");
    const prevFrom = fromId;
    setFromId(toId);
    setToId(prevFrom);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId || fromId === toId || transferNum <= 0 || isInsufficient) {
      toast.error("Periksa kembali rekening asal, tujuan, dan saldo yang mencukupi.");
      return;
    }

    triggerHaptic("medium");
    await transferBetweenAccounts(fromId, toId, transferNum, note.trim() || undefined);
    toast.success(
      `Berhasil memindahkan ${formatCurrencyIDR(transferNum)} dari ${fromAcc?.name} ke ${toAcc?.name}! 🔄`
    );
    onClose();
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Pindah / Transfer Saldo Antar Akun 🔄"
        description="Pindahkan dana antar-rekening atau top-up e-wallet tanpa mengubah total pengeluaran dan pemasukan bulanan."
        className="max-w-md w-[95vw]"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Transfer Visual Direction */}
          <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#2A2634] border border-border flex items-center justify-between gap-2">
            {/* From Account Selector */}
            <div className="flex-1 space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase block">Dari:</span>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-2 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} disabled={a.id === toId}>
                    {a.name} ({formatCurrencyIDR(a.currentBalance)})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-xl bg-surface border border-border hover:bg-black/5 dark:hover:bg-white/5 active:scale-90 transition-all mt-4"
              title="Tukar Posisi"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#7C5CFA]" />
            </button>

            {/* To Account Selector */}
            <div className="flex-1 space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase block">Ke:</span>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-2 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} disabled={a.id === fromId}>
                    {a.name} ({formatCurrencyIDR(a.currentBalance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-foreground">Nominal Transfer:</label>
              {fromAcc && (
                <span className="text-[10px] text-muted">
                  Saldo Tersedia: <b>{formatCurrencyIDR(fromAcc.currentBalance)}</b>
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                Rp
              </span>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Contoh: 50000"
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-2xl text-sm font-bold text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
              />
            </div>
            {isInsufficient && (
              <p className="text-[10px] text-[#FF7A85] font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Nominal melebihi sisa saldo di rekening asal.
              </p>
            )}
          </div>

          {/* Optional Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">Catatan (Opsional):</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Top-up saldo GoPay buat nugas"
              className="w-full px-3.5 py-2 bg-surface border border-border rounded-2xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1 rounded-2xl">
              Batal
            </Button>
            <Button
              type="submit"
              variant="finance"
              disabled={isInsufficient || transferNum <= 0}
              className="flex-1 rounded-2xl font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Konfirmasi Transfer</span>
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
