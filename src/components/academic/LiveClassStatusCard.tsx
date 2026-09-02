"use client";

import React, { useState, useEffect } from "react";
import { useDataStore } from "@/stores/use-data-store";
import { Course, CourseSchedule } from "@/types/academic";
import { Clock, MapPin, Sparkles, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";

export function LiveClassStatusCard() {
  const { courses } = useDataStore();
  const [now, setNow] = useState(new Date());

  // Minute-level update interval (low battery & CPU consumption)
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentDay = now.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Extract all schedules for today
  const todayClasses: {
    course: Course;
    schedule: CourseSchedule;
    startMin: number;
    endMin: number;
  }[] = [];

  courses.forEach((c) => {
    if (c.schedules && c.schedules.length > 0) {
      c.schedules.forEach((s) => {
        if (s.dayOfWeek === currentDay) {
          const [sh, sm] = s.startTime.split(":").map(Number);
          const [eh, em] = s.endTime.split(":").map(Number);
          todayClasses.push({
            course: c,
            schedule: s,
            startMin: sh * 60 + sm,
            endMin: eh * 60 + em,
          });
        }
      });
    }
  });

  // Sort chronologically
  todayClasses.sort((a, b) => a.startMin - b.startMin);

  // Find ongoing class
  const ongoingClass = todayClasses.find(
    (c) => currentMinutes >= c.startMin && currentMinutes < c.endMin
  );

  // Find upcoming class
  const upcomingClass = todayClasses.find((c) => currentMinutes < c.startMin);

  if (todayClasses.length === 0) {
    return (
      <div className="p-4 rounded-3xl bg-surface border border-border shadow-soft flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#EDE5FF] dark:bg-[#342F3E] text-[#7C5CFA] flex items-center justify-center font-bold text-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-foreground block">
              Tidak Ada Jadwal Kuliah Hari Ini ✨
            </span>
            <span className="text-[11px] text-muted">
              Waktunya cicil tugas berurgensi tinggi atau istirahat!
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (ongoingClass) {
    const minutesLeft = ongoingClass.endMin - currentMinutes;

    return (
      <div className="p-4 rounded-3xl bg-gradient-to-r from-[#FF7A85]/15 via-[#FFC978]/15 to-[#7FE3C0]/15 border border-[#FF7A85]/40 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-xs shrink-0 relative"
            style={{ backgroundColor: ongoingClass.course.color }}
          >
            <BookOpen className="w-4 h-4" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF7A85] border-2 border-surface absolute -top-0.5 -right-0.5 animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF7A85] absolute -top-0.5 -right-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF7A85] bg-surface px-2 py-0.5 rounded-full border border-border">
                ● Sedang Berlangsung
              </span>
              {ongoingClass.schedule.room && (
                <span className="text-[11px] text-muted flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#1F8766]" />
                  <span>{ongoingClass.schedule.room}</span>
                </span>
              )}
            </div>
            <h3 className="text-sm font-extrabold text-foreground mt-0.5">
              {ongoingClass.course.name}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:text-right shrink-0">
          <div className="p-2 px-3 rounded-2xl bg-surface border border-border">
            <span className="text-[10px] text-muted font-bold block uppercase">
              Sisa Waktu Kelas
            </span>
            <span className="text-sm font-extrabold text-[#FF7A85] font-mono">
              {minutesLeft} Menit Lagi
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (upcomingClass) {
    const minutesUntil = upcomingClass.startMin - currentMinutes;
    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    const timeText = hours > 0 ? `${hours} jam ${mins} mnt lagi` : `${mins} menit lagi`;

    return (
      <div className="p-4 rounded-3xl bg-surface border border-border shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-xs shrink-0"
            style={{ backgroundColor: upcomingClass.course.color }}
          >
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7C5CFA] bg-[#EDE5FF] dark:bg-[#342F3E] px-2 py-0.5 rounded-full">
                Kuliah Berikutnya
              </span>
              <span className="text-[11px] text-muted">
                Pukul {upcomingClass.schedule.startTime} – {upcomingClass.schedule.endTime}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-foreground mt-0.5">
              {upcomingClass.course.name}
              {upcomingClass.schedule.room ? ` (${upcomingClass.schedule.room})` : ""}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:text-right shrink-0">
          <div className="p-2 px-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border">
            <span className="text-[10px] text-muted font-bold block uppercase">
              Masuk Kelas
            </span>
            <span className="text-sm font-extrabold text-[#7C5CFA] font-mono">
              {timeText}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-3xl bg-surface border border-border shadow-soft flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#E0FBF2] dark:bg-[#1E332A] text-[#1F8766] flex items-center justify-center font-bold text-xs shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-foreground block">
            Semua Kuliah Hari Ini Selesai! 🎉
          </span>
          <span className="text-[11px] text-muted">
            Total {todayClasses.length} kelas telah terlaksana hari ini.
          </span>
        </div>
      </div>
    </div>
  );
}
