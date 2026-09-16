"use client";

import React, { useState, useMemo } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { parseBankMutation, ParsedMutation } from "@/lib/mutation-parser";
import { formatCurrencyIDR } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import {
  Sparkles,
  ClipboardCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

interface SmartMutationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SmartMutationModal({ isOpen, onClose }: SmartMutationModalProps) {
  const { accounts, categories, addTransaction } = useDataStore();
  const [rawText, setRawText] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Auto-parse on input change
  const parsed = useMemo<ParsedMutation | null>(() => {
    return parseBankMutation(rawText);
  }, [rawText]);

  // Set default matching account based on provider
  React.useEffect(() => {
    if (parsed && accounts.length > 0) {
      const match = accounts.find((a) =>
        a.provider.toLowerCase().includes(parsed.provider.toLowerCase()) ||
        a.name.toLowerCase().includes(parsed.provider.toLowerCase())
      );
      if (match) {
        setSelectedAccountId(match.id);
      } else if (!selectedAccountId && accounts[0]) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [parsed, accounts]);

  if (!isOpen) return null;

  const handlePasteFromClipboard = async () => {
    triggerHaptic("light");
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawText(text);
        toast.info("Teks notifikasi disalin dari clipboard!");
      }
    } catch {
      toast.error("Tidak dapat mengakses clipboard secara otomatis. Tempel manual di kotak input.");
    }
  };

  const handleSaveTransaction = async () => {
    if (!parsed || parsed.amount <= 0) {
      toast.error("Data mutasi belum valid atau nominal tidak terdeteksi.");
      return;
    }

    try {
      setIsSaving(true);
      triggerHaptic("success");

      const cat = categories.find((c) => c.id === selectedCategoryId) || categories[0];

      await addTransaction({
        type: parsed.type,
        amount: parsed.amount,
        categoryId: cat ? cat.id : "cat_general",
        categoryName: cat ? cat.name : "Umum",
        note: `${parsed.merchantOrNote} (${parsed.provider.toUpperCase()})`,
        date: new Date().toISOString(),
      });

      toast.success(`Transaksi ${formatCurrencyIDR(parsed.amount)} berhasil dicatat! ✨`, {
        description: `${parsed.type === "income" ? "Pemasukan" : "Pengeluaran"} • ${parsed.merchantOrNote}`,
      });

      setRawText("");
      onClose();
    } catch {
      toast.error("Gagal menyimpan transaksi mutasi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-md w-[92vw] p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#7FE3C0] to-[#1F8766] text-white flex items-center justify-center shadow-soft">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                Paste Mutasi Bank & E-Wallet
              </h3>
              <p className="text-xs text-muted">
                BCA, SeaBank, GoPay, OVO, DANA, dll.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">
              Teks Notifikasi / SMS:
            </label>
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="text-xs text-[#7C5CFA] font-bold hover:underline inline-flex items-center gap-1"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Tempel Clipboard</span>
            </button>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Contoh: 'm-Transfer: BERHASIL 16/09 ke BCA 1234567890 AN KOPI KENANGAN Rp. 24.000,00' atau 'Pembayaran berhasil! Rp15.000 di Kopi Kenangan pakai GoPay.'"
            rows={4}
            className="w-full p-3 text-xs bg-[#FAF9FC] dark:bg-[#201D28] border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]/20 focus:border-[#7C5CFA] text-foreground resize-none leading-relaxed"
          />
        </div>

        {/* Live Parsed Preview */}
        {parsed ? (
          <div className="p-4 rounded-2xl bg-[#E0FBF2]/60 dark:bg-[#1A2E26]/60 border border-[#7FE3C0]/40 space-y-3 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F8766] dark:text-[#7FE3C0]">
                {parsed.type === "income" ? (
                  <>
                    <ArrowDownLeft className="w-4 h-4 text-[#1F8766]" />
                    <span>Pemasukan Terdeteksi</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-[#D93D4A]" />
                    <span className="text-[#D93D4A]">Pengeluaran Terdeteksi</span>
                  </>
                )}
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1F8766]/15 text-[#1F8766] dark:text-[#7FE3C0] uppercase">
                {parsed.provider}
              </span>
            </div>

            <div className="flex items-baseline justify-between border-t border-b border-border/40 py-2">
              <span className="text-xs text-muted font-medium truncate max-w-[200px]">
                {parsed.merchantOrNote}
              </span>
              <span className="text-lg font-mono font-black text-foreground">
                {formatCurrencyIDR(parsed.amount)}
              </span>
            </div>

            {/* Account Selector */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted block mb-1">
                  Pilih Rekening:
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.provider.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted block mb-1">
                  Kategori:
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : rawText.trim().length > 10 ? (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Format tidak dikenali. Pastikan teks mencantumkan nominal Rupiah.</span>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            className="flex-1 rounded-2xl"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="finance"
            size="md"
            disabled={!parsed || isSaving}
            onClick={handleSaveTransaction}
            className="flex-1 rounded-2xl font-bold shadow-soft flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Transaksi"}</span>
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
