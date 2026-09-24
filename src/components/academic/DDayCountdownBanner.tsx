"use client";

import React, { useState, useEffect } from "react";
import { differenceInDays, format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, Flame, Sparkles, Edit2, Check, Trophy } from "lucide-react";
import { useDataStore } from "@/stores/use-data-store";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";

export function DDayCountdownBanner() {
  const { ddayEvent, updateDDayEvent } = useDataStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(ddayEvent.title);
  const [tempDate, setTempDate] = useState(ddayEvent.targetDate);

  // Sync state when ddayEvent changes from Firestore
  useEffect(() => {
    setTempTitle(ddayEvent.title);
    setTempDate(ddayEvent.targetDate);
  }, [ddayEvent]);

  const hasTargetDate = Boolean(ddayEvent.targetDate);
  const target = hasTargetDate ? new Date(ddayEvent.targetDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (target) target.setHours(0, 0, 0, 0);

  const daysLeft = target ? differenceInDays(target, today) : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempTitle.trim() || !tempDate) return;
    try {
      triggerHaptic("medium");
      await updateDDayEvent({
        title: tempTitle.trim(),
        targetDate: tempDate,
      });
      setIsEditing(false);
      toast.success("Target D-Day berhasil disimpan!");
    } catch {
      toast.error("Gagal menyimpan Target D-Day ke server.");
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#7C5CFA]/15 via-[#B69CFF]/15 to-[#7FE3C0]/15 border border-[#7C5CFA]/30 shadow-soft relative overflow-hidden">
      {!isEditing ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7C5CFA] to-[#6842f5] flex items-center justify-center text-white shadow-soft shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7C5CFA] bg-surface px-2 py-0.5 rounded-full border border-border">
                  D-Day Countdown
                </span>
                <button
                  onClick={() => {
                    setTempTitle(ddayEvent.title);
                    setTempDate(ddayEvent.targetDate);
                    setIsEditing(true);
                  }}
                  className="text-muted hover:text-foreground transition-all p-0.5"
                  title="Ubah Target D-Day"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-foreground mt-0.5">
                {ddayEvent.title || "Target Ujian / Sidang"}
              </h3>
              <p className="text-[11px] text-muted">
                {target
                  ? `Tanggal: ${format(target, "EEEE, d MMMM yyyy", { locale: id })}`
                  : "Target tanggal belum diatur"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {daysLeft !== null ? (
              <div className="text-right">
                <span
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    daysLeft <= 3
                      ? "text-[#FF7A85]"
                      : daysLeft <= 7
                      ? "text-[#B86B14]"
                      : "text-[#7C5CFA]"
                  }`}
                >
                  {daysLeft > 0 ? `H-${daysLeft}` : daysLeft === 0 ? "HARI H!" : "Selesai"}
                </span>
                <span className="text-[10px] font-bold text-muted block">
                  {daysLeft > 0 ? `${daysLeft} hari lagi` : "Semoga sukses!"}
                </span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTempTitle(ddayEvent.title);
                  setTempDate(ddayEvent.targetDate);
                  setIsEditing(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-bold shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Atur Tanggal</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground">Atur Target D-Day Ujian / Sidang</h4>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-muted hover:text-foreground"
            >
              Batal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              placeholder="Nama Event (Contoh: UTS Semester Ganjil)"
              className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
            />
            <input
              type="date"
              required
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-soft hover:brightness-110 active:scale-98 transition-all flex items-center justify-center"
            title="Simpan Target"
          >
            <Check className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
