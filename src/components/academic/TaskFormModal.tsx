"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { PriorityLevel, Task, SubTask } from "@/types/academic";
import { Sparkles, Plus, Trash2, CheckCircle2, ListChecks, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";

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
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiBreakingDown, setIsAiBreakingDown] = useState(false);

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
      setSubtasks(taskToEdit.subtasks || []);
    } else {
      // Default new task values
      setTitle("");
      setCourseId(courses.length > 0 ? courses[0].id : "general");
      const defaultDate = new Date(Date.now() + 1000 * 60 * 60 * 48); // 2 hari lagi
      setDeadline(defaultDate.toISOString().slice(0, 16));
      setPriority("medium");
      setEstimatedHours(2);
      setDescription("");
      setSubtasks([]);
    }
  }, [taskToEdit, isOpen, courses.length]);

  if (!isOpen) return null;

  const handleAiBreakdown = async () => {
    if (!title.trim()) {
      toast.error("Tuliskan nama tugas terlebih dahulu ya!");
      return;
    }

    try {
      setIsAiBreakingDown(true);
      triggerHaptic("medium");

      const selectedCourse = courses.find((c) => c.id === courseId);
      const res = await fetch("/api/ai/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: title.trim(),
          courseName: selectedCourse?.name || "Umum",
          deadline,
          estimatedHours,
        }),
      });

      if (!res.ok) throw new Error("Gagal generate subtask");

      const data = await res.json();
      if (data.subtasks && Array.isArray(data.subtasks)) {
        const newItems: SubTask[] = data.subtasks.map((st: any, idx: number) => ({
          id: `sub_${Date.now()}_${idx}`,
          taskId: taskToEdit?.id || "temp",
          title: st.title || `Langkah ${idx + 1}`,
          isDone: false,
          order: idx,
        }));

        setSubtasks((prev) => [...prev, ...newItems]);
        triggerHaptic("success");
        toast.success(`Berhasil membuat ${newItems.length} subtask dengan Fio AI! ✨`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memecah subtask AI. Silakan tambahkan manual.");
    } finally {
      setIsAiBreakingDown(false);
    }
  };

  const handleAddManualSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newItem: SubTask = {
      id: `sub_${Date.now()}`,
      taskId: taskToEdit?.id || "temp",
      title: newSubtaskTitle.trim(),
      isDone: false,
      order: subtasks.length,
    };
    setSubtasks([...subtasks, newItem]);
    setNewSubtaskTitle("");
    triggerHaptic("light");
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== subtaskId));
    triggerHaptic("light");
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setSubtasks(
      subtasks.map((s) =>
        s.id === subtaskId ? { ...s, isDone: !s.isDone } : s
      )
    );
    triggerHaptic("light");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCourseId = courseId || (courses.length > 0 ? courses[0].id : "general");
    if (!title.trim() || !deadline || isSubmitting) return;

    try {
      setIsSubmitting(true);
      triggerHaptic("medium");

      const taskPayload = {
        title: title.trim(),
        courseId: finalCourseId,
        deadline: new Date(deadline).toISOString(),
        priority,
        estimatedHours: estimatedHours || 2,
        description: description.trim() || null,
        subtasks,
      };

      if (taskToEdit) {
        await updateTask(taskToEdit.id, taskPayload);
      } else {
        await addTask({
          ...taskPayload,
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
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto px-0.5">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-foreground">
                Nama Tugas <span className="text-[#FF7A85]">*</span>
              </label>
              <button
                type="button"
                onClick={handleAiBreakdown}
                disabled={isAiBreakingDown || !title.trim()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#EDE5FF] to-[#E0FBF2] dark:from-[#383442] dark:to-[#26232E] border border-[#B69CFF]/40 text-[#7C5CFA] dark:text-[#B69CFF] text-[11px] font-bold hover:shadow-soft hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                title="Pecah tugas besar jadi langkah-langkah terstruktur dengan AI"
              >
                {isAiBreakingDown ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-[#7C5CFA]" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-[#7C5CFA]" />
                    <span>✨ Pecah Subtask AI</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Makalah Grafika Komputer / Laporan Praktikum"
              className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
            />
          </div>

          {/* Subtasks Section */}
          <div className="p-3.5 rounded-2xl bg-[#F8F7FA] dark:bg-[#2A2634] border border-border/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5 text-[#7C5CFA]" />
                <span>Checklist Subtask ({subtasks.length})</span>
              </span>
              {subtasks.length > 0 && (
                <span className="text-[10px] font-bold text-[#1F8766]">
                  {subtasks.filter((s) => s.isDone).length}/{subtasks.length} Selesai
                </span>
              )}
            </div>

            {/* Subtasks List */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {subtasks.map((st, idx) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface border border-border text-xs group"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(st.id)}
                      className="flex items-center gap-2 text-left min-w-0 flex-1"
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all",
                          st.isDone
                            ? "bg-[#7FE3C0] border-[#7FE3C0] text-white"
                            : "border-border hover:border-[#7C5CFA]"
                        )}
                      >
                        {st.isDone && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <span
                        className={cn(
                          "text-xs truncate",
                          st.isDone
                            ? "line-through text-muted"
                            : "text-foreground font-medium"
                        )}
                      >
                        {idx + 1}. {st.title}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="opacity-60 group-hover:opacity-100 p-1 text-muted hover:text-[#FF7A85] transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Manual Subtask Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddManualSubtask();
                  }
                }}
                placeholder="Tambah langkah manual..."
                className="flex-1 bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
              />
              <button
                type="button"
                onClick={handleAddManualSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-1.5 rounded-xl bg-[#EDE5FF] dark:bg-[#383442] text-[#7C5CFA] dark:text-[#B69CFF] text-xs font-bold hover:bg-[#7C5CFA] hover:text-white transition-all disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
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
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
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
