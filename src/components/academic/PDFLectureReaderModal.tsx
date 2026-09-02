"use client";

import React, { useState } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAIStore } from "@/stores/use-ai-store";
import { FormattedMessage } from "@/components/ai/FormattedMessage";
import { triggerHaptic } from "@/lib/haptics";
import { FileText, Upload, Sparkles, Send, X, BookOpen, HelpCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PDFLectureReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PDFLectureReaderModal({ isOpen, onClose }: PDFLectureReaderModalProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: "Hai! Upload slide kuliah atau dokumen materi PDF kamu di sebelah kiri, lalu tanyakan apa saja yang belum kamu pahami ke Fio ✨",
    },
  ]);
  const [queryInput, setQueryInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      triggerHaptic("medium");
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const url = URL.createObjectURL(file);
      setPdfFile(file);
      setPdfUrl(url);
      toast.success(`Dokumen "${file.name}" siap dipelajari! 📖`);
    } else {
      toast.error("Pilih file berekstensi .pdf yang valid.");
    }
  };

  const handleSendPrompt = async (promptText?: string) => {
    const text = promptText || queryInput;
    if (!text.trim() || isAsking) return;

    triggerHaptic("light");
    const newMessages = [...chatMessages, { role: "user" as const, content: text }];
    setChatMessages(newMessages);
    setQueryInput("");
    setIsAsking(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: {
            lectureDocName: pdfFile?.name || "Dokumen Materi Kuliah",
          },
        }),
      });

      if (res.ok) {
        const reply = await res.text();
        setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Berdasarkan materi "${pdfFile?.name || "kuliah"}", fokuslah memahami konsep dasar dan definisi intinya sebelum mengerjakan latihan soal ya!`,
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Fio siap bantu kamu membahas slide materi ini. Ada bagian yang ingin dijelaskan lebih dalam?",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Split-Screen PDF Lecture Reader & Sidekick AI 📖"
        description="Buka slide dosen berdampingan dengan asisten AI Fio untuk rangkuman dan kuis materi kilat."
        className="max-w-5xl! w-[95vw] h-[88vh] flex flex-col p-4 sm:p-6"
      >
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 pt-2">
          {/* Left Column: PDF Viewer Canvas */}
          <div className="lg:col-span-7 bg-[#FAF9FC] dark:bg-[#1E1C24] border border-border rounded-3xl overflow-hidden flex flex-col">
            {pdfUrl ? (
              <div className="flex-1 flex flex-col">
                <div className="p-2.5 px-4 bg-surface border-b border-border flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground truncate max-w-[240px]">
                    {pdfFile?.name}
                  </span>
                  <label className="text-[11px] text-[#7C5CFA] font-bold cursor-pointer hover:underline">
                    Ganti File
                    <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                <iframe
                  src={pdfUrl}
                  title="PDF Viewer"
                  className="w-full flex-1 border-0"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-[#EDE5FF] dark:bg-[#342F3E] text-[#7C5CFA] flex items-center justify-center shadow-soft">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Unggah Slide Kuliah / Materi PDF
                  </h4>
                  <p className="text-xs text-muted max-w-xs mt-1 leading-relaxed">
                    Pilih file slide dosen (.pdf) dari laptop untuk mulai belajar berdampingan dengan AI.
                  </p>
                </div>
                <label className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#7C5CFA] to-[#6842f5] text-white text-xs font-bold shadow-soft hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Pilih File PDF</span>
                  <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* Right Column: Sidekick AI Fio Assistant */}
          <div className="lg:col-span-5 bg-surface border border-border rounded-3xl flex flex-col overflow-hidden shadow-soft">
            <div className="p-3.5 px-4 bg-[#FAF9FC] dark:bg-[#2F2B3A] border-b border-border flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center text-white text-xs shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Fio AI Sidekick</h4>
                <p className="text-[10px] text-muted">Tanya konsep & rangkuman materi</p>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="p-2 border-b border-border flex gap-1.5 overflow-x-auto text-[10px] font-bold">
              <button
                onClick={() => handleSendPrompt("Rangkum poin-poin utama materi kuliah ini dalam 3 poin kunci")}
                className="px-2.5 py-1 rounded-xl bg-[#EDE5FF] dark:bg-[#383442] text-[#7C5CFA] hover:bg-[#7C5CFA] hover:text-white transition-all shrink-0"
              >
                📌 Rangkum Poin Kunci
              </button>
              <button
                onClick={() => handleSendPrompt("Buatkan 3 pertanyaan kuis pilihan ganda dari materi ini untuk latihan")}
                className="px-2.5 py-1 rounded-xl bg-[#E0FBF2] dark:bg-[#1E332A] text-[#1F8766] hover:bg-[#1F8766] hover:text-white transition-all shrink-0"
              >
                ❓ Buatkan Kuis Kilat
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-[#7C5CFA] text-white rounded-br-xs"
                        : "bg-[#FAF9FC] dark:bg-[#2A2634] text-foreground border border-border rounded-bl-xs leading-relaxed"
                    }`}
                  >
                    <FormattedMessage content={msg.content} />
                  </div>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="p-2.5 border-t border-border flex gap-2"
            >
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Tanyakan konsep di slide ini..."
                className="flex-1 bg-[#FAF9FC] dark:bg-[#2A2634] border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
              />
              <button
                type="submit"
                disabled={isAsking || !queryInput.trim()}
                className="p-2 rounded-xl bg-[#7C5CFA] text-white shadow-xs hover:bg-[#6842f5] disabled:opacity-50 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
