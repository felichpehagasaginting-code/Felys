"use client";

import React, { useState } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Task } from "@/types/academic";
import { formatDateIndonesian, formatTimeIndonesian } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import { Share2, Copy, MessageCircle, Check, QrCode, BookOpen, Clock, ListChecks } from "lucide-react";

interface ShareTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareTaskModal({ task, isOpen, onClose }: ShareTaskModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !task) return null;

  const deadlineDate = new Date(task.deadline);
  const formattedDate = formatDateIndonesian(task.deadline);
  const formattedTime = formatTimeIndonesian(task.deadline);

  const subtasksText = task.subtasks && task.subtasks.length > 0
    ? task.subtasks
        .map((st, i) => `${i + 1}. [${st.isDone ? "✓" : " "}] ${st.title}`)
        .join("\n")
    : "• Belum ada rincian subtask khusus";

  const shareMessage = `📢 *TUGAS KELOMPOK / KULIAH: ${task.title}*
📚 *Mata Kuliah:* ${task.courseName || "Kuliah"}
⏰ *Deadline:* ${formattedDate} pukul ${formattedTime}
🔥 *Prioritas:* ${task.priority.toUpperCase()}

📋 *CHECKLIST PENGERJAAN:*
${subtasksText}

${task.description ? `💡 *Catatan:* ${task.description}\n` : ""}
✨ _Dikelola bersama di Felys — Student Super-App_`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      triggerHaptic("success");
      toast.success("Teks tugas berhasil disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Gagal menyalin teks");
    }
  };

  const handleShareWhatsApp = () => {
    triggerHaptic("medium");
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  // Generate QR Code URL using free reliable QR Server API with custom styling
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    shareMessage
  )}&color=7C5CFA&bgcolor=FFFFFF&margin=10`;

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Bagi Tugas Kelompok & Jadwal 👥"
        description="Bagikan checklist subtask dan deadline tugas ke teman sekelompok via WhatsApp atau QR Code."
      >
        <div className="space-y-4 pt-2">
          {/* Visual Task Card Preview */}
          <div className="p-4 rounded-3xl bg-[#FAF9FC] dark:bg-[#2A2634] border border-border space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5"
                  style={{
                    backgroundColor: `${task.courseColor || "#B69CFF"}25`,
                    color: task.courseColor || "#7C5CFA",
                  }}
                >
                  {task.courseName || "Mata Kuliah"}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-foreground leading-snug">
                  {task.title}
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDE5FF] text-[#7C5CFA] shrink-0">
                {task.priority.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted">
              <Clock className="w-3.5 h-3.5 text-[#FF7A85]" />
              <span>
                Deadline: <b>{formattedDate}</b>, {formattedTime}
              </span>
            </div>

            {/* Subtasks summary */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="p-2.5 rounded-2xl bg-surface border border-border/80 text-xs space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                  Checklist Langkah ({task.subtasks.length}):
                </span>
                <div className="space-y-0.5 max-h-24 overflow-y-auto">
                  {task.subtasks.map((st, i) => (
                    <div key={st.id} className="flex items-center gap-1.5 text-muted">
                      <span className={st.isDone ? "text-[#1F8766] font-bold" : ""}>
                        {st.isDone ? "✓" : "○"}
                      </span>
                      <span className={st.isDone ? "line-through" : "text-foreground"}>
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-3xl bg-[#EDE5FF]/30 dark:bg-[#383442]/40 border border-[#B69CFF]/30">
            <div className="w-28 h-28 bg-white p-2 rounded-2xl border border-border shadow-soft flex items-center justify-center shrink-0">
              <img
                src={qrDataUrl}
                alt="QR Code Tugas Kelompok"
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-xs font-bold text-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <QrCode className="w-4 h-4 text-[#7C5CFA]" />
                <span>Scan QR Code Tugas</span>
              </h4>
              <p className="text-[11px] text-muted leading-relaxed">
                Teman sekelompok bisa scan QR ini dengan kamera HP mereka untuk langsung membaca ringkasan tugas & deadline lengkap.
              </p>
            </div>
          </div>

          {/* Action Share Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleCopyText}
              className="rounded-2xl flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#1F8766]" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-muted" />
                  <span>Salin Ringkasan</span>
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-2.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-soft flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Bagi ke WhatsApp Grup</span>
            </button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
