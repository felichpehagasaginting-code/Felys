"use client";

import React, { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, Share2, Download } from "lucide-react";
import { useDataStore } from "@/stores/use-data-store";
import { TaskCard } from "@/components/academic/TaskCard";
import { TaskFormModal } from "@/components/academic/TaskFormModal";
import { Task } from "@/types/academic";
import { cn } from "@/lib/utils";
import { AcademicNavTabs } from "@/components/academic/AcademicNavTabs";
import { downloadICSFile } from "@/lib/calendar-sync";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function AcademicCalendarPage() {
  const { tasks } = useDataStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const tasksForSelectedDate = tasks.filter((t) =>
    isSameDay(new Date(t.deadline), selectedDate)
  );

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleExportICS = () => {
    const activeTasks = tasks.filter((t) => t.status !== "done");
    if (activeTasks.length === 0) {
      toast.info("Tidak ada tugas aktif untuk diekspor ke kalender.");
      return;
    }
    downloadICSFile(activeTasks, "felys_tugas_kuliah.ics");
    toast.success("File .ics berhasil diunduh!", {
      description: "Buka file ini di Apple Calendar (iOS/Mac) atau Google Calendar untuk sinkronisasi otomatis.",
    });
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Sub-navigation tabs for iPhone and Desktop */}
      <AcademicNavTabs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            Kalender Deadline 📅
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Pantau jadwal pengumpulan tugas dan sinkronkan ke Google / Apple Calendar.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleExportICS}
            variant="secondary"
            size="sm"
            className="rounded-2xl text-xs"
            title="Ekspor file .ics untuk Apple Calendar, Google Calendar, dan Outlook"
          >
            <Download className="w-3.5 h-3.5 text-[#7C5CFA]" />
            <span>Ekspor ke Kalender HP</span>
          </Button>

          {/* Month Navigation */}
          <div className="flex items-center gap-2 bg-surface border border-border p-1.5 rounded-2xl shadow-soft">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-black/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2 text-foreground min-w-[120px] text-center capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: id })}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-black/5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-surface border border-border shadow-soft">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((dayName) => (
              <div key={dayName} className="text-xs font-bold text-muted py-1">
                {dayName}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const dayTasks = tasks.filter((t) => isSameDay(new Date(t.deadline), day));
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);
              const isCurrentMonthDay = isSameMonth(day, currentMonth);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "h-16 p-1.5 rounded-2xl border flex flex-col items-center justify-between transition-all select-none text-xs",
                    !isCurrentMonthDay && "opacity-40",
                    isSelected
                      ? "bg-[#EDE5FF] dark:bg-[#383442] border-[#7C5CFA] ring-2 ring-[#7C5CFA]"
                      : isCurrentDay
                      ? "bg-[#FAF9FC] dark:bg-[#2F2B3A] border-[#B69CFF]"
                      : "bg-surface border-border/60 hover:bg-black/5"
                  )}
                >
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center font-bold",
                      isCurrentDay
                        ? "bg-[#7C5CFA] text-white"
                        : isSelected
                        ? "text-[#7C5CFA] font-extrabold"
                        : "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Task Indicators */}
                  <div className="flex items-center gap-1 overflow-hidden max-w-full">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: t.courseColor || "#7C5CFA" }}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[9px] text-muted">+{dayTasks.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Tasks */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#7C5CFA]" />
              <span>
                Tugas pada {format(selectedDate, "d MMMM yyyy", { locale: id })}
              </span>
            </h3>
            <button
              onClick={handleCreateTask}
              className="text-xs font-bold text-[#7C5CFA] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {tasksForSelectedDate.length > 0 ? (
            <div className="space-y-3">
              {tasksForSelectedDate.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-surface border border-border text-center space-y-2">
              <p className="text-xs text-muted">
                Tidak ada deadline tugas pada tanggal ini 🎉
              </p>
            </div>
          )}
        </div>
      </div>

      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}
