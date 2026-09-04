"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { ArrowRight, ArrowLeft, Sparkles, BookOpen, Wallet, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { triggerHaptic } from "@/lib/haptics";
import { formatCurrencyIDR, cn } from "@/lib/utils";

const COURSE_COLORS = ["#B69CFF", "#7FE3C0", "#FFC978", "#FF7A85", "#8EC8FF"];
const BUDGET_PRESETS = [300000, 500000, 750000, 1000000];

/**
 * P3: Wizard onboarding 3 langkah (skippable) — target KPI activation:
 * user baru punya ≥1 matkul & ≥1 budget sebelum masuk dashboard.
 */
export function OnboardingWizard() {
  const { user } = useAuthStore();
  const { addCourse, setBudgetLimit, categories, completeOnboarding } = useDataStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(() => user?.displayName?.split(" ")[0] || "");
  const [courseName, setCourseName] = useState("");
  const [courseColor, setCourseColor] = useState(COURSE_COLORS[0]);
  const [budget, setBudget] = useState<number>(500000);
  const [saving, setSaving] = useState(false);

  const finish = async (persist: boolean) => {
    setSaving(true);
    try {
      if (persist) {
        if (courseName.trim()) {
          await addCourse({ name: courseName.trim(), color: courseColor, sks: 3 });
        }
        const foodCat =
          categories.find((c) => c.name.toLowerCase().includes("makan")) ||
          categories.find((c) => c.type === "expense");
        if (foodCat) {
          await setBudgetLimit(foodCat.id, budget);
        }
      }
      await completeOnboarding(name);
      triggerHaptic("success");
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#B69CFF", "#7FE3C0", "#FFC978"],
      });
    } finally {
      setSaving(false);
    }
  };

  const canNextStep1 = name.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Panduan awal Felys"
    >
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md rounded-[28px] bg-surface border border-border shadow-float p-6 sm:p-8 space-y-5"
      >
        {/* Progress */}
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-[#7C5CFA]" : "bg-black/10 dark:bg-white/10"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center text-white text-xl font-extrabold shadow-soft">
                F
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                  Halo, kenalin aku Fio ✨
                </h2>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Aku bantu jaga tugas kuliah & uang sakumu dalam satu tempat. Siapa nama panggilanmu?
                </p>
              </div>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canNextStep1 && setStep(1)}
                placeholder="cth: Rian"
                maxLength={30}
                aria-label="Nama panggilan"
                className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE5FF] dark:bg-[#383442] flex items-center justify-center text-[#7C5CFA] shadow-soft">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                  Mata kuliah tersibukmu apa{name.trim() ? `, ${name.trim()}` : ""}?
                </h2>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Cukup satu dulu — sisanya bisa ditambah nanti dari halaman Matkul.
                </p>
              </div>
              <input
                autoFocus
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && courseName.trim() && setStep(2)}
                placeholder="cth: Struktur Data"
                maxLength={60}
                aria-label="Nama mata kuliah"
                className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
              />
              <div className="flex items-center gap-2" role="radiogroup" aria-label="Warna mata kuliah">
                {COURSE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCourseColor(c)}
                    aria-label={`Warna ${c}`}
                    aria-pressed={courseColor === c}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      courseColor === c ? "ring-2 ring-offset-2 ring-[#7C5CFA] scale-110" : "hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E0FBF2] dark:bg-[#1E3029] flex items-center justify-center text-[#1F8766] shadow-soft">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                  Budget makan sebulan berapa?
                </h2>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Fio akan mengingatkan sebelum jebol — santai, bisa diubah kapan pun.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pilihan budget makan">
                {BUDGET_PRESETS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setBudget(v)}
                    aria-pressed={budget === v}
                    className={cn(
                      "py-2.5 rounded-2xl border text-xs font-extrabold transition-all",
                      budget === v
                        ? "bg-[#E0FBF2] dark:bg-[#1E3029] border-[#37B98F] text-[#1F8766] ring-2 ring-[#7FE3C0]/60"
                        : "bg-[#FAF9FC] dark:bg-[#2F2B3A] border-border text-muted hover:text-foreground"
                    )}
                  >
                    {formatCurrencyIDR(v)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {step > 0 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(step - 1)}
              className="rounded-2xl"
              aria-label="Kembali ke langkah sebelumnya"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          {step < 2 ? (
            <Button
              type="button"
              variant="primary"
              disabled={(step === 0 && !canNextStep1) || saving}
              onClick={() => {
                triggerHaptic("light");
                if (step === 1 && !courseName.trim()) {
                  setStep(2);
                  return;
                }
                setStep(step + 1);
              }}
              className="flex-1 h-11 rounded-2xl font-bold"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              disabled={saving}
              onClick={() => finish(true)}
              className="flex-1 h-11 rounded-2xl font-bold"
            >
              <PartyPopper className="w-4 h-4" />
              <span>{saving ? "Menyiapkan..." : "Mulai Pakai Felys"}</span>
            </Button>
          )}
        </div>

        <button
          type="button"
          onClick={() => finish(false)}
          disabled={saving}
          className="w-full text-center text-[11px] text-muted hover:text-foreground font-medium transition-colors"
        >
          Lewati dulu, isi nanti →
        </button>

        <p className="flex items-center justify-center gap-1 text-[10px] text-muted">
          <Sparkles className="w-3 h-3" />
          Langkah {step + 1} dari 3 • bisa diubah kapan pun di Pengaturan
        </p>
      </motion.div>
    </motion.div>
  );
}
