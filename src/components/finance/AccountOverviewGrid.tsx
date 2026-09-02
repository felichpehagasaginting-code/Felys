"use client";

import React, { useState } from "react";
import { useDataStore } from "@/stores/use-data-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { FinancialAccount } from "@/types/finance";
import { AccountProviderLogo } from "./AccountProviderLogo";
import { AdjustBalanceModal } from "./AdjustBalanceModal";
import { AccountFormModal } from "./AccountFormModal";
import { AccountTransferModal } from "./AccountTransferModal";
import { FirestoreService } from "@/lib/firebase/firestore-service";
import { formatCurrencyIDR } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import {
  Wallet,
  Plus,
  ArrowLeftRight,
  Edit3,
  MoreVertical,
  ShieldCheck,
  RotateCw,
  Sparkles,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export function AccountOverviewGrid() {
  const { accounts, getTotalNetWorth, initFirestoreSync } = useDataStore();
  const { user } = useAuthStore();

  const [selectedAdjustAccount, setSelectedAdjustAccount] = useState<FinancialAccount | null>(null);
  const [selectedEditAccount, setSelectedEditAccount] = useState<FinancialAccount | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const totalNetWorth = getTotalNetWorth();

  const handleManualSync = async () => {
    triggerHaptic("medium");
    if (!user) {
      toast.error("Kamu sedang dalam mode pratinjau lokal. Silakan masuk akun di menu Pengaturan agar data tersinkron antar HP & Laptop.");
      return;
    }

    setIsSyncing(true);
    try {
      await FirestoreService.syncLocalDataToFirestore(user.uid, {
        accounts,
      });
      initFirestoreSync(user.uid);
      toast.success(`Sinkronisasi Cloud Berhasil! (${accounts.length} rekening aktif) ✨`);
    } catch (err) {
      toast.error("Gagal melakukan sinkronisasi cloud. Periksa koneksi internet.");
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E0FBF2] dark:bg-[#1E332A] text-[#1F8766] dark:text-[#7FE3C0] flex items-center justify-center font-bold text-xs shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                Alokasi Rekening & E-Wallet
              </h3>
              {user ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1F8766] bg-[#E0FBF2] dark:bg-[#1E332A] px-2 py-0.5 rounded-full">
                  <Cloud className="w-3 h-3" /> Live Cloud
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                  Lokal (Belum Login)
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted">
              Total Saldo Aktif:{" "}
              <b className="text-foreground font-mono">{formatCurrencyIDR(totalNetWorth)}</b>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sync Button */}
          <Button
            onClick={handleManualSync}
            size="sm"
            variant="secondary"
            disabled={isSyncing}
            className="rounded-xl text-xs font-semibold flex items-center gap-1.5"
            title="Paksa Sinkronkan Cloud Firestore"
          >
            <RotateCw className={`w-3.5 h-3.5 text-muted ${isSyncing ? "animate-spin text-[#7C5CFA]" : ""}`} />
            <span className="hidden xs:inline">Sinkronkan</span>
          </Button>

          {accounts.length >= 2 && (
            <Button
              onClick={() => {
                triggerHaptic("light");
                setIsTransferOpen(true);
              }}
              size="sm"
              variant="secondary"
              className="rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#7C5CFA]" />
              <span>Transfer</span>
            </Button>
          )}

          <Button
            onClick={() => {
              triggerHaptic("light");
              setSelectedEditAccount(null);
              setIsFormOpen(true);
            }}
            size="sm"
            variant="finance"
            className="rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-soft"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Akun</span>
          </Button>
        </div>
      </div>

      {/* Grid of Accounts */}
      {accounts.length === 0 ? (
        <div className="p-6 rounded-3xl bg-surface border border-dashed border-border text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E0FBF2] dark:bg-[#1E332A] text-[#1F8766] dark:text-[#7FE3C0] flex items-center justify-center mx-auto">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-xs font-bold text-foreground">Belum Ada Rekening / E-Wallet</h4>
            <p className="text-[11px] text-muted leading-relaxed">
              Tambahkan akun penyimpananmu (Superbank, GoPay, SeaBank, BCA, Uang Tunai, dll.) untuk mulai mencatat dan membagi alokasi saldo.
            </p>
          </div>
          <Button
            onClick={() => {
              triggerHaptic("light");
              setSelectedEditAccount(null);
              setIsFormOpen(true);
            }}
            size="sm"
            variant="finance"
            className="rounded-xl text-xs font-bold shadow-soft inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Rekening / E-Wallet</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {accounts.map((account) => {
            return (
              <div
                key={account.id}
                className="p-4 rounded-3xl bg-surface border border-border shadow-soft hover:shadow-md transition-all duration-300 relative group flex flex-col justify-between overflow-hidden"
              >
                {/* Top Row: Provider Logo & Edit button */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AccountProviderLogo provider={account.provider} size="md" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-extrabold text-foreground truncate">
                        {account.name}
                      </h4>
                      <span className="text-[10px] text-muted truncate block">
                        {account.accountNumber ? `•••• ${account.accountNumber}` : "Penyimpanan Utama"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      triggerHaptic("light");
                      setSelectedEditAccount(account);
                      setIsFormOpen(true);
                    }}
                    className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all opacity-80 group-hover:opacity-100"
                    title="Edit Akun"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Middle Row: Balance Display */}
                <div className="pt-3 pb-2">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                    Saldo Saat Ini
                  </span>
                  <div className="text-lg font-mono font-black text-foreground tracking-tight">
                    {formatCurrencyIDR(account.currentBalance || 0)}
                  </div>
                </div>

                {/* Bottom Row: Quick Action 'Ubah Saldo Langsung' */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic("light");
                      setSelectedAdjustAccount(account);
                    }}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#2F2B3A] hover:bg-[#EDE5FF] dark:hover:bg-[#383442] text-[#7C5CFA] text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Ubah Saldo Langsung</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AdjustBalanceModal
        isOpen={Boolean(selectedAdjustAccount)}
        onClose={() => setSelectedAdjustAccount(null)}
        account={selectedAdjustAccount}
      />

      <AccountFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedEditAccount(null);
        }}
        editAccount={selectedEditAccount}
      />

      <AccountTransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />
    </section>
  );
}
