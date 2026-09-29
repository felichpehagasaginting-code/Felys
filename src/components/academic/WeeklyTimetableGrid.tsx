"use client";

import React, { useState } from "react";
import { useDataStore } from "@/stores/use-data-store";
import { Course, CourseSchedule } from "@/types/academic";
import { Calendar, Clock, MapPin, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";

export const DAYS = [
  { id: 1, name: "Senin", short: "Sen" },
  { id: 2, name: "Selasa", short: "Sel" },
  { id: 3, name: "Rabu", short: "Rab" },
  { id: 4, name: "Kamis", short: "Kam" },
  { id: 5, name: "Jumat", short: "Jum" },
  { id: 6, name: "Sabtu", short: "Sab" },
  { id: 7, name: "Minggu", short: "Min" },
] as const;

export function WeeklyTimetableGrid() {
  const { courses, updateCourse } = useDataStore();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:30");
  const [room, setRoom] = useState("Lab Komputer 3");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editingFromCourseId, setEditingFromCourseId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Hitung hari ini dalam format 1 = Senin, ..., 7 = Minggu
  const jsDay = new Date().getDay();
  const todayDayOfWeek = jsDay === 0 ? 7 : jsDay;

  // Derive schedule items across all courses
  const allSchedules: {
    course: Course;
    schedule: CourseSchedule;
  }[] = [];

  courses.forEach((c) => {
    if (c.schedules && c.schedules.length > 0) {
      c.schedules.forEach((s) => {
        allSchedules.push({ course: c, schedule: s });
      });
    }
  });

  const resetForm = () => {
    setEditingScheduleId(null);
    setEditingFromCourseId(null);
    setStartTime("08:00");
    setEndTime("10:30");
    setRoom("");
    setIsAdding(false);
  };

  const handleStartEdit = (course: Course, schedule: CourseSchedule) => {
    triggerHaptic("light");
    setSelectedCourseId(course.id);
    setDayOfWeek(schedule.dayOfWeek);
    setStartTime(schedule.startTime);
    setEndTime(schedule.endTime);
    setRoom(schedule.room || "");
    setEditingScheduleId(schedule.id);
    setEditingFromCourseId(course.id);
    setIsAdding(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.error("Pilih mata kuliah terlebih dahulu.");
      return;
    }

    const targetCourse = courses.find((c) => c.id === selectedCourseId);
    if (!targetCourse) return;

    try {
      triggerHaptic("medium");

      const scheduleData: CourseSchedule = {
        id: editingScheduleId || `sch_${Date.now()}`,
        dayOfWeek: dayOfWeek as 1 | 2 | 3 | 4 | 5 | 6 | 7,
        startTime,
        endTime,
        room: room.trim() || undefined,
      };

      if (editingScheduleId && editingFromCourseId) {
        if (editingFromCourseId === selectedCourseId) {
          // Edit in-place pada mata kuliah yang sama
          const updatedSchedules = (targetCourse.schedules || []).map((s) =>
            s.id === editingScheduleId ? scheduleData : s
          );
          await updateCourse(targetCourse.id, { schedules: updatedSchedules });
        } else {
          // Mata kuliah dipindah ke MK lain
          const oldCourse = courses.find((c) => c.id === editingFromCourseId);
          if (oldCourse) {
            const oldSchedules = (oldCourse.schedules || []).filter((s) => s.id !== editingScheduleId);
            await updateCourse(oldCourse.id, { schedules: oldSchedules });
          }
          const targetSchedules = [...(targetCourse.schedules || []), scheduleData];
          await updateCourse(targetCourse.id, { schedules: targetSchedules });
        }
        toast.success(`Jadwal kuliah ${targetCourse.name} berhasil diperbarui!`);
      } else {
        // Tambah jadwal baru
        const updatedSchedules = [...(targetCourse.schedules || []), scheduleData];
        await updateCourse(targetCourse.id, { schedules: updatedSchedules });
        toast.success(`Jadwal kuliah ${targetCourse.name} berhasil ditambahkan!`);
      }

      resetForm();
    } catch {
      toast.error("Gagal menyimpan jadwal.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#7C5CFA]" />
            <span>Jadwal Kuliah Mingguan (Timetable)</span>
          </h3>
          <p className="text-xs text-muted">
            Pantau jam perkuliahan Senin s/d Minggu dan lokasi ruangan kelas.
          </p>
        </div>

        {courses.length > 0 && (
          <Button
            type="button"
            variant="academic"
            size="sm"
            onClick={() => {
              if (isAdding) {
                resetForm();
              } else {
                if (!selectedCourseId && courses.length > 0) {
                  setSelectedCourseId(courses[0].id);
                }
                setEditingScheduleId(null);
                setEditingFromCourseId(null);
                setIsAdding(true);
              }
            }}
            className="rounded-2xl shrink-0"
          >
            {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isAdding ? "Tutup Form" : "+ Tambah Jam Kuliah"}</span>
          </Button>
        )}
      </div>

      {/* Add / Edit Schedule Form */}
      {isAdding && (
        <form onSubmit={handleSaveSchedule} className="p-4 rounded-3xl bg-surface border border-border shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground">
              {editingScheduleId ? "Edit Jam Kuliah" : "Tambah Jam Kuliah Baru"}
            </h4>
            {editingScheduleId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] text-muted hover:text-foreground font-semibold"
              >
                Batal Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-muted mb-1">Mata Kuliah</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-[#FAF9FC] dark:bg-[#2A2634] border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted mb-1">Hari</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full bg-[#FAF9FC] dark:bg-[#2A2634] border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
              >
                {DAYS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.id === todayDayOfWeek ? "(Hari Ini)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted mb-1">Jam Mulai</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#FAF9FC] dark:bg-[#2A2634] border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted mb-1">Jam Selesai</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[#FAF9FC] dark:bg-[#2A2634] border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted mb-1">Ruangan / Lab</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="R. 302 / Lab AI"
                className="w-full bg-[#FAF9FC] dark:bg-[#2A2634] border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
              />
            </div>
          </div>

          <Button type="submit" variant="academic" size="sm" className="w-full rounded-xl">
            {editingScheduleId ? "Simpan Perubahan Jadwal" : "Simpan Jadwal Kuliah"}
          </Button>
        </form>
      )}

      {/* 7-Days Responsive Grid (Senin s/d Minggu) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {DAYS.map((day) => {
          const isToday = day.id === todayDayOfWeek;
          const dayClasses = allSchedules
            .filter((s) => s.schedule.dayOfWeek === day.id)
            .sort((a, b) => a.schedule.startTime.localeCompare(b.schedule.startTime));

          return (
            <div
              key={day.id}
              className={`p-3.5 rounded-3xl bg-surface border shadow-soft space-y-3 min-h-[180px] flex flex-col transition-all ${
                isToday
                  ? "border-[#7C5CFA]/50 ring-2 ring-[#7C5CFA]/20"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-extrabold ${isToday ? "text-[#7C5CFA]" : "text-foreground"}`}>
                    {day.name}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-[#EDE5FF] dark:bg-[#342A45] text-[#7C5CFA]">
                      Hari Ini
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-muted px-2 py-0.5 rounded-full bg-[#FAF9FC] dark:bg-[#2A2634]">
                  {dayClasses.length} Kelas
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {dayClasses.length > 0 ? (
                  dayClasses.map(({ course, schedule }) => (
                    <div
                      key={schedule.id}
                      className="p-3 rounded-2xl border transition-all text-xs space-y-1.5 hover:shadow-xs group/card"
                      style={{
                        backgroundColor: `${course.color}15`,
                        borderColor: `${course.color}40`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-foreground leading-tight truncate">
                          {course.name}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(course, schedule)}
                            className="p-1 rounded-md text-muted hover:text-[#7C5CFA] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                            title="Edit Jadwal"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              triggerHaptic("warning");
                              const nextSchedules = (course.schedules || []).filter((s) => s.id !== schedule.id);
                              await updateCourse(course.id, { schedules: nextSchedules });
                              toast.info(`Jadwal ${course.name} dihapus.`);
                            }}
                            className="p-1 rounded-md text-muted hover:text-[#FF7A85] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-muted">
                        <Clock className="w-3 h-3 text-[#7C5CFA] shrink-0" />
                        <span>
                          {schedule.startTime} – {schedule.endTime}
                        </span>
                      </div>

                      {schedule.room && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted">
                          <MapPin className="w-3 h-3 text-[#1F8766] shrink-0" />
                          <span className="truncate">{schedule.room}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-3">
                    <p className="text-[11px] text-muted italic">Tidak ada kelas</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
