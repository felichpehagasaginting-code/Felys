"use client";

import React, { useState } from "react";
import { Plus, BookOpen, Trash2, CheckSquare, Sparkles } from "lucide-react";
import { useDataStore } from "@/stores/use-data-store";
import { CourseModal } from "@/components/academic/CourseModal";
import { Button } from "@/components/ui/Button";

export default function CoursesPage() {
  const { courses, tasks, deleteCourse } = useDataStore();
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            Mata Kuliah Semester Ini 📚
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Kelola daftar mata kuliah, warna tag, dan bobot SKS.
          </p>
        </div>

        <Button
          onClick={() => setIsCourseModalOpen(true)}
          variant="academic"
          size="md"
          className="rounded-2xl"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Mata Kuliah</span>
        </Button>
      </div>

      {/* Courses Grid or Empty State */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const courseTasks = tasks.filter((t) => t.courseId === course.id);
            const activeTasksCount = courseTasks.filter((t) => t.status !== "done").length;
            const completedTasksCount = courseTasks.filter((t) => t.status === "done").length;

            return (
              <div
                key={course.id}
                className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-4 relative overflow-hidden"
              >
                {/* Top color bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-2"
                  style={{ backgroundColor: course.color }}
                />

                <div className="flex items-start justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-xs"
                      style={{ backgroundColor: course.color }}
                    >
                      {course.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground leading-tight">
                        {course.name}
                      </h3>
                      <span className="text-xs text-muted font-medium">
                        {course.sks || 3} SKS
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteCourse(course.id)}
                    className="p-1.5 rounded-xl text-muted hover:text-[#FF7A85] hover:bg-black/5 transition-colors"
                    title="Hapus mata kuliah"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Task Count Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#2F2B3A] text-center">
                    <span className="text-muted block text-[10px] uppercase font-bold">Aktif</span>
                    <span className="text-sm font-extrabold text-[#7C5CFA]">
                      {activeTasksCount} Tugas
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#2F2B3A] text-center">
                    <span className="text-muted block text-[10px] uppercase font-bold">Selesai</span>
                    <span className="text-sm font-extrabold text-[#1F8766]">
                      {completedTasksCount} Tugas
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-surface border border-border text-center space-y-3 shadow-soft max-w-lg mx-auto mt-8">
          <div className="w-14 h-14 rounded-2xl bg-[#EDE5FF] text-[#7C5CFA] flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">Belum Ada Mata Kuliah</h3>
          <p className="text-xs text-muted leading-relaxed">
            Tambahkan mata kuliah semester ini agar tugas dan deadlinemu terorganisir dengan tag warna rapi.
          </p>
          <Button
            onClick={() => setIsCourseModalOpen(true)}
            variant="academic"
            size="md"
            className="rounded-2xl mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Mata Kuliah Pertama</span>
          </Button>
        </div>
      )}

      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
      />
    </div>
  );
}
