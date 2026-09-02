"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowUp, Bot, User, Trash2, Zap, MessageSquareQuote } from "lucide-react";
import { useAIStore } from "@/stores/use-ai-store";
import { useDataStore } from "@/stores/use-data-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { triggerHaptic } from "@/lib/haptics";
import { playPop, playWhoosh } from "@/lib/sounds";
import { formatCurrencyIDR } from "@/lib/utils";
import { FormattedMessage } from "./FormattedMessage";

export function AIDrawer() {
  const { user } = useAuthStore();
  const {
    isDrawerOpen,
    closeDrawer,
    messages,
    addMessage,
    isLoading,
    setLoading,
    clearMessages,
    pendingPrompt,
    clearPendingPrompt,
  } = useAIStore();
  const { tasks, categories, getMonthlyBudgetSummary } = useDataStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isDrawerOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isDrawerOpen]);

  // Handle trigger from pendingPrompt (e.g. from InsightCard "Tanya Fio")
  useEffect(() => {
    if (isDrawerOpen && pendingPrompt) {
      const promptToSend = pendingPrompt;
      clearPendingPrompt();
      handleSendMessage(promptToSend);
    }
  }, [isDrawerOpen, pendingPrompt]);

  const quickPrompts = [
    "Tugas apa paling mendesak minggu ini?",
    "Sisa budget jajan kos berapa?",
    "Bantu bikin jadwal belajar hari ini",
    "Tips hemat makan anak kos",
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    triggerHaptic("medium");
    playPop();

    // 1. Add user message
    addMessage({
      role: "user",
      content: query.trim(),
    });
    setInput("");
    setLoading(true);

    try {
      // Gather context
      const activeTasks = tasks.filter((t) => t.status !== "done");
      const summary = getMonthlyBudgetSummary();

      let token = "";
      if (user) {
        try {
          token = await user.getIdToken();
        } catch {}
      }

      // Call streaming API
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: query }],
          context: {
            tasks: activeTasks.map((t) => ({
              title: t.title,
              course: t.courseName,
              deadline: t.deadline,
              urgencyScore: t.urgencyScore,
              priority: t.priority,
            })),
            budgetSummary: {
              totalLimit: summary.totalLimit,
              totalSpent: summary.totalSpent,
              remaining: summary.remaining,
              percentage: summary.overallPercentage,
            },
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Chat response failed");
      }

      const data = await res.json();
      addMessage({
        role: "assistant",
        content: data.reply || data.content || "Fio siap membantu kamu!",
      });
      triggerHaptic("success");
    } catch (error) {
      console.warn("AI Chat error, using smart local fallback:", error);
      const activeTasks = tasks.filter((t) => t.status !== "done");
      const summary = getMonthlyBudgetSummary();
      const fallbackResponse = generateLocalFioReply(query, activeTasks, summary);
      addMessage({
        role: "assistant",
        content: fallbackResponse,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateLocalFioReply = (
    query: string,
    activeTasks: typeof tasks,
    summary: ReturnType<typeof getMonthlyBudgetSummary>
  ) => {
    const lower = query.toLowerCase();

    if (lower.includes("tugas") || lower.includes("urgent") || lower.includes("mepet")) {
      const top = [...activeTasks].sort((a, b) => b.urgencyScore - a.urgencyScore)[0];
      if (top) {
        return `Tugas paling mendesak kamu saat ini adalah **${top.title}** (${top.courseName || "Kuliah"}) dengan skor urgensi **${Math.round(top.urgencyScore)}/100** 🔥.\n\nSaran Fio: Yuk cicil tugas ini sekarang selama 25 menit menggunakan Pomodoro timer!`;
      }
      return "Hore! Semua tugas kuliah kamu sudah beres atau belum ada tugas aktif. Istirahat sejenak ya! 🎉";
    }

    if (lower.includes("budget") || lower.includes("uang") || lower.includes("sisa") || lower.includes("saldo")) {
      return `Total sisa budget kamu bulan ini ada **${formatCurrencyIDR(summary.remaining)}** (terpakai ${summary.overallPercentage}%).\n\nKategori dengan pemakaian tertinggi adalah **${summary.categories.sort((a, b) => b.usedPercentage - a.usedPercentage)[0]?.categoryName || "Makan & Minum"}**.`;
    }

    if (lower.includes("nongkrong") || lower.includes("jajan") || lower.includes("kopi")) {
      const urgentCount = activeTasks.filter((t) => t.urgencyScore >= 80).length;
      if (urgentCount >= 2) {
        return `Hmm, minggu ini lagi ada **${urgentCount} deadline tugas yang cukup mepet** 👀.\n\nKalau mau ngopi, saran Fio cari tempat yang tenang buat sekalian ngerjain tugas, atau seduh kopi di kos agar hemat! ☕`;
      }
      return `Boleh banget! Tugas kamu masih aman terkendali. Selamat menikmati waktu luang, tapi tetap jaga pengeluaran ya! ✨`;
    }

    return `Hai! Aku Fio, asisten cerdasmu di Felys. Aku bisa bantu cek deadline tugas kuliah, pantau sisa jatah belanja, atau rekomendasi strategi belajar kamu hari ini. Ada yang mau ditanyakan? ✨`;
  };

  const handleClose = () => {
    triggerHaptic("light");
    playWhoosh();
    closeDrawer();
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Frosted Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-md transition-all"
          />

          {/* Minimalist Apple Intelligence Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[440px] bg-surface border-l border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header with Breathing AI Orb */}
            <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between bg-surface/90 backdrop-blur-lg">
              <div className="flex items-center gap-3">
                {/* Glowing AI Halo Avatar */}
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-[#7C5CFA]/30" />
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#7C5CFA] via-[#B69CFF] to-[#7FE3C0] flex items-center justify-center text-white shadow-soft relative z-10">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                      Fio Assistant
                    </h3>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7FE3C0] inline-block" />
                  </div>
                  <p className="text-[11px] text-muted">
                    Kecerdasan Kontekstual Mahasiswa
                  </p>
                </div>
              </div>

              {/* Minimal Action Buttons */}
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={() => {
                      triggerHaptic("warning");
                      clearMessages();
                    }}
                    className="p-2 rounded-xl text-muted hover:text-[#FF7A85] hover:bg-[#FFE8EA] transition-all"
                    title="Bersihkan percakapan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Conversation Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {messages.length === 0 ? (
                /* Empty State / Welcome Screen */
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-[#EDE5FF] to-[#E0FBF2] dark:from-[#2B2338] dark:to-[#1E2E28] flex items-center justify-center text-[#7C5CFA] shadow-soft">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h4 className="text-sm font-bold text-foreground">
                      Halo! Aku Fio ✨
                    </h4>
                    <p className="text-xs text-muted leading-relaxed">
                      Tanyakan apapun seputar tugas kuliah, jadwal kelas, atau cara hemat uang saku bulan ini.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2.5 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center text-white shrink-0 mt-1 shadow-xs">
                        <Sparkles className="w-3 h-3" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-3xl p-3.5 sm:p-4 text-xs leading-relaxed transition-all ${
                        msg.role === "user"
                          ? "bg-[#7C5CFA] text-white rounded-br-xs shadow-soft"
                          : "bg-[#FAF9FC] dark:bg-[#23211F] text-foreground rounded-bl-xs border border-border shadow-xs"
                      }`}
                    >
                      <FormattedMessage content={msg.content} isUser={msg.role === "user"} />
                    </div>
                  </motion.div>
                ))
              )}

              {/* Minimalist Typing Pulse */}
              {isLoading && (
                <div className="flex gap-2.5 items-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Sparkles className="w-3 h-3 animate-spin" />
                  </div>
                  <div className="bg-[#FAF9FC] dark:bg-[#23211F] border border-border rounded-2xl px-3.5 py-2.5 text-xs text-muted flex items-center gap-1 shadow-xs">
                    <span>Fio sedang merangkai solusi</span>
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips (Minimalist Pills) */}
            <div className="px-4 py-2.5 border-t border-border/50 overflow-x-auto flex gap-1.5 no-scrollbar bg-surface/50">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-[#FAF9FC] dark:bg-[#23211F] border border-border text-muted hover:text-[#7C5CFA] dark:hover:text-[#B69CFF] hover:border-[#7C5CFA]/40 text-[11px] font-medium transition-all active:scale-95 shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Minimalist Floating Input Bar */}
            <div className="p-3.5 sm:p-4 border-t border-border bg-surface">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 bg-[#FAF9FC] dark:bg-[#23211F] border border-border rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-[#7C5CFA]/30 focus-within:border-[#7C5CFA] transition-all shadow-xs"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik pertanyaan untuk Fio..."
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted focus:outline-none py-1.5"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    input.trim() && !isLoading
                      ? "bg-[#7C5CFA] text-white hover:bg-[#6A4BE8] shadow-sm active:scale-90"
                      : "bg-muted/20 text-muted cursor-not-allowed"
                  }`}
                  title="Kirim pesan"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
