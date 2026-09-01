"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Bot, User, Trash2 } from "lucide-react";
import { useAIStore } from "@/stores/use-ai-store";
import { useDataStore } from "@/stores/use-data-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/Button";
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isDrawerOpen) {
      scrollToBottom();
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
    "Tugas apa yang paling urgent minggu ini?",
    "Sisa budget jajan & hiburan berapa?",
    "Boleh ga aku nongkrong malam ini?",
    "Bantu bagi waktu ngerjain tugas",
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    // 1. Add user message
    addMessage({
      role: "user",
      content: query,
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
              categories: summary.categories.map((c) => ({
                name: c.categoryName,
                limit: c.monthlyLimit,
                spent: c.spentAmount,
                remaining: c.remainingAmount,
                usedPercentage: c.usedPercentage,
                status: c.status,
              })),
            },
          },
        }),
      });

      if (res.ok) {
        const text = await res.text();
        addMessage({
          role: "assistant",
          content: text || "Aku siap bantu kamu atur waktu dan budget kuliah!",
        });
      } else {
        // Fallback intelligent heuristic reply if API key is not configured locally
        const fallbackResponse = generateLocalFioReply(query, activeTasks, summary);
        addMessage({
          role: "assistant",
          content: fallbackResponse,
        });
      }
    } catch {
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
        return `Tugas paling mendesak kamu sekarang adalah **${top.title}** (${top.courseName || "Kuliah"}) dengan skor urgensi **${Math.round(top.urgencyScore)}/100** 🔥. Saran Fio, cicil tugas ini dulu ya sebelum yang lain!`;
      }
      return "Hore! Semua tugas kamu udah selesai atau belum ada tugas aktif nih 🎉";
    }

    if (lower.includes("budget") || lower.includes("uang") || lower.includes("sisa")) {
      return `Total sisa budget kamu bulan ini ada **${formatCurrencyIDR(summary.remaining)}** (terpakai ${summary.overallPercentage}%). Kategori dengan pemakaian tertinggi saat ini adalah ${summary.categories.sort((a, b) => b.usedPercentage - a.usedPercentage)[0]?.categoryName || "Makan"}.`;
    }

    if (lower.includes("nongkrong") || lower.includes("jajan") || lower.includes("jalan")) {
      const hiburan = summary.categories.find((c) => c.categoryId.includes("hiburan") || c.categoryName?.includes("Hiburan"));
      const urgentCount = activeTasks.filter((t) => t.urgencyScore >= 80).length;

      if (urgentCount >= 2) {
        return `Hmm, minggu ini lagi ada ${urgentCount} deadline tugas yang cukup mepet 👀 Kalau mau nongkrong, saran Fio cari tempat yang tenang buat sekalian ngerjain tugas, dan batasi jajan ya!`;
      }

      if (hiburan && hiburan.usedPercentage >= 90) {
        return `Budget nongkrong kamu udah kepake ${hiburan.usedPercentage}%, tinggal ${formatCurrencyIDR(hiburan.remainingAmount)} lagi. Mendingan nongkrong hemat di kos atau seduh kopi sendiri dulu ya ☕`;
      }

      return `Boleh banget! Tugas kamu masih terkendali dan budget nongkrong masih ada ${formatCurrencyIDR(hiburan?.remainingAmount || 100000)}. Have fun tapi jangan lupa waktu ya! ✨`;
    }

    return `Fio di sini! Ada yang bisa aku bantu seputar jadwal tugas kuliah atau pengelolaan uang jajan kamu hari ini? ✨`;
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-surface border-l border-border shadow-float flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-[#EDE5FF]/50 to-[#E0FBF2]/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center text-white shadow-soft">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    Fio Assistant
                    <span className="w-2 h-2 rounded-full bg-[#7FE3C0]" />
                  </h3>
                  <p className="text-[11px] text-muted">Asisten Pintar Akademik & Finansial</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={clearMessages}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-black/5 transition-colors"
                  title="Bersihkan chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-black/5 transition-colors"
                  title="Tutup drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-[#7C5CFA] flex items-center justify-center text-white shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#7C5CFA] text-white rounded-tr-xs"
                        : "bg-[#F5F3F8] dark:bg-[#2F2B3A] text-foreground rounded-tl-xs border border-border"
                    }`}
                  >
                    <FormattedMessage content={msg.content} isUser={msg.role === "user"} />
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-border flex items-center justify-center text-muted shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 items-center">
                  <div className="w-7 h-7 rounded-lg bg-[#7C5CFA] flex items-center justify-center text-white">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="bg-[#F5F3F8] dark:bg-[#2F2B3A] border border-border rounded-2xl p-3 text-xs text-muted flex items-center gap-1.5">
                    <span>Fio sedang berpikir</span>
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 border-t border-border/50 overflow-x-auto flex gap-1.5 no-scrollbar">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-[#EDE5FF] dark:bg-[#383442] text-[#7C5CFA] dark:text-[#B69CFF] text-[11px] font-medium hover:scale-102 transition-transform"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-border bg-surface">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tanya apa saja ke Fio..."
                  className="flex-1 bg-[#F5F3F8] dark:bg-[#2F2B3A] border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="academic"
                  disabled={!input.trim() || isLoading}
                  className="h-9 w-9 p-0 rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
