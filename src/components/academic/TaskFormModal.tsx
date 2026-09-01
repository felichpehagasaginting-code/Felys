"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { PriorityLevel, Task } from "@/types/academic";
import { cn } from "@/lib/utils";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

export function TaskFormModal({ isOpen, onClose, taskToEdit }: TaskFormModalProps) {
  const { courses, addTask, updateTask } = useDataStore();

  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>(2);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setCourseId(taskToEdit.courseId);
      setDeadline(
        taskToEdit.deadline
          ? new Date(taskToEdit.deadline).toISOString().slice(0, 16)
          : ""
      );
      setPriority(taskToEdit.priority);
      setEstimatedHours(taskToEdit.estimatedHours || 2);
      setDescription(taskToEdit.description || "");
    } else {
      // Default new task values
      setTitle("");
      setCourseId(courses.length > 0 ? courses[0].id : "general");
      const defaultDate = new Date(Date.now() + 1000 * 60 * 60 * 48); // 2 hari lagi
      setDeadline(defaultDate.toISOString().slice(0, 16));
      setPriority("medium");
      setEstimatedHours(2);
      setDescription("");
    }
  }, [taskToEdit, isOpen, courses.length]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCourseId = courseId || (courses.length > 0 ? courses[0].id : "general");
    if (!title.trim() || !deadline || isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (taskToEdit) {
        await updateTask(taskToEdit.id, {
          title: title.trim(),
          courseId: finalCourseId,
          deadline: new Date(deadline).toISOString(),
          priority,
          estimatedHours: estimatedHours || 2,
          description: description.trim() || null,
        });
      } else {
        await addTask({
          title: title.trim(),
          courseId: finalCourseId,
          deadline: new Date(deadline).toISOString(),
          priority,
          estimatedHours: estimatedHours || 2,
          description: description.trim() || null,
          status: "todo",
        });
      }
      onClose();
    } catch (err) {
      console.error("Error saving task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={taskToEdit ? "Edit Tugas Kuliah" : "Tambah Tugas Kuliah"}
        description="Felys akan otomatis menghitung urgensi tugas berdasarkan deadline & beban waktu."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Nama Tugas <span className="text-[#FF7A85]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Makalah Grafika Komputer"
              className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
            />
          </div>

          {/* Course Selector */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Mata Kuliah <span className="text-[#FF7A85]">*</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
            >
              {courses.length > 0 ? (
                courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.sks || 3} SKS)
                  </option>
                ))
              ) : (
                <option value="general">Kuliah Umum / Mandiri</option>
              )}
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Deadline <span className="text-[#FF7A85]">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
            />
          </div>

          {/* Priority (3 visual options) */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Tingkat Prioritas
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "low", label: "Rendah", color: "bg-[#E5FAF2] text-[#1F8766] border-[#9EE9D0]" },
                  { id: "medium", label: "Sedang", color: "bg-[#FFF4E5] text-[#B86B14] border-[#FFD59E]" },
                  { id: "high", label: "Tinggi", color: "bg-[#FFE8EA] text-[#D93D4A] border-[#FFA8B0]" },
                ] as const
              ).map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={cn(
                    "py-2 rounded-xl text-xs font-bold border transition-all text-center",
                    priority === p.id
                      ? `${p.color} ring-2 ring-offset-1 ring-accent font-extrabold shadow-sm`
                      : "bg-[#FAF9FC] dark:bg-[#2F2B3A] border-border text-muted hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Hours */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-foreground">
                Estimasi Waktu Pengerjaan
              </label>
              <span className="text-xs font-bold text-[#7C5CFA]">{estimatedHours} Jam</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={estimatedHours || 2}
              onChange={(e) => setEstimatedHours(Number(e.target.value))}
              className="w-full accent-[#7C5CFA]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tambahkan detail soal, link drive, atau referensi..."
              className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" variant="academic" size="sm" disabled={isSubmitting || !title.trim() || !deadline}>
              {isSubmitting
                ? "Menyimpan..."
                : taskToEdit
                ? "Simpan Perubahan"
                : "Tambah Tugas"}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
