"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { Course } from "@/types/academic";
import { cn } from "@/lib/utils";

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseToEdit?: Course | null;
}

const PASTEL_COLORS = [
  "#B69CFF", // Lavender Pop
  "#7C5CFA", // Deep Purple
  "#7FE3C0", // Mint Pop
  "#FF7A85", // Coral
  "#FFC978", // Peach
  "#8EC8FF", // Sky Blue
  "#FF9ECE", // Pink
  "#A7E399", // Lime
];

export function CourseModal({ isOpen, onClose, courseToEdit }: CourseModalProps) {
  const { addCourse, updateCourse, deleteCourse } = useDataStore();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PASTEL_COLORS[0]);
  const [sks, setSks] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (courseToEdit) {
      setName(courseToEdit.name);
      setColor(courseToEdit.color || PASTEL_COLORS[0]);
      setSks(courseToEdit.sks || 3);
    } else {
      setName("");
      setColor(PASTEL_COLORS[0]);
      setSks(3);
    }
  }, [courseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (courseToEdit) {
        await updateCourse(courseToEdit.id, {
          name: name.trim(),
          color,
          sks,
        });
      } else {
        await addCourse({
          name: name.trim(),
          color,
          sks,
        });
      }

      setName("");
      onClose();
    } catch (err) {
      console.error("Error saving course:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!courseToEdit || isSubmitting) return;
    if (confirm(`Hapus mata kuliah "${courseToEdit.name}" beserta semua tugas di dalamnya?`)) {
      setIsSubmitting(true);
      try {
        await deleteCourse(courseToEdit.id);
        onClose();
      } catch (err) {
        console.error("Error deleting course:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={courseToEdit ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}
        description="Mata kuliah akan digunakan untuk mengelompokkan tugas & mengatur prioritas."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Course Name */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Nama Mata Kuliah <span className="text-[#FF7A85]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Pemrograman Web Lanjut"
              className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
            />
          </div>

          {/* SKS */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Bobot SKS (Satuan Kredit Semester)
            </label>
            <select
              value={sks}
              onChange={(e) => setSks(Number(e.target.value))}
              className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
            >
              {[1, 2, 3, 4, 6].map((s) => (
                <option key={s} value={s}>
                  {s} SKS
                </option>
              ))}
            </select>
          </div>

          {/* Pastel Color Picker */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Warna Tagging Visual
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PASTEL_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-transform",
                    color === c ? "scale-115 ring-2 ring-offset-2 ring-[#7C5CFA]" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-2">
            {courseToEdit ? (
              <Button type="button" variant="ghost" size="sm" onClick={handleDelete} className="text-[#FF7A85] hover:bg-[#FFE8EA] hover:text-[#D93D4A]" disabled={isSubmitting}>
                Hapus
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" variant="academic" size="sm" disabled={isSubmitting || !name.trim()}>
                {isSubmitting
                  ? "Menyimpan..."
                  : courseToEdit
                  ? "Simpan Perubahan"
                  : "Simpan Mata Kuliah"}
              </Button>
            </div>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
