"use client";

import React from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { formatCurrencyIDR } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import { Utensils, Sparkles, Check, Heart, Zap, ShieldCheck } from "lucide-react";

interface HealthyMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMeal?: (amount: number, note: string) => void;
}

export function HealthyMealModal({ isOpen, onClose, onSelectMeal }: HealthyMealModalProps) {
  const { getDailyAllowanceSummary, addTransaction } = useDataStore();
  const daily = getDailyAllowanceSummary();

  if (!isOpen) return null;

  const budget = Math.max(15000, daily.todayRemaining > 0 ? daily.todayRemaining : 20000);

  const mealOptions = [
    {
      title: "Warteg Sehat & Hemat Bergizi",
      type: "warteg",
      price: Math.min(budget, 14000),
      items: ["Nasi Putih", "Telur Balado / Dadar", "Sayur Bayam Bening", "Tempe Orek"],
      nutrition: "Tinggi Protein & Zat Besi (Anti Lemas saat Kuliah)",
      badge: "Paling Populer ⭐",
      color: "from-[#7FE3C0]/30 to-[#37B98F]/20 border-[#7FE3C0]/50",
    },
    {
      title: "Masak Cepat di Kosan",
      type: "cook",
      price: Math.min(budget, 9000),
      items: ["Nasi Kosan", "Tumis Kangkung Bawang", "Telur Ceplok", "Tahu Goreng"],
      nutrition: "Serat Alami & Vitamin A/C (Hemat 50%)",
      badge: "Super Hemat 💰",
      color: "from-[#EDE5FF]/40 to-[#B69CFF]/20 border-[#B69CFF]/50",
    },
    {
      title: "Menu Kenyang Berenergi Kuliah",
      type: "dining",
      price: Math.min(budget, 18000),
      items: ["Nasi Putih", "Ayam Bakar / Suwir Dada", "Lalapan Timun & Sambal", "Es Teh Tawar"],
      nutrition: "Asupan Kalori Optimal untuk Tugas Padat",
      badge: "Energi Maksimal 🔥",
      color: "from-[#FFF4E5]/40 to-[#FFC978]/20 border-[#FFC978]/50",
    },
  ];

  const handleChooseMeal = async (price: number, name: string) => {
    try {
      triggerHaptic("success");
      await addTransaction({
        type: "expense",
        amount: price,
        categoryId: "cat_makan",
        categoryName: "Makan & Minum",
        note: `Menu Sehat: ${name}`,
        date: new Date().toISOString(),
      });

      toast.success(`Pengeluaran makan ${formatCurrencyIDR(price)} berhasil dicatat! Selamat makan ✨`);
      onClose();
    } catch (err) {
      toast.error("Gagal mencatat transaksi.");
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Rekomendasi Menu Makan Sehat Mahasiswa 🥗"
        description="Pilihan makanan hemat bernutrisi yang pas dengan sisa jatah belanja kamu hari ini."
      >
        <div className="space-y-4 pt-2">
          {/* Header Allowance Status */}
          <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#2A2634] border border-border flex items-center justify-between text-xs">
            <span className="text-muted">
              Sisa Jatah Belanja Hari Ini:
            </span>
            <span className="font-extrabold text-[#1F8766] text-sm">
              {formatCurrencyIDR(daily.todayRemaining > 0 ? daily.todayRemaining : 0)}
            </span>
          </div>

          {/* 3 Meal Cards */}
          <div className="space-y-3">
            {mealOptions.map((meal, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-3xl bg-gradient-to-r ${meal.color} border space-y-2.5 transition-all hover:shadow-soft`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface text-foreground shadow-2xs inline-block mb-1">
                      {meal.badge}
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-foreground">
                      {meal.title}
                    </h4>
                  </div>
                  <span className="text-sm font-extrabold text-foreground shrink-0">
                    {formatCurrencyIDR(meal.price)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] text-foreground font-medium">
                  {meal.items.map((it, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg bg-surface/80 border border-border/60">
                      {it}
                    </span>
                  ))}
                </div>

                <p className="text-[10px] text-muted flex items-center gap-1">
                  <Heart className="w-3 h-3 text-[#FF7A85] shrink-0" />
                  <span>{meal.nutrition}</span>
                </p>

                <Button
                  type="button"
                  variant="finance"
                  size="sm"
                  onClick={() => handleChooseMeal(meal.price, meal.title)}
                  className="w-full rounded-xl text-xs"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Pilih & Catat Menu ({formatCurrencyIDR(meal.price)})</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
