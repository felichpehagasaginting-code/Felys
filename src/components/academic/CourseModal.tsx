"use client";

import React, { useState } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { cn } from "@/lib/utils";

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export function CourseModal({ isOpen, onClose }: CourseModalProps) {
  const { addCourse } = useDataStore();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PASTEL_COLORS[0]);
  const [sks, setSks] = useState<number>(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCourse({
      name: name.trim(),
      color,
      sks,
    });

    setName("");
    onClose();
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Tambah Mata Kuliah"
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
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="academic" size="sm">
              Simpan Mata Kuliah
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
