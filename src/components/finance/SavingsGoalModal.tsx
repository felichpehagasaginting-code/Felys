"use client";

import React, { useState } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { IOSSegmentedControl } from "@/components/ui/IOSSegmentedControl";
import { useDataStore } from "@/stores/use-data-store";
import { formatCurrencyIDR, formatDateRelative } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { FinancialProjectionService } from "@/server/services/financial-projection.service";
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Laptop,
  Sparkles,
  Plane,
  Shield,
  Coins,
  TrendingUp,
  X,
  PiggyBank,
  Sliders,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavingsGoalModal({ isOpen, onClose }: SavingsGoalModalProps) {
  const {
    savingsGoals,
    addSavingsGoal,
    depositToSavingsGoal,
    deleteSavingsGoal,
    getDailyAllowanceSummary,
  } = useDataStore();
  const daily = getDailyAllowanceSummary();

  const [activeTab, setActiveTab] = useState<"goals" | "projections">("goals");

  // Create Goal Form State
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState<number | "">("");
  const [targetDate, setTargetDate] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("Laptop");
  const [depositAmount, setDepositAmount] = useState<number | "">("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Projection simulation state
  const [extraDailySavings, setExtraDailySavings] = useState<number>(5000);
  const [investmentMonths, setInvestmentMonths] = useState<number>(12);

  if (!isOpen) return null;

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetAmount || Number(targetAmount) <= 0) return;

    try {
      setIsCreating(true);
      triggerHaptic("medium");
      await addSavingsGoal({
        title: title.trim(),
        targetAmount: Number(targetAmount),
        targetDate: targetDate || undefined,
        categoryIcon,
      });

      toast.success("Target Celengan Impian baru berhasil dibuat! 🎯");
      setTitle("");
      setTargetAmount("");
      setTargetDate("");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeposit = async (goalId: string, amount: number) => {
    if (amount <= 0) return;
    try {
      triggerHaptic("success");
      await depositToSavingsGoal(goalId, amount);

      const goal = savingsGoals.find((g) => g.id === goalId);
      if (goal && goal.currentAmount + amount >= goal.targetAmount) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        toast.success(`🎉 SELAMAT! Target Celengan "${goal.title}" telah tercapai 100%!`);
      } else {
        toast.success(`Berhasil setor ${formatCurrencyIDR(amount)} ke Celengan!`);
      }
      setDepositAmount("");
      setSelectedGoalId(null);
    } catch {
      toast.error("Gagal menambahkan saldo celengan.");
    }
  };

  // Active goal selected for simulation (or first goal)
  const activeSimGoal = savingsGoals.find((g) => g.id === selectedGoalId) || savingsGoals[0];
  const baseRate = daily.dailyAllowance > 0 ? Math.max(2000, Math.round(daily.dailyAllowance * 0.15)) : 5000;

  const timeline = activeSimGoal
    ? FinancialProjectionService.calculateGoalTimeline(
        activeSimGoal.currentAmount,
        activeSimGoal.targetAmount,
        baseRate
      )
    : null;

  const simulation = activeSimGoal
    ? FinancialProjectionService.simulateDaysSaved(
        activeSimGoal.currentAmount,
        activeSimGoal.targetAmount,
        baseRate,
        extraDailySavings
      )
    : null;

  const investmentComparisons = FinancialProjectionService.compareVehicles(
    extraDailySavings * 30,
    investmentMonths
  );

  const roundUp = FinancialProjectionService.calculateRoundUpForecast(30, 2500);

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-xl w-[94vw] p-5 sm:p-7 max-h-[88vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#EDE5FF] dark:bg-[#342A45] text-[#7C5CFA] flex items-center justify-center shadow-xs shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-foreground truncate">
                Celengan Impian & Investasi 🎯
              </h3>
              <p className="text-xs text-muted">
                Target tabungan laptop, liburan, & simulasi literasi keuangan
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

        {/* Tab Switcher */}
        <IOSSegmentedControl<"goals" | "projections">
          options={[
            {
              id: "goals",
              label: `Daftar Celengan (${savingsGoals.length})`,
              activeColor: "bg-[#7C5CFA]",
              activeTextColor: "text-white",
            },
            {
              id: "projections",
              label: "Proyeksi & Simulasi Investasi 📈",
              activeColor: "bg-[#7FE3C0]",
              activeTextColor: "text-[#0F3E30] dark:text-[#0F3E30]",
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

        {activeTab === "goals" ? (
          /* GOALS LIST & CREATION */
          <div className="space-y-4 pt-1">
            {/* Create Goal Form */}
            <form
              onSubmit={handleCreateGoal}
              className="p-4 rounded-2xl bg-surface border border-border space-y-3 shadow-xs"
            >
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#7C5CFA]" />
                <span>Buat Target Celengan Baru</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Nama target (Laptop Baru, Liburan Bali...)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#201D28] border border-border text-xs text-foreground focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Target nominal (Rp)"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value ? Number(e.target.value) : "")}
                  className="p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#201D28] border border-border text-xs font-mono font-bold text-foreground focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted font-bold">Ikon:</span>
                  {["Laptop", "Plane", "Shield", "Coins"].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCategoryIcon(icon)}
                      className={`p-1.5 rounded-lg text-xs border transition-all ${
                        categoryIcon === icon
                          ? "bg-[#EDE5FF] dark:bg-[#342A45] border-[#7C5CFA] text-[#7C5CFA]"
                          : "border-border text-muted"
                      }`}
                    >
                      {icon === "Laptop" && <Laptop className="w-3.5 h-3.5" />}
                      {icon === "Plane" && <Plane className="w-3.5 h-3.5" />}
                      {icon === "Shield" && <Shield className="w-3.5 h-3.5" />}
                      {icon === "Coins" && <Coins className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>

                <Button
                  type="submit"
                  variant="academic"
                  size="sm"
                  disabled={!title.trim() || !targetAmount || isCreating}
                  className="rounded-xl text-xs font-bold"
                >
                  {isCreating ? "Menyimpan..." : "Tambah Target"}
                </Button>
              </div>
            </form>

            {/* List of Goals */}
            <div className="space-y-3">
              {savingsGoals.length === 0 ? (
                <div className="py-8 text-center space-y-2 text-muted">
                  <PiggyBank className="w-8 h-8 text-[#7C5CFA] mx-auto opacity-70" />
                  <p className="text-xs font-bold text-foreground">Belum ada target celengan</p>
                  <p className="text-[11px]">Mulai buat target impian pertamamu di form atas!</p>
                </div>
              ) : (
                savingsGoals.map((goal) => {
                  const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                  const isDone = goal.currentAmount >= goal.targetAmount;

                  return (
                    <div
                      key={goal.id}
                      className="p-4 rounded-2xl bg-surface border border-border shadow-xs space-y-3 hover:shadow-soft transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-[#EDE5FF] dark:bg-[#342A45] text-[#7C5CFA] flex items-center justify-center">
                            {goal.categoryIcon === "Plane" ? (
                              <Plane className="w-4 h-4" />
                            ) : goal.categoryIcon === "Shield" ? (
                              <Shield className="w-4 h-4" />
                            ) : goal.categoryIcon === "Coins" ? (
                              <Coins className="w-4 h-4" />
                            ) : (
                              <Laptop className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-foreground">{goal.title}</h4>
                            <span className="text-[10px] text-muted font-mono">
                              {formatCurrencyIDR(goal.currentAmount)} / {formatCurrencyIDR(goal.targetAmount)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isDone
                                ? "bg-[#E0FBF2] text-[#1F8766]"
                                : "bg-[#EDE5FF] text-[#7C5CFA]"
                            }`}
                          >
                            {isDone ? "Tuntas! 🎉" : `${percent}%`}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteSavingsGoal(goal.id)}
                            className="p-1 rounded-lg text-muted hover:text-[#D93D4A] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-[#FAF9FC] dark:bg-[#201D28] rounded-full overflow-hidden border border-border/80">
                        <div
                          className="h-full bg-gradient-to-r from-[#7C5CFA] to-[#7FE3C0] rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* Deposit Section */}
                      <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                        <div className="flex-1 flex gap-1.5">
                          {[10000, 25000, 50000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => handleDeposit(goal.id, amt)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#FAF9FC] dark:bg-[#201D28] border border-border hover:border-[#7C5CFA] text-foreground transition-all"
                            >
                              +{amt / 1000}rb
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGoalId(goal.id);
                            setActiveTab("projections");
                          }}
                          className="text-[11px] font-bold text-[#7C5CFA] hover:underline flex items-center gap-1"
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>Simulasi</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* PROJECTIONS & INVESTMENT SIMULATOR */
          <div className="space-y-4 pt-1">
            {activeSimGoal && timeline && simulation ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EDE5FF]/50 to-[#E0FBF2]/50 dark:from-[#2A2338] dark:to-[#1A2E26] border border-[#B69CFF]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-foreground">
                    Target: {activeSimGoal.title}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#7C5CFA]">
                    Sisa {formatCurrencyIDR(timeline.remainingAmount)}
                  </span>
                </div>

                {/* Timeline Box */}
                <div className="p-3 rounded-xl bg-surface border border-border text-xs space-y-1">
                  <div className="flex items-center justify-between text-muted">
                    <span>Estimasi selesai dengan laju tabungan saat ini:</span>
                    <span className="font-bold text-foreground font-mono">
                      ~{timeline.daysNeeded} hari lagi
                    </span>
                  </div>
                  <p className="text-[11px] text-muted">
                    Perkiraan tanggal:{" "}
                    <b className="text-foreground">{formatDateRelative(timeline.projectedDate)}</b>
                  </p>
                </div>

                {/* What-If Extra Savings Slider */}
                <div className="space-y-2 pt-1 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-[#1F8766]" />
                      <span>Skenario Hemat Ekstra:</span>
                    </span>
                    <span className="font-mono font-extrabold text-[#1F8766]">
                      +{formatCurrencyIDR(extraDailySavings)}/hari
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={25000}
                    step={2500}
                    value={extraDailySavings}
                    onChange={(e) => setExtraDailySavings(Number(e.target.value))}
                    className="w-full accent-[#1F8766] cursor-pointer"
                  />

                  {simulation.daysSaved > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#E0FBF2] dark:bg-[#1E332A] text-[#1F8766] dark:text-[#7FE3C0] text-xs font-bold flex items-center gap-1.5 animate-in fade-in-50">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>
                        Targetmu akan tercapai {simulation.daysSaved} hari lebih cepat (~{simulation.newDays} hari total)!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                Belum ada target celengan aktif. Buat target impian terlebih dahulu di tab Celengan!
              </div>
            )}

            {/* Micro-Investing Simulator */}
            <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-foreground">
                    Literasi Komparasi Tabungan Mahasiswa
                  </h4>
                  <p className="text-[10px] text-muted">
                    Jika sisihkan {formatCurrencyIDR(extraDailySavings * 30)}/bulan selama {investmentMonths} bulan
                  </p>
                </div>
                <div className="flex gap-1">
                  {[6, 12, 24].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setInvestmentMonths(m)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                        investmentMonths === m
                          ? "bg-[#7C5CFA] text-white border-transparent"
                          : "border-border text-muted"
                      }`}
                    >
                      {m} bln
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {investmentComparisons.map((v, i) => (
                  <div
                    key={v.name}
                    className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#201D28] border border-border space-y-1.5 text-xs"
                  >
                    <span className="text-[10px] font-bold text-muted block leading-tight">
                      {v.name} ({v.annualRate}%)
                    </span>
                    <div className="font-mono font-black text-sm text-foreground">
                      {formatCurrencyIDR(v.finalBalance)}
                    </div>
                    <span
                      className={`text-[10px] font-bold block ${
                        v.gain > 0 ? "text-[#1F8766] dark:text-[#7FE3C0]" : "text-muted"
                      }`}
                    >
                      {v.gain > 0 ? `+${formatCurrencyIDR(v.gain)} imbal balik` : "Tanpa pertumbuhan"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Auto Round-up Spare Change Box */}
            <div className="p-4 rounded-2xl bg-surface border border-dashed border-border flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#FFC978]" />
                  <span>Potensi Celengan Kembalian (Round-Up)</span>
                </span>
                <p className="text-[11px] text-muted mt-0.5">
                  Membulatkan belanja ke Rp 2.500 terdekat berpotensi mengumpulkan:
                </p>
              </div>
              <div className="text-right shrink-0 font-mono">
                <span className="font-extrabold text-sm text-[#1F8766] block">
                  ~{formatCurrencyIDR(roundUp.in1Year)}/thn
                </span>
                <span className="text-[10px] text-muted">tanpa terasa</span>
              </div>
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
