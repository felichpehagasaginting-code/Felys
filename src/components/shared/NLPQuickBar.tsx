"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, ArrowRight, Check, Calendar, Wallet, Clock, Tag } from "lucide-react";
import { useDataStore } from "@/stores/use-data-store";
import { parseStudentNLP, ParsedNLPResult } from "@/lib/nlp-parser";
import { formatCurrencyIDR, formatDateRelative } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";

export function NLPQuickBar() {
  const { categories, courses, addTask, addTransaction } = useDataStore();
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live parsed result preview
  const parsed = useMemo<ParsedNLPResult | null>(() => {
    if (!query.trim() || query.length < 3) return null;
    return parseStudentNLP(query, categories, courses);
  }, [query, categories, courses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      triggerHaptic("success");

      if (parsed.type === "task" && parsed.taskData) {
        const course = courses.find((c) => c.name.toLowerCase() === parsed.taskData?.courseName?.toLowerCase());
        await addTask({
          title: parsed.taskData.title,
          courseId: course?.id || "general",
          courseName: parsed.taskData.courseName || "Kuliah Umum",
          deadline: parsed.taskData.deadline,
          priority: parsed.taskData.priority,
          estimatedHours: parsed.taskData.estimatedHours,
          status: "todo",
        });

        toast.success(`Tugas "${parsed.taskData.title}" berhasil dijadwalkan! 📚`, {
          description: `Deadline: ${formatDateRelative(parsed.taskData.deadline)} • Estimasi ${parsed.taskData.estimatedHours} jam`,
        });
      } else if (parsed.type === "transaction" && parsed.transactionData) {
        const cat = categories.find((c) => c.name.toLowerCase() === parsed.transactionData?.categoryName?.toLowerCase());
        await addTransaction({
          type: parsed.transactionData.type,
          amount: parsed.transactionData.amount,
          categoryId: cat?.id || "cat_general",
          categoryName: parsed.transactionData.categoryName || "Umum",
          note: parsed.transactionData.note,
          date: parsed.transactionData.date,
        });

        toast.success(`Transaksi ${formatCurrencyIDR(parsed.transactionData.amount)} dicatat! 💸`, {
          description: `${parsed.transactionData.categoryName} • ${parsed.transactionData.type === "expense" ? "Pengeluaran" : "Pemasukan"}`,
        });
      }

      setQuery("");
    } catch (err: any) {
      toast.error("Gagal menambahkan data secara otomatis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full relative group">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full rounded-2xl bg-surface border border-border/80 shadow-soft focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all overflow-hidden"
      >
        <div className="pl-3.5 pr-2 text-accent">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ketik tugas atau pengeluaran kilat... (contoh: 'Makan siang geprek 18rb' atau 'Makalah AI jumat jam 23:59')"
          className="flex-1 py-3 px-1 text-xs sm:text-sm bg-transparent text-foreground placeholder:text-muted focus:outline-none"
        />

        {query.trim() && (
          <button
            type="submit"
            disabled={!parsed || isSubmitting}
            className="mr-2 p-1.5 rounded-xl bg-accent text-white hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all shrink-0 flex items-center gap-1 text-xs font-bold px-3"
          >
            <span>{isSubmitting ? "Menyimpan..." : "Enter"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Live Preview Floating Chip */}
      {parsed && query.trim().length >= 3 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-20 p-2.5 rounded-2xl bg-surface/95 backdrop-blur-md border border-border shadow-card flex items-center justify-between gap-2 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {parsed.type === "task" && parsed.taskData ? (
              <>
                <span className="px-2 py-0.5 rounded-full bg-[#EDE5FF] text-[#7C5CFA] font-bold text-[10px] flex items-center gap-1">
                  📚 Tambah Tugas
                </span>
                <span className="font-semibold text-foreground truncate">
                  {parsed.taskData.title}
                </span>
                <span className="text-muted flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateRelative(parsed.taskData.deadline)}
                </span>
                <span className="text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {parsed.taskData.estimatedHours} jam
                </span>
              </>
            ) : parsed.type === "transaction" && parsed.transactionData ? (
              <>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 ${
                    parsed.transactionData.type === "expense"
                      ? "bg-[#FFE8EA] text-[#D93D4A]"
                      : "bg-[#E0FBF2] text-[#1F8766]"
                  }`}
                >
                  {parsed.transactionData.type === "expense" ? "💸 Pengeluaran" : "💰 Pemasukan"}
                </span>
                <span className="font-extrabold text-foreground">
                  {formatCurrencyIDR(parsed.transactionData.amount)}
                </span>
                <span className="text-muted flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {parsed.transactionData.categoryName}
                </span>
              </>
            ) : null}
          </div>

          <span className="text-[10px] text-muted font-semibold shrink-0 hidden sm:inline">
            Tekan ↵ Enter untuk simpan
          </span>
        </div>
      )}
    </div>
  );
}
