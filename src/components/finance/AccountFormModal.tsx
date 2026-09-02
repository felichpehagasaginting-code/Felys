"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FinancialAccount, AccountProvider } from "@/types/finance";
import { useDataStore } from "@/stores/use-data-store";
import { AccountProviderLogo } from "./AccountProviderLogo";
import { triggerHaptic } from "@/lib/haptics";
import { Plus, Check, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editAccount?: FinancialAccount | null;
}

const PROVIDERS: { id: AccountProvider; label: string; defaultColor: string }[] = [
  { id: "gopay", label: "GoPay", defaultColor: "#00AED6" },
  { id: "superbank", label: "Superbank", defaultColor: "#121212" },
  { id: "seabank", label: "SeaBank", defaultColor: "#FF5722" },
  { id: "dana", label: "DANA", defaultColor: "#118EEA" },
  { id: "ovo", label: "OVO", defaultColor: "#4C2A86" },
  { id: "shopeepay", label: "ShopeePay", defaultColor: "#EE4D2D" },
  { id: "bca", label: "BCA", defaultColor: "#005EAA" },
  { id: "mandiri", label: "Bank Mandiri", defaultColor: "#003876" },
  { id: "bri", label: "Bank BRI", defaultColor: "#00529C" },
  { id: "bni", label: "Bank BNI", defaultColor: "#005E54" },
  { id: "cash", label: "Uang Tunai", defaultColor: "#10B981" },
  { id: "custom", label: "Lainnya", defaultColor: "#7C5CFA" },
];

export function AccountFormModal({ isOpen, onClose, editAccount }: AccountFormModalProps) {
  const { addAccount, updateAccount, deleteAccount } = useDataStore();

  const [provider, setProvider] = useState<AccountProvider>("seabank");
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");

  useEffect(() => {
    if (editAccount) {
      setProvider(editAccount.provider);
      setName(editAccount.name);
      setAccountNumber(editAccount.accountNumber || "");
      setCurrentBalance(String(editAccount.currentBalance || 0));
    } else {
      setProvider("seabank");
      setName("");
      setAccountNumber("");
      setCurrentBalance("");
    }
  }, [editAccount, isOpen]);

  if (!isOpen) return null;

  const handleProviderSelect = (p: AccountProvider) => {
    triggerHaptic("light");
    setProvider(p);
    const item = PROVIDERS.find((x) => x.id === p);
    if (!name || PROVIDERS.some((x) => x.label === name)) {
      setName(item ? item.label : "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    triggerHaptic("medium");
    const item = PROVIDERS.find((x) => x.id === provider);
    const color = item?.defaultColor || "#7C5CFA";
    const balanceNum = Number(currentBalance) || 0;

    if (editAccount) {
      await updateAccount(editAccount.id, {
        name: name.trim(),
        provider,
        accountNumber: accountNumber.trim() || undefined,
        currentBalance: balanceNum,
        color,
      });
      toast.success(`Akun "${name}" berhasil diperbarui! ✨`);
    } else {
      await addAccount({
        name: name.trim(),
        provider,
        accountNumber: accountNumber.trim() || undefined,
        currentBalance: balanceNum,
        color,
      });
      toast.success(`Akun "${name}" berhasil ditambahkan! 💳`);
    }

    onClose();
  };

  const handleDelete = async () => {
    if (!editAccount) return;
    if (confirm(`Hapus rekening "${editAccount.name}"?`)) {
      triggerHaptic("medium");
      await deleteAccount(editAccount.id);
      toast.success("Rekening berhasil dihapus.");
      onClose();
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={editAccount ? "Edit Rekening / E-Wallet 💳" : "Tambah Rekening / E-Wallet Baru 💳"}
        description="Pilih platform keuangan pihak ketiga untuk mengalokasikan saldo dan penyimpanan uangmu."
        className="max-w-lg w-[95vw]"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Provider Grid Selector */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-2">
              Pilih Platform / Bank / E-Wallet:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 bg-[#FAF9FC] dark:bg-[#2A2634] rounded-2xl border border-border">
              {PROVIDERS.map((p) => {
                const isSelected = provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProviderSelect(p.id)}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${
                      isSelected
                        ? "bg-surface shadow-xs border-2 border-[#7C5CFA]"
                        : "hover:bg-surface/50 border border-transparent"
                    }`}
                  >
                    <AccountProviderLogo provider={p.id} size="sm" />
                    <span className="text-[10px] font-bold text-foreground truncate w-full">
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">
              Nama Akun / Keterangan:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: GoPay Jajan, SeaBank Tabungan, BCA Ortu"
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-2xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
            />
          </div>

          {/* Account Number & Initial Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                No. Akun / 4 Digit HP (Opsional):
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Contoh: 9012 / 0823"
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-2xl text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                Saldo Saat Ini:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  placeholder="0"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-2xl text-xs font-bold text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {editAccount && (
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                className="rounded-2xl px-3"
                title="Hapus Akun"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
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
              <span>{editAccount ? "Simpan Perubahan" : "Tambahkan Akun"}</span>
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
