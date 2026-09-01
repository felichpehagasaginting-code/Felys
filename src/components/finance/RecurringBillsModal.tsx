"use client";

import React, { useState } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { formatCurrencyIDR } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import {
  CalendarClock,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  GraduationCap,
  Wifi,
} from "lucide-react";

interface RecurringBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecurringBillsModal({ isOpen, onClose }: RecurringBillsModalProps) {
  const { recurringBills, categories, addRecurringBill, deleteRecurringBill, payRecurringBill } = useDataStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [dueDay, setDueDay] = useState(5);
  const [frequency, setFrequency] = useState<"monthly" | "semester">("monthly");
  const [categoryId, setCategoryId] = useState("cat_tagihan");

  if (!isOpen) return null;

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || Number(amount) <= 0) return;

    const cat = categories.find((c) => c.id === categoryId) || categories[0];

    triggerHaptic("success");
    await addRecurringBill({
      name: name.trim(),
      amount: Number(amount),
      categoryId: cat?.id || "cat_tagihan",
      categoryName: cat?.name || "Tagihan & Kos",
      frequency,
      dueDay: Number(dueDay),
      isActive: true,
    });

    toast.success(`Tagihan "${name}" berhasil ditambahkan! 📅`);
    setName("");
    setAmount("");
    setIsAdding(false);
  };

  const handlePay = async (billId: string, billName: string) => {
    triggerHaptic("success");
    await payRecurringBill(billId);
    toast.success(`Pembayaran "${billName}" berhasil dicatat ke pengeluaran! 💳`);
  };

  const handleDelete = async (billId: string, billName: string) => {
    triggerHaptic("warning");
    await deleteRecurringBill(billId);
    toast.info(`Tagihan "${billName}" dihapus`);
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#EDE5FF] text-[#7C5CFA] flex items-center justify-center">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Tagihan & Biaya Rutin Mahasiswa 📅
                </h3>
                <p className="text-xs text-muted">
                  Pantau pembayaran uang kos, UKT, WiFi, dan langganan bulanan
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-black/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Recurring Bills */}
          <div className="space-y-3">
            {recurringBills.map((bill) => {
              const isPaidThisMonth =
                bill.lastPaidDate &&
                new Date(bill.lastPaidDate).getMonth() === new Date().getMonth();

              return (
                <div
                  key={bill.id}
                  className="p-4 rounded-2xl bg-[#FAF9FC] dark:bg-[#2B2735] border border-border flex items-center justify-between gap-3 hover:shadow-soft transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                      {bill.name.toLowerCase().includes("kos") ? (
                        <Building className="w-4 h-4 text-[#7C5CFA]" />
                      ) : bill.name.toLowerCase().includes("ukt") || bill.name.toLowerCase().includes("spp") ? (
                        <GraduationCap className="w-4 h-4 text-[#37B98F]" />
                      ) : bill.name.toLowerCase().includes("wifi") ? (
                        <Wifi className="w-4 h-4 text-[#8EC8FF]" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-[#FF7A85]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate">
                        {bill.name}
                      </h4>
                      <p className="text-[11px] text-muted">
                        Jatuh tempo: Tgl {bill.dueDay} • {formatCurrencyIDR(bill.amount)} ({bill.frequency === "monthly" ? "Bulanan" : "Semesteran"})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPaidThisMonth ? (
                      <span className="px-2.5 py-1 rounded-xl bg-[#E0FBF2] text-[#1F8766] text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Lunas
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="finance"
                        onClick={() => handlePay(bill.id, bill.name)}
                        className="rounded-xl h-7 text-[11px] px-2.5 font-bold"
                      >
                        Bayar & Catat
                      </Button>
                    )}

                    <button
                      onClick={() => handleDelete(bill.id, bill.name)}
                      className="p-1.5 rounded-lg text-muted hover:text-[#FF7A85] hover:bg-black/5"
                      title="Hapus tagihan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Bill Section */}
          {!isAdding ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAdding(true)}
              className="w-full rounded-2xl text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tagihan Rutin Baru</span>
            </Button>
          ) : (
            <form onSubmit={handleAddBill} className="p-4 rounded-2xl bg-surface border border-border space-y-3">
              <h4 className="text-xs font-bold text-foreground">Detail Tagihan Baru</h4>

              <div>
                <label className="text-[11px] font-bold text-muted block mb-1">Nama Tagihan</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Uang Kos Kamar 12, Spotify..."
                  required
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted block mb-1">Nominal (IDR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                    placeholder="850000"
                    required
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted block mb-1">Tgl Jatuh Tempo (1-31)</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dueDay}
                    onChange={(e) => setDueDay(Number(e.target.value))}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                  className="rounded-xl text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="academic"
                  size="sm"
                  className="rounded-xl text-xs font-bold"
                >
                  Simpan Tagihan
                </Button>
              </div>
            </form>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
