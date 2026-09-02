"use client";

import React, { useState } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { IOSSegmentedControl, SegmentOption } from "@/components/ui/IOSSegmentedControl";
import { useDataStore } from "@/stores/use-data-store";
import { formatCurrencyIDR } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import { Shield, Plus, Minus, ArrowRight, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface EmergencyFundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmergencyFundModal({ isOpen, onClose }: EmergencyFundModalProps) {
  const { emergencyFund, depositEmergencyFund, withdrawEmergencyFund, rolloverSurplus, getMonthlyBudgetSummary } = useDataStore();
  const summary = getMonthlyBudgetSummary();

  const [actionType, setActionType] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    try {
      setIsProcessing(true);
      triggerHaptic("medium");

      if (actionType === "deposit") {
        await depositEmergencyFund(Number(amount), note.trim() || "Setor Dana Darurat Kos");
        toast.success(`Berhasil menyimpan ${formatCurrencyIDR(Number(amount))} ke Dana Darurat! 🛡️`);
      } else {
        if (Number(amount) > emergencyFund) {
          toast.error("Saldo dana darurat tidak mencukupi!");
          return;
        }
        await withdrawEmergencyFund(Number(amount), note.trim() || "Tarik Dana Darurat Kos");
        toast.success(`Berhasil menarik ${formatCurrencyIDR(Number(amount))} dari Dana Darurat.`);
      }

      setAmount("");
      setNote("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRollover = async () => {
    if (summary.netSavings <= 0) {
      toast.error("Tidak ada surplus saldo kas untuk di-rollover.");
      return;
    }

    try {
      triggerHaptic("success");
      await rolloverSurplus(summary.netSavings);
      toast.success(`Berhasil memindahkan surplus ${formatCurrencyIDR(summary.netSavings)} ke Kantong Dana Darurat! ✨`);
    } catch (err) {
      toast.error("Gagal melakukan rollover.");
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Kantong Dana Darurat Kos 🛡️"
        description="Simpan dana cadangan untuk keperluan tak terduga (tambal ban, obat sakit, servis laptop)."
      >
        <div className="space-y-4 pt-2">
          {/* Main Balance Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1F8766] to-[#0D5740] text-white space-y-2 shadow-soft">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9EE9D0] flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Total Cadangan Dana Darurat</span>
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {formatCurrencyIDR(emergencyFund)}
            </div>
            <p className="text-[11px] text-[#E0FBF2]/80 leading-relaxed">
              Saldo ini aman terpisah dari jatah belanja harian operasional kamu.
            </p>
          </div>

          {/* Monthly Rollover Recommendation (if positive cashflow) */}
          {summary.netSavings > 0 && (
            <div className="p-4 rounded-3xl bg-[#EDE5FF]/60 dark:bg-[#383442]/60 border border-[#B69CFF]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-[#7C5CFA] uppercase tracking-wider block">
                  Surplus Kas Terdeteksi
                </span>
                <span className="text-xs font-bold text-foreground">
                  Ada sisa kas <b>+{formatCurrencyIDR(summary.netSavings)}</b> bulan ini!
                </span>
              </div>
              <Button
                type="button"
                variant="academic"
                size="sm"
                onClick={handleRollover}
                className="rounded-xl shrink-0 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Simpan ke Darurat</span>
              </Button>
            </div>
          )}

          {/* Deposit & Withdraw Apple-style Drag Tabs */}
          <IOSSegmentedControl<"deposit" | "withdraw">
            options={[
              {
                id: "deposit",
                label: "+ Setor Dana Darurat",
                activeColor: "bg-[#7FE3C0]",
                activeTextColor: "text-[#0F3E30] dark:text-[#0F3E30]",
              },
              {
                id: "withdraw",
                label: "- Tarik Dana Darurat",
                activeColor: "bg-[#FF7A85]",
                activeTextColor: "text-white",
              },
            ]}
            value={actionType}
            onChange={(val) => {
              triggerHaptic("light");
              setActionType(val);
            }}
            size="md"
            className="w-full shadow-xs"
          />

          {/* Transaction Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Nominal {actionType === "deposit" ? "Setor" : "Tarik"} (Rp) <span className="text-[#FF7A85]">*</span>
              </label>
              <input
                type="number"
                required
                min={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                placeholder="Contoh: 50000"
                className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1F8766]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Catatan Keperluan
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={actionType === "deposit" ? "Sisa jajan minggu lalu" : "Servis charger laptop / Obat"}
                className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#1F8766]"
              />
            </div>

            <Button
              type="submit"
              variant={actionType === "deposit" ? "finance" : "danger"}
              size="md"
              className="w-full rounded-2xl mt-2"
              disabled={isProcessing || !amount || Number(amount) <= 0}
            >
              {actionType === "deposit" ? "Simpan ke Dana Darurat" : "Tarik Dana Darurat"}
            </Button>
          </form>
        </div>
      </ModalContent>
    </Modal>
  );
}
