"use client";

import React, { useState } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { formatCurrencyIDR } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Target, Plus, Trash2, CheckCircle2, Laptop, Sparkles, Plane, Shield, Coins } from "lucide-react";

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavingsGoalModal({ isOpen, onClose }: SavingsGoalModalProps) {
  const { savingsGoals, addSavingsGoal, depositToSavingsGoal, deleteSavingsGoal, getDailyAllowanceSummary } = useDataStore();
  const daily = getDailyAllowanceSummary();

  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState<number | "">("");
  const [targetDate, setTargetDate] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("Laptop");
  const [depositAmount, setDepositAmount] = useState<number | "">("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
      setSelectedGoalId(null);
      setDepositAmount("");
    } catch (err) {
      toast.error("Gagal menambah tabungan.");
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Celengan Impian Mahasiswa 🎯"
        description="Tabung sisa uang jajan harian untuk membeli impian kuliah atau liburan semester."
      >
        <div className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto px-0.5">
          {/* Active Goals List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
              Daftar Target Aktif ({savingsGoals.length})
            </h4>

            {savingsGoals.length > 0 ? (
              <div className="space-y-3">
                {savingsGoals.map((goal) => {
                  const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                  const isCompleted = goal.isCompleted || percentage >= 100;

                  return (
                    <div
                      key={goal.id}
                      className={`p-4 rounded-3xl border transition-all ${
                        isCompleted
                          ? "bg-[#E0FBF2]/60 dark:bg-[#1E332A] border-[#7FE3C0]"
                          : "bg-surface border-border shadow-soft"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center text-white font-bold text-sm shadow-soft shrink-0">
                            {goal.categoryIcon === "Laptop" ? (
                              <Laptop className="w-4 h-4" />
                            ) : goal.categoryIcon === "Plane" ? (
                              <Plane className="w-4 h-4" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <span>{goal.title}</span>
                              {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#1F8766]" />}
                            </h4>
                            <p className="text-[10px] text-muted">
                              Terkumpul: <b>{formatCurrencyIDR(goal.currentAmount)}</b> / {formatCurrencyIDR(goal.targetAmount)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isCompleted
                                ? "bg-[#7FE3C0] text-[#1F8766]"
                                : "bg-[#EDE5FF] text-[#7C5CFA]"
                            }`}
                          >
                            {percentage}%
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteSavingsGoal(goal.id)}
                            className="p-1 rounded-lg text-muted hover:text-[#FF7A85] hover:bg-[#FFE8EA] transition-all"
                            title="Hapus Target"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-2.5 bg-[#EDEAF2] dark:bg-[#383442] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted ? "bg-[#7FE3C0]" : "bg-gradient-to-r from-[#7C5CFA] to-[#B69CFF]"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Deposit Actions */}
                      {!isCompleted && (
                        <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap">
                          {daily.todayRemaining > 5000 && (
                            <button
                              type="button"
                              onClick={() => handleDeposit(goal.id, Math.min(daily.todayRemaining, 20000))}
                              className="px-2.5 py-1 rounded-xl bg-[#EDE5FF] dark:bg-[#383442] text-[#7C5CFA] dark:text-[#B69CFF] text-[10px] font-bold hover:bg-[#7C5CFA] hover:text-white transition-all flex items-center gap-1"
                            >
                              <Coins className="w-3 h-3" />
                              <span>Nabung Sisa Jatah ({formatCurrencyIDR(Math.min(daily.todayRemaining, 20000))})</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedGoalId(selectedGoalId === goal.id ? null : goal.id)}
                            className="px-2.5 py-1 rounded-xl border border-border text-muted hover:text-foreground text-[10px] font-bold transition-all ml-auto"
                          >
                            + Setor Nominal Lain
                          </button>
                        </div>
                      )}

                      {/* Deposit Custom Form */}
                      {selectedGoalId === goal.id && (
                        <div className="mt-2.5 flex gap-2 pt-2 border-t border-border/80">
                          <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(Number(e.target.value))}
                            placeholder="Nominal setor (Rp)..."
                            className="flex-1 bg-[#FAF9FC] dark:bg-[#2A2634] border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
                          />
                          <Button
                            type="button"
                            variant="finance"
                            size="sm"
                            onClick={() => handleDeposit(goal.id, Number(depositAmount))}
                            disabled={!depositAmount || Number(depositAmount) <= 0}
                          >
                            Setor
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted italic p-3 text-center bg-[#FAF9FC] dark:bg-[#2A2634] rounded-2xl border border-border">
                Belum ada target impian. Buat target pertamamu di bawah ini! ✨
              </p>
            )}
          </div>

          {/* Create Goal Form */}
          <form onSubmit={handleCreateGoal} className="p-4 rounded-3xl bg-[#FAF9FC] dark:bg-[#2A2634] border border-border space-y-3">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#7C5CFA]" />
              <span>Buat Target Celengan Baru</span>
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-foreground mb-1">
                Nama Impian <span className="text-[#FF7A85]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Beli iPad Air Kuliah / Tiket Kereta Liburan"
                className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1">
                  Target Nominal (Rp) <span className="text-[#FF7A85]">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={10000}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Contoh: 1500000"
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1">
                  Target Selesai
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="finance"
              size="sm"
              className="w-full rounded-xl"
              disabled={isCreating || !title.trim() || !targetAmount}
            >
              <Target className="w-4 h-4" />
              <span>Simpan Target Celengan</span>
            </Button>
          </form>
        </div>
      </ModalContent>
    </Modal>
  );
}
