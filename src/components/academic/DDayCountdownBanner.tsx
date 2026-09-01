"use client";

import React, { useState, useEffect } from "react";
import { differenceInDays, format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, Flame, Sparkles, Edit2, Check, Trophy } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";

export function DDayCountdownBanner() {
  const [eventTitle, setEventTitle] = useState("Ujian Tengah Semester (UTS)");
  const [eventDate, setEventDate] = useState("2026-09-21");
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(eventTitle);
  const [tempDate, setTempDate] = useState(eventDate);

  useEffect(() => {
    const savedTitle = localStorage.getItem("felys_dday_title");
    const savedDate = localStorage.getItem("felys_dday_date");
    if (savedTitle) setEventTitle(savedTitle);
    if (savedDate) setEventDate(savedDate);
  }, []);

  const target = new Date(eventDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const daysLeft = differenceInDays(target, today);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempTitle.trim() || !tempDate) return;
    triggerHaptic("medium");
    setEventTitle(tempTitle.trim());
    setEventDate(tempDate);
    localStorage.setItem("felys_dday_title", tempTitle.trim());
    localStorage.setItem("felys_dday_date", tempDate);
    setIsEditing(false);
    toast.success("Target D-Day berhasil diperbarui! 🎯");
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
                    setTempTitle(eventTitle);
                    setTempDate(eventDate);
                    setIsEditing(true);
                  }}
                  className="text-muted hover:text-foreground transition-all p-0.5"
                  title="Ubah Target D-Day"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-foreground mt-0.5">
                {eventTitle}
              </h3>
              <p className="text-[11px] text-muted">
                Tanggal: {format(target, "EEEE, d MMMM yyyy", { locale: id })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
                {daysLeft > 0 ? `H-${daysLeft}` : daysLeft === 0 ? "HARI H! 🔥" : "Selesai ✨"}
              </span>
              <span className="text-[10px] font-bold text-muted block">
                {daysLeft > 0 ? `${daysLeft} hari lagi` : "Semoga sukses!"}
              </span>
            </div>
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
            className="w-full py-1.5 rounded-xl bg-[#7C5CFA] text-white text-xs font-bold shadow-soft hover:bg-[#6842f5] transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Simpan Target D-Day</span>
          </button>
        </form>
      )}
    </div>
  );
}
