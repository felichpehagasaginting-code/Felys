"use client";

import React, { useState, useMemo } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { IOSSegmentedControl } from "@/components/ui/IOSSegmentedControl";
import { useDataStore } from "@/stores/use-data-store";
import { formatCurrencyIDR, formatDateRelative } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import { calculateProportionalSplit, SplitItem } from "@/lib/split-bill";
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
  Receipt,
  Percent,
  Copy,
} from "lucide-react";

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SplitBillModal({ isOpen, onClose }: SplitBillModalProps) {
  const { debts, addDebt, settleDebt, deleteDebt } = useDataStore();
  const [activeTab, setActiveTab] = useState<"calculator" | "list">("calculator");
  const [splitMode, setSplitMode] = useState<"equal" | "itemized">("equal");

  // Equal Split Form State
  const [totalBill, setTotalBill] = useState<number | "">("");
  const [billTitle, setBillTitle] = useState("");
  const [friendsInput, setFriendsInput] = useState("");
  const [includeMe, setIncludeMe] = useState(true);

  // Itemized Proportional Split State
  const [itemizedList, setItemizedList] = useState<SplitItem[]>([
    { id: "1", name: "Saya", subtotal: 35000, items: "Nasi Goreng Spesial" },
    { id: "2", name: "Teman 1", subtotal: 25000, items: "Ayam Geprek" },
  ]);
  const [taxPercent, setTaxPercent] = useState<number>(11);
  const [servicePercent, setServicePercent] = useState<number>(0);
  const [myPaymentInfo, setMyPaymentInfo] = useState<string>("BCA / GoPay");

  if (!isOpen) return null;

  // Equal Split calculation
  const friendList = friendsInput
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const totalPeople = friendList.length + (includeMe ? 1 : 0);
  const perPersonAmount =
    totalBill && totalPeople > 0 ? Math.round(Number(totalBill) / totalPeople) : 0;

  // Proportional Split calculation
  const proportionalResult = calculateProportionalSplit(
    itemizedList,
    taxPercent || 0,
    servicePercent || 0
  );

  const handleAddItemizedPerson = () => {
    triggerHaptic("light");
    setItemizedList((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: `Teman ${prev.length}`,
        subtotal: 20000,
        items: "",
      },
    ]);
  };

  const handleRemoveItemizedPerson = (id: string) => {
    triggerHaptic("light");
    if (itemizedList.length <= 1) {
      toast.error("Minimal harus ada 1 orang dalam daftar.");
      return;
    }
    setItemizedList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateItemizedPerson = (
    id: string,
    field: "name" | "subtotal" | "items",
    val: any
  ) => {
    setItemizedList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handleSaveEqualSplit = async () => {
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

  const handleSaveItemizedSplit = async () => {
    const others = proportionalResult.results.filter(
      (r) => r.name.toLowerCase() !== "saya" && r.total > 0
    );

    if (others.length === 0) {
      toast.error("Tambahkan minimal 1 teman selain diri sendiri.");
      return;
    }

    triggerHaptic("success");
    for (const person of others) {
      await addDebt({
        friendName: person.name,
        amount: person.total,
        description: `${billTitle.trim() || "Makan Bersama"} (${person.items || "Pesanan"})`,
        type: "they_owe_me",
      });
    }

    toast.success(`Berhasil mencatat talangan proporsional untuk ${others.length} teman! 🍽️`);
    setActiveTab("list");
  };

  const generateWhatsAppBroadcast = () => {
    triggerHaptic("light");
    const title = billTitle.trim() || "Makan Bersama";
    let text = `Halo temen-temen! ✨\nIni rincian patungan untuk *${title}* yaa:\n\n`;

    if (splitMode === "equal") {
      text += `Total tagihan: ${formatCurrencyIDR(Number(totalBill) || 0)}\n`;
      text += `Per orang: *${formatCurrencyIDR(perPersonAmount)}*\n\n`;
    } else {
      proportionalResult.results.forEach((r) => {
        text += `• *${r.name}*: ${formatCurrencyIDR(r.total)}${
          r.items ? ` _(${r.items})_` : ""
        }\n`;
      });
      text += `\n_Subtotal: ${formatCurrencyIDR(proportionalResult.subtotal)}_`;
      if (taxPercent > 0) text += ` | _Pajak ${taxPercent}%_`;
      if (servicePercent > 0) text += ` | _Service ${servicePercent}%_`;
      text += `\n*Total Bayar: ${formatCurrencyIDR(proportionalResult.grandTotal)}*\n\n`;
    }

    text += `Bisa transfer talangan ke:\n💳 ${myPaymentInfo}\n\nMakasih banyak semuanya! 🙏`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
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
      <ModalContent className="max-w-lg p-5 sm:p-6 max-h-[88vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E0FBF2] dark:bg-[#1E332A] text-[#1F8766] dark:text-[#7FE3C0] flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                Split Bill & Catatan Talangan 👥
              </h3>
              <p className="text-xs text-muted">
                Bagi tagihan makan kelompok proporsional & tagih via WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Kalkulator vs Daftar Tagihan */}
        <IOSSegmentedControl<"calculator" | "list">
          options={[
            {
              id: "calculator",
              label: "Kalkulator Patungan 🧮",
              activeColor: "bg-[#7FE3C0]",
              activeTextColor: "text-[#0F3E30] dark:text-[#0F3E30]",
            },
            {
              id: "list",
              label: `Daftar Piutang (${unsettledDebts.length})`,
              activeColor: "bg-[#7C5CFA]",
              activeTextColor: "text-white",
            },
          ]}
          value={activeTab}
          onChange={(tab) => {
            triggerHaptic("light");
            setActiveTab(tab);
          }}
          size="sm"
          className="w-full"
        />

        {activeTab === "calculator" ? (
          <div className="space-y-4 pt-1">
            {/* Mode Split Sub-Tabs: Bagi Rata vs Rinci Proporsional */}
            <div className="flex items-center gap-1.5 p-1 bg-surface border border-border rounded-2xl">
              <button
                type="button"
                onClick={() => setSplitMode("equal")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  splitMode === "equal"
                    ? "bg-[#E0FBF2] dark:bg-[#1E332A] text-[#1F8766] dark:text-[#7FE3C0] shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Bagi Rata (Equal)
              </button>
              <button
                type="button"
                onClick={() => setSplitMode("itemized")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  splitMode === "itemized"
                    ? "bg-[#EDE5FF] dark:bg-[#2D263B] text-[#7C5CFA] dark:text-[#B69CFF] shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Rinci per Menu + Pajak (Proporsional) ✨
              </button>
            </div>

            {/* Detail Acara & Rekening (Clean Minimal Row) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">
                  Nama Acara / Resto
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Makan Siang Bersama"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">
                  Rekening / E-Wallet Saya
                </label>
                <input
                  type="text"
                  placeholder="BCA: 1234567890 / GoPay"
                  value={myPaymentInfo}
                  onChange={(e) => setMyPaymentInfo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            {splitMode === "equal" ? (
              /* EQUAL SPLIT MODE - MINIMAL & AIRY */
              <div className="space-y-3.5 p-4 rounded-2xl bg-surface border border-border/80 shadow-xs">
                <div>
                  <label className="text-[11px] font-semibold text-muted block mb-1">
                    Total Tagihan Keseluruhan
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted">
                      Rp
                    </span>
                    <input
                      type="number"
                      placeholder="0"
                      value={totalBill}
                      onChange={(e) => setTotalBill(e.target.value ? Number(e.target.value) : "")}
                      className="w-full pl-10 pr-4 py-2.5 text-base font-mono font-bold rounded-xl bg-black/3 dark:bg-white/3 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-[#37B98F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted block mb-1">
                    Nama Teman (Pisahkan koma)
                  </label>
                  <input
                    type="text"
                    placeholder="Budi, Siti, Dimas, Aldo"
                    value={friendsInput}
                    onChange={(e) => setFriendsInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/3 dark:bg-white/3 border border-border text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-[#37B98F]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="includeMe"
                    checked={includeMe}
                    onChange={(e) => setIncludeMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1F8766] accent-[#1F8766] cursor-pointer"
                  />
                  <label htmlFor="includeMe" className="text-xs text-foreground cursor-pointer select-none">
                    Ikutkan saya ({totalPeople} orang)
                  </label>
                </div>

                {perPersonAmount > 0 && (
                  <div className="p-4 rounded-2xl bg-[#E0FBF2]/60 dark:bg-[#1A2E26]/60 border border-[#7FE3C0]/40 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-[#1F8766] dark:text-[#7FE3C0] block">
                        Per Orang Membayar
                      </span>
                      <span className="text-xl font-mono font-extrabold text-foreground">
                        {formatCurrencyIDR(perPersonAmount)}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-muted bg-surface/80 px-2.5 py-1 rounded-full border border-border/60">
                      {totalPeople} Orang
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={generateWhatsAppBroadcast}
                    disabled={!totalBill || friendList.length === 0}
                    className="rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>Kirim ke WA</span>
                  </Button>
                  <Button
                    type="button"
                    variant="finance"
                    size="sm"
                    onClick={handleSaveEqualSplit}
                    disabled={!totalBill || friendList.length === 0}
                    className="rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold shadow-soft"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Catat Talangan</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* PROPORTIONAL ITEMIZED MODE - CLEAN & STRUCTURED */
              <div className="space-y-3.5 p-4 rounded-2xl bg-surface border border-border/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Daftar Pesanan per Orang
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemizedPerson}
                    className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Teman</span>
                  </button>
                </div>

                {/* List of Persons */}
                <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                  {itemizedList.map((person) => (
                    <div
                      key={person.id}
                      className="p-3 rounded-xl bg-black/2 dark:bg-white/2 border border-border/70 space-y-1.5 hover:border-border transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) => handleUpdateItemizedPerson(person.id, "name", e.target.value)}
                          placeholder="Nama"
                          className="font-bold text-xs bg-transparent border-b border-border/60 focus:outline-none w-28 text-foreground"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted font-mono">Rp</span>
                          <input
                            type="number"
                            value={person.subtotal || ""}
                            onChange={(e) => handleUpdateItemizedPerson(person.id, "subtotal", Number(e.target.value) || 0)}
                            placeholder="0"
                            className="font-mono font-bold text-xs bg-surface px-2 py-1 rounded-lg border border-border w-28 text-right text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                          {itemizedList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemizedPerson(person.id)}
                              className="p-1 text-muted hover:text-[#D93D4A] transition-colors rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={person.items || ""}
                        onChange={(e) => handleUpdateItemizedPerson(person.id, "items", e.target.value)}
                        placeholder="Pesanan (cth: Nasi Goreng, Es Teh)"
                        className="w-full text-[11px] text-muted placeholder:text-muted/50 bg-transparent focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Tax & Service Settings */}
                <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-border/60">
                  <div>
                    <label className="text-[10px] font-semibold text-muted block mb-1">
                      Pajak Resto (%)
                    </label>
                    <input
                      type="number"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(Number(e.target.value) || 0)}
                      placeholder="11"
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl bg-black/2 dark:bg-white/2 border border-border text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted block mb-1">
                      Service Charge (%)
                    </label>
                    <input
                      type="number"
                      value={servicePercent}
                      onChange={(e) => setServicePercent(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl bg-black/2 dark:bg-white/2 border border-border text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                {/* Live Proportional Calculation Breakdown */}
                <div className="p-3.5 rounded-2xl bg-surface border border-border/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted text-[11px]">
                    <span>Subtotal Menu:</span>
                    <span className="font-mono">{formatCurrencyIDR(proportionalResult.subtotal)}</span>
                  </div>
                  {taxPercent > 0 && (
                    <div className="flex justify-between text-muted text-[11px]">
                      <span>Pajak ({taxPercent}%):</span>
                      <span className="font-mono text-foreground">+{formatCurrencyIDR(proportionalResult.taxAmount)}</span>
                    </div>
                  )}
                  {servicePercent > 0 && (
                    <div className="flex justify-between text-muted text-[11px]">
                      <span>Service ({servicePercent}%):</span>
                      <span className="font-mono text-foreground">+{formatCurrencyIDR(proportionalResult.serviceAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm text-foreground pt-1.5 border-t border-border/60">
                    <span>Total Tagihan:</span>
                    <span className="font-mono text-accent">
                      {formatCurrencyIDR(proportionalResult.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={generateWhatsAppBroadcast}
                    className="rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>Broadcast WA</span>
                  </Button>
                  <Button
                    type="button"
                    variant="academic"
                    size="sm"
                    onClick={handleSaveItemizedSplit}
                    className="rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold shadow-soft"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Catat ke Felys</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* LIST OF UNSETTLED DEBTS */
          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#201D28] border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                  Total Piutang Belum Dilunasi:
                </span>
                <span className="text-xl font-mono font-black text-[#1F8766] dark:text-[#7FE3C0]">
                  {formatCurrencyIDR(totalReceivable)}
                </span>
              </div>
              <span className="text-xs font-semibold text-muted bg-surface px-2.5 py-1 rounded-full border border-border">
                {unsettledDebts.length} catatan aktif
              </span>
            </div>

            {unsettledDebts.length === 0 ? (
              <div className="py-8 text-center space-y-2 text-muted">
                <CheckCircle2 className="w-8 h-8 text-[#1F8766] mx-auto opacity-70" />
                <p className="text-xs font-bold text-foreground">Semua Talangan Lunas!</p>
                <p className="text-[11px]">Tidak ada teman yang berutang padamu saat ini.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                {unsettledDebts.map((debt) => (
                  <div
                    key={debt.id}
                    className="p-3.5 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-between gap-2.5 hover:shadow-soft transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-foreground truncate">
                          {debt.friendName}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#1F8766] bg-[#E0FBF2] dark:bg-[#1E332A] px-2 py-0.5 rounded-full">
                          {formatCurrencyIDR(debt.amount)}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted truncate mt-0.5">
                        {debt.description} • {formatDateRelative(debt.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSettle(debt.id, debt.friendName, debt.amount)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#E0FBF2] dark:bg-[#1E332A] text-[#1F8766] dark:text-[#7FE3C0] text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                        title="Tandai Sudah Lunas"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Lunas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(debt.id, debt.friendName)}
                        className="p-1.5 rounded-xl text-muted hover:text-[#D93D4A] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
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
      </ModalContent>
    </Modal>
  );
}
