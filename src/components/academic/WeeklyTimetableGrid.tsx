"use client";

import React, { useState } from "react";
import { useDataStore } from "@/stores/use-data-store";
import { Course, CourseSchedule } from "@/types/academic";
import { formatCurrencyIDR } from "@/lib/utils";
import { Calendar, Clock, MapPin, Plus, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";

const DAYS = [
  { id: 1, name: "Senin" },
  { id: 2, name: "Selasa" },
  { id: 3, name: "Rabu" },
  { id: 4, name: "Kamis" },
  { id: 5, name: "Jumat" },
];

export function WeeklyTimetableGrid() {
  const { courses, updateCourse } = useDataStore();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:30");
  const [room, setRoom] = useState("Lab Komputer 3");
  const [isAdding, setIsAdding] = useState(false);

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

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.error("Pilih mata kuliah terlebih dahulu.");
      return;
    }

    const course = courses.find((c) => c.id === selectedCourseId);
    if (!course) return;

    try {
      triggerHaptic("medium");
      const newSchedule: CourseSchedule = {
        id: `sch_${Date.now()}`,
        dayOfWeek: dayOfWeek as 1 | 2 | 3 | 4 | 5,
        startTime,
        endTime,
        room: room.trim() || undefined,
      };

      const updatedSchedules = [...(course.schedules || []), newSchedule];
      await updateCourse(course.id, { schedules: updatedSchedules });

      toast.success(`Jadwal kuliah ${course.name} berhasil ditambahkan! 📚`);
      setIsAdding(false);
    } catch (err) {
      toast.error("Gagal menambahkan jadwal.");
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
            Pantau jam perkuliahan Senin s/d Jumat dan lokasi ruangan kelas.
          </p>
        </div>

        {courses.length > 0 && (
          <Button
            type="button"
            variant="academic"
            size="sm"
            onClick={() => {
              if (!selectedCourseId && courses.length > 0) {
                setSelectedCourseId(courses[0].id);
              }
              setIsAdding(!isAdding);
            }}
            className="rounded-2xl shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? "Tutup Form" : "+ Tambah Jam Kuliah"}</span>
          </Button>
        )}
      </div>

      {/* Add Schedule Form */}
      {isAdding && (
        <form onSubmit={handleAddSchedule} className="p-4 rounded-3xl bg-surface border border-border shadow-soft space-y-3">
          <h4 className="text-xs font-bold text-foreground">
            Tambah Jam Kuliah Baru
          </h4>

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
                    {d.name}
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
            Simpan Jadwal Kuliah
          </Button>
        </form>
      )}

      {/* 5-Column Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {DAYS.map((day) => {
          const dayClasses = allSchedules
            .filter((s) => s.schedule.dayOfWeek === day.id)
            .sort((a, b) => a.schedule.startTime.localeCompare(b.schedule.startTime));

          return (
            <div
              key={day.id}
              className="p-3.5 rounded-3xl bg-surface border border-border shadow-soft space-y-3 min-h-[180px] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-extrabold text-foreground">
                  {day.name}
                </span>
                <span className="text-[10px] font-bold text-muted px-2 py-0.5 rounded-full bg-[#FAF9FC] dark:bg-[#2A2634]">
                  {dayClasses.length} Kelas
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {dayClasses.length > 0 ? (
                  dayClasses.map(({ course, schedule }) => (
                    <div
                      key={schedule.id}
                      className="p-3 rounded-2xl border transition-all text-xs space-y-1.5 hover:shadow-xs"
                      style={{
                        backgroundColor: `${course.color}15`,
                        borderColor: `${course.color}40`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-foreground leading-tight">
                          {course.name}
                        </span>
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
                          <span>{schedule.room}</span>
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
