"use client";

import React, { useState, useEffect, useRef } from "react";
import { StickyNote, X, Trash2, Check, Sparkles, Copy, Plus, BookOpen, Wallet } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export function ScratchpadPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isSaved, setIsSaved] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("felys_scratchpad_content");
    if (saved) {
      setContent(saved);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setIsSaved(false);

    // Debounced Auto-save (500ms delay for battery/CPU efficiency)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem("felys_scratchpad_content", val);
      setIsSaved(true);
    }, 500);
  };

  const handleClear = () => {
    triggerHaptic("light");
    setContent("");
    localStorage.removeItem("felys_scratchpad_content");
    setIsSaved(true);
    toast.success("Catatan coretan dibersihkan.");
  };

  const handleCopy = () => {
    triggerHaptic("light");
    if (!content.trim()) return;
    navigator.clipboard.writeText(content);
    toast.success("Catatan disalin ke clipboard! 📋");
  };

  return (
    <>
      {/* Floating Trigger Button in bottom right */}
      <button
        onClick={() => {
          triggerHaptic("light");
          setIsOpen(!isOpen);
        }}
        className="fixed bottom-36 lg:bottom-5 right-5 z-40 p-3 rounded-full bg-white dark:bg-[#26232E] border border-border text-[#7C5CFA] shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 ring-1 ring-black/10 group"
        title="Buka Papan Coret-Coret Kuliah (Sticky Notes)"
        aria-label="Buka papan catatan cepat"
      >
        <StickyNote className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
        {content.trim() && (
          <span className="w-2.5 h-2.5 rounded-full bg-[#7FE3C0] border-2 border-surface absolute top-0.5 right-0.5" />
        )}
      </button>

      {/* Floating Scratchpad Panel */}
      {isOpen && (
        <aside aria-label="Papan Catatan Cepat" className="fixed bottom-[12.5rem] lg:bottom-18 right-5 z-50 w-[90vw] sm:w-88 max-h-[70vh] bg-white dark:bg-[#26232E] border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-black/10 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-3.5 px-4 bg-[#FAF9FC] dark:bg-[#2F2B3A] border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-[#F59E0B]" />
              <h4 className="text-xs font-bold text-foreground">
                Papan Coret-Coret Kuliah
              </h4>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted font-medium">
                {isSaved ? "Tersimpan ✓" : "Menyimpan..."}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                title="Salin Catatan"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClear}
                className="p-1 rounded-lg text-muted hover:text-[#FF7A85] hover:bg-[#FFE8EA] transition-all"
                title="Hapus Semua"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Note Area */}
          <div className="p-3 flex-1 flex flex-col">
            <textarea
              value={content}
              onChange={handleChange}
              placeholder="Tulis cepat catatan dosen, link Google Drive kelompok, rumus dadakan, atau no rek bendahara..."
              className="w-full flex-1 min-h-[160px] bg-transparent text-xs text-foreground placeholder:text-muted focus:outline-none resize-none leading-relaxed font-sans"
            />
          </div>

          {/* Quick Footer Info */}
          <div className="p-2.5 px-4 bg-[#FAF9FC] dark:bg-[#2F2B3A] border-t border-border flex items-center justify-between text-[10px] text-muted">
            <span>Auto-save instan lokal</span>
            <span>{content.length} karakter</span>
          </div>
        </aside>
      )}
    </>
  );
}
