"use client";

import React, { useState } from "react";
import { Plus, Search, Filter, BookOpen, CheckCircle2, ListFilter } from "lucide-react";
import { useDataStore } from "@/stores/use-data-store";
import { TaskCard } from "@/components/academic/TaskCard";
import { TaskFormModal } from "@/components/academic/TaskFormModal";
import { CourseModal } from "@/components/academic/CourseModal";
import { AcademicNavTabs } from "@/components/academic/AcademicNavTabs";
import { NLPQuickBar } from "@/components/shared/NLPQuickBar";
import { Button } from "@/components/ui/Button";
import { Task } from "@/types/academic";
import { isToday, isThisWeek, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

export default function AcademicTasksPage() {
  const { tasks, courses } = useDataStore();

  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "today" | "week" | "later" | "done">("all");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const now = new Date();

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Search query
    if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // Course filter
    if (selectedCourseId !== "all" && t.courseId !== selectedCourseId) {
      return false;
    }

    // Tab filter
    if (activeTab === "done") {
      return t.status === "done";
    }

    if (t.status === "done" && activeTab !== "all") {
      return false;
    }

    const deadline = new Date(t.deadline);
    if (activeTab === "today") {
      return isToday(deadline) || deadline < now;
    }
    if (activeTab === "week") {
      return isThisWeek(deadline, { weekStartsOn: 1 });
    }
    if (activeTab === "later") {
      return differenceInDays(deadline, now) > 7;
    }

    return true;
  });

  // Sort by urgencyScore desc (tasks still pending), then done
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    return b.urgencyScore - a.urgencyScore;
  });

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNewTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Sub-navigation tabs for iPhone and Desktop */}
      <AcademicNavTabs />

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            Manajemen Tugas Kuliah 🎓
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5 sm:mt-1">
            Urutan tugas otomatis diprioritaskan oleh AI berdasarkan deadline dan tingkat urgensi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsCourseModalOpen(true)}
            variant="secondary"
            size="sm"
            className="rounded-2xl text-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Mata Kuliah</span>
          </Button>

          <Button
            onClick={handleOpenNewTask}
            variant="academic"
            size="sm"
            className="rounded-2xl text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tugas Baru</span>
          </Button>
        </div>
      </div>

      {/* Smart NLP Quick Input Bar */}
      <NLPQuickBar />

      {/* 2. Controls: Search, Tabs, & Course Filter */}
      <div className="space-y-3">
        {/* Search Bar & Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#EDEAF2] dark:bg-[#383442] rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "Semua Tugas" },
              { id: "today", label: "Hari Ini" },
              { id: "week", label: "Minggu Ini" },
              { id: "later", label: "Nanti" },
              { id: "done", label: "Selesai" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap select-none",
                  activeTab === tab.id
                    ? "bg-[#7C5CFA] text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tugas kuliah..."
              className="w-full bg-surface border border-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
            />
          </div>
        </div>

        {/* Course Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs text-muted font-semibold flex items-center gap-1 shrink-0">
            <ListFilter className="w-3.5 h-3.5" />
            <span>Mata Kuliah:</span>
          </span>

          <button
            onClick={() => setSelectedCourseId("all")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all select-none border",
              selectedCourseId === "all"
                ? "bg-[#EDE5FF] text-[#7C5CFA] border-[#7C5CFA]/50"
                : "bg-surface border-border text-muted hover:text-foreground"
            )}
          >
            Semua ({tasks.length})
          </button>

          {courses.map((c) => {
            const count = tasks.filter((t) => t.courseId === c.id).length;
            const isSelected = selectedCourseId === c.id;

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all select-none border",
                  isSelected
                    ? "bg-[#EDE5FF] text-[#7C5CFA] border-[#7C5CFA]/50"
                    : "bg-surface border-border text-muted hover:text-foreground"
                )}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span>{c.name}</span>
                <span className="text-[10px] text-muted">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tasks List */}
      {sortedTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-3xl bg-surface border border-border p-6 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#EDE5FF] text-[#7C5CFA] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">Tidak Ada Tugas Ditemukan</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {search
              ? "Coba gunakan kata kunci pencarian yang lain."
              : "Semua tugas di filter ini sudah beres atau belum dibuat."}
          </p>
          <Button onClick={handleOpenNewTask} variant="academic" size="sm">
            + Tambah Tugas Baru
          </Button>
        </div>
      )}

      {/* Modals */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
      />
      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
      />
    </div>
  );
}
