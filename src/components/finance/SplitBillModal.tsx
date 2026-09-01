"use client";

import React, { useState } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { formatCurrencyIDR, formatDateRelative } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Share2,
  Calculator,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SplitBillModal({ isOpen, onClose }: SplitBillModalProps) {
  const { debts, addDebt, settleDebt, deleteDebt } = useDataStore();
  const [activeTab, setActiveTab] = useState<"calculator" | "list">("calculator");

  // Calculator Form State
  const [totalBill, setTotalBill] = useState<number | "">("");
  const [billTitle, setBillTitle] = useState("");
  const [friendsInput, setFriendsInput] = useState("");
  const [includeMe, setIncludeMe] = useState(true);

  if (!isOpen) return null;

  // Split calculation
  const friendList = friendsInput
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const totalPeople = friendList.length + (includeMe ? 1 : 0);
  const perPersonAmount =
    totalBill && totalPeople > 0 ? Math.round(Number(totalBill) / totalPeople) : 0;

  const handleSaveSplitAsDebts = async () => {
    if (!totalBill || Number(totalBill) <= 0 || friendList.length === 0) {
      toast.error("Masukkan total tagihan dan minimal 1 nama teman.");
      return;
    }

    triggerHaptic("success");
    for (const friend of friendList) {
      await addDebt({
        friendName: friend,
        amount: perPersonAmount,
        description: billTitle.trim() || "Patungan Bersama",
        type: "they_owe_me",
      });
    }

    toast.success(`Berhasil mencatat talangan untuk ${friendList.length} teman! 👥`);
    setActiveTab("list");
    setTotalBill("");
    setBillTitle("");
    setFriendsInput("");
  };

  const handleSendWhatsApp = (name: string, amount: number, desc: string, phone?: string) => {
    triggerHaptic("light");
    const message = encodeURIComponent(
      `Hai ${name}! ✨\nMau info rincian patungan untuk "${desc}" sebesar ${formatCurrencyIDR(
        amount
      )} yaa.\nBoleh transfer via BCA / GoPay / ShopeePay / QRIS kalau senggang ya. Terima kasih banyak! 🙏`
    );

    const targetUrl = phone ? `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(targetUrl, "_blank");
  };

  const handleSettle = async (id: string, name: string, amount: number) => {
    triggerHaptic("success");
    await settleDebt(id);
    toast.success(`Talangan dari ${name} sebesar ${formatCurrencyIDR(amount)} ditandai LUNAS! 🎉`, {
      description: "Otomatis dicatat sebagai pemasukan di dompet Felys.",
    });
  };

  const handleDelete = async (id: string, name: string) => {
    triggerHaptic("warning");
    await deleteDebt(id);
    toast.info(`Catatan talangan ${name} dihapus.`);
  };

  const unsettledDebts = debts.filter((d) => !d.isSettled);
  const totalReceivable = unsettledDebts
    .filter((d) => d.type === "they_owe_me")
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#E0FBF2] text-[#1F8766] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Split Bill & Catatan Talangan 👥
                </h3>
                <p className="text-xs text-muted">
                  Bagi tagihan makan kelompok & pantau piutang antar teman
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

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#EDEAF2] dark:bg-[#383442] rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("calculator")}
              className={`py-2 rounded-xl transition-all ${
                activeTab === "calculator"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Kalkulator Patungan 🧮
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                activeTab === "list"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span>Daftar Talangan</span>
              {unsettledDebts.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#FF7A85] text-white text-[10px] flex items-center justify-center">
                  {unsettledDebts.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: CALCULATOR */}
          {activeTab === "calculator" ? (
            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-muted block mb-1">
                  Nama Acara / Makanan
                </label>
                <input
                  type="text"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  placeholder="Contoh: Makan Siang Nasi Padang, Print Makalah..."
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#7FE3C0]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted block mb-1">
                  Total Tagihan Keseluruhan (IDR)
                </label>
                <input
                  type="number"
                  value={totalBill}
                  onChange={(e) => setTotalBill(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Contoh: 90000"
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm font-extrabold text-foreground focus:outline-none focus:ring-2 focus:ring-[#7FE3C0]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted block mb-1">
                  Daftar Nama Teman (Pisahkan dengan tanda koma)
                </label>
                <input
                  type="text"
                  value={friendsInput}
                  onChange={(e) => setFriendsInput(e.target.value)}
                  placeholder="Contoh: Budi, Andi, Siti"
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#7FE3C0]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="includeMe"
                  checked={includeMe}
                  onChange={(e) => setIncludeMe(e.target.checked)}
                  className="rounded text-[#1F8766] focus:ring-[#7FE3C0]"
                />
                <label htmlFor="includeMe" className="text-xs text-foreground font-medium">
                  Saya ikut patungan (Dihitung 1 porsi untuk diri sendiri)
                </label>
              </div>

              {/* Split Result Card */}
              {perPersonAmount > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-tr from-[#E0FBF2] to-[#EDE5FF] dark:from-[#1E2E28] dark:to-[#2A2338] border border-[#7FE3C0]/40 space-y-2 text-center">
                  <span className="text-[11px] text-muted font-bold block uppercase tracking-wider">
                    Nominal Patungan Per Orang ({totalPeople} Orang)
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#1F8766] dark:text-[#7FE3C0] block">
                    {formatCurrencyIDR(perPersonAmount)}
                  </span>
                  <p className="text-[11px] text-muted">
                    {friendList.length} teman akan dicatat memiliki talangan ke kamu.
                  </p>
                </div>
              )}

              <Button
                type="button"
                variant="finance"
                onClick={handleSaveSplitAsDebts}
                disabled={!perPersonAmount || friendList.length === 0}
                className="w-full rounded-2xl text-xs font-bold py-2.5"
              >
                Simpan ke Catatan Talangan 👥
              </Button>
            </div>
          ) : (
            /* TAB 2: DEBTS LIST */
            <div className="space-y-3">
              {totalReceivable > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#E0FBF2] dark:bg-[#1E2E28] border border-[#7FE3C0]/40 flex items-center justify-between">
                  <span className="text-xs text-muted font-bold">Total Piutang Belum Lunas</span>
                  <span className="text-sm font-extrabold text-[#1F8766]">
                    {formatCurrencyIDR(totalReceivable)}
                  </span>
                </div>
              )}

              {debts.length === 0 ? (
                <div className="p-8 text-center text-muted space-y-1">
                  <p className="text-xs">Belum ada catatan talangan aktif.</p>
                  <p className="text-[11px]">Gunakan tab kalkulator untuk membagi tagihan makan.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {debts.map((debt) => (
                    <div
                      key={debt.id}
                      className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#2B2735] border border-border flex items-center justify-between gap-3 hover:shadow-soft transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-foreground truncate">
                            {debt.friendName}
                          </h4>
                          {debt.isSettled ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#E0FBF2] text-[#1F8766] text-[9px] font-bold">
                              Lunas
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-[#FFE8EA] text-[#D93D4A] text-[9px] font-bold">
                              Belum Lunas
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted truncate">
                          {debt.description} • {formatCurrencyIDR(debt.amount)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!debt.isSettled && (
                          <>
                            <button
                              onClick={() =>
                                handleSendWhatsApp(
                                  debt.friendName,
                                  debt.amount,
                                  debt.description,
                                  debt.friendPhone
                                )
                              }
                              className="p-1.5 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all text-xs font-bold flex items-center gap-1 px-2.5"
                              title="Kirim pengingat WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="text-[10px]">WA</span>
                            </button>
                            <Button
                              size="sm"
                              variant="finance"
                              onClick={() =>
                                handleSettle(debt.id, debt.friendName, debt.amount)
                              }
                              className="rounded-xl h-7 text-[10px] px-2 font-bold"
                            >
                              Lunas
                            </Button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(debt.id, debt.friendName)}
                          className="p-1.5 rounded-lg text-muted hover:text-[#FF7A85] hover:bg-black/5"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
