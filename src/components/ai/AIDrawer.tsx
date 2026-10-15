"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  ArrowUp,
  Bot,
  Trash2,
  Zap,
  Wallet,
  ListTodo,
  PiggyBank,
  Clock,
  Maximize2,
  Minimize2,
  ChevronDown,
  Activity,
  ShieldCheck,
  BarChart2,
  Target,
  Coffee,
  Timer,
  Calendar,
  ListOrdered,
  Lightbulb,
} from "lucide-react";
import { useAIStore } from "@/stores/use-ai-store";
import { useDataStore } from "@/stores/use-data-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { triggerHaptic } from "@/lib/haptics";
import { playPop, playWhoosh } from "@/lib/sounds";
import { formatCurrencyIDR } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import { FormattedMessage } from "./FormattedMessage";
import { ContextSummaryPopover } from "./ContextSummaryPopover";
import {
  detectSkillIntent,
  callFioSkill,
  formatSkillReply,
} from "@/lib/fio-skills-client";

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
  const {
    courses,
    tasks,
    categories,
    ddayEvent,
    accounts,
    savingsGoals,
    debts,
    getTotalNetWorth,
    getMonthlyBudgetSummary,
  } = useDataStore();
  const [input, setInput] = useState("");

  // Mode lebar (wide) untuk membaca lebih lega di layar besar
  const [isWideMode, setIsWideMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("felys_ai_wide_mode") === "true";
    }
    return false;
  });

  // State popover ringkasan data sesi aktif
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Multi-step thinking rotation
  const [thinkingStep, setThinkingStep] = useState(0);
  const thinkingTexts = [
    "Membaca data tugas & saldo akun...",
    "Menganalisis skenario optimal...",
    "Menyusun strategi terbaik untukmu...",
  ];

  useEffect(() => {
    if (!isLoading) {
      setThinkingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setThinkingStep((prev) => (prev + 1) % thinkingTexts.length);
    }, 1250);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Konteks live untuk header + kartu skill (dihitung saat drawer dibuka)
  const activeTasks = tasks.filter((t) => t.status !== "done");
  const liveSummary = getMonthlyBudgetSummary();
  const isFresh = messages.length <= 1;

  // Hitung sisa hari D-Day jika ada
  let ddayDaysLeft: number | null = null;
  if (ddayEvent?.targetDate) {
    try {
      const target = new Date(ddayEvent.targetDate);
      target.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      ddayDaysLeft = differenceInDays(target, today);
    } catch {}
  }

  // Dynamic Contextual Next-Action Chips (Prioritas 4)
  const getContextualPrompts = (): { label: string; icon: React.ComponentType<{ className?: string }> }[] => {
    if (messages.length <= 1) {
      return [
        { label: "Boleh aku jajan 30000 hari ini?", icon: Wallet },
        { label: "Buatkan rencana cicil tugas", icon: ListTodo },
        { label: "Simulasi hemat 50% jajan", icon: PiggyBank },
        { label: "Tips hemat makan anak kos", icon: Lightbulb },
      ];
    }

    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
    const text = lastAssistantMsg?.content.toLowerCase() || "";

    if (
      text.includes("jajan") ||
      text.includes("hemat") ||
      text.includes("budget") ||
      text.includes("pengeluaran") ||
      text.includes("saldo")
    ) {
      return [
        { label: "Pasang Limit Jajan", icon: Zap },
        { label: "Coba simulasi hemat 30%", icon: BarChart2 },
        { label: "Simpan selisih ke Celengan", icon: Target },
        { label: "Tips hemat makan & ngopi", icon: Coffee },
      ];
    }

    if (
      text.includes("tugas") ||
      text.includes("deadline") ||
      text.includes("urgent") ||
      text.includes("kuliah")
    ) {
      return [
        { label: "Mulai Pomodoro 25 menit", icon: Timer },
        { label: "Rencana cicilan per hari", icon: Calendar },
        { label: "Urutkan dari yang termudah", icon: ListOrdered },
        { label: "Tips fokus anti-distraksi", icon: Lightbulb },
      ];
    }

    return [
      { label: "Boleh aku jajan 30000 hari ini?", icon: Wallet },
      { label: "Buatkan rencana cicil tugas", icon: ListTodo },
      { label: "Simulasi hemat 50% jajan", icon: PiggyBank },
      { label: "Rangkum kondisi minggu ini", icon: BarChart2 },
    ];
  };

  const contextualPrompts = getContextualPrompts();

  const skillCards = [
    {
      icon: Wallet,
      title: "Cek Jajan",
      desc: "Boleh beli 25rb?",
      prompt: "Fio, boleh aku jajan 25000 hari ini?",
      iconBg: "bg-[#1F8766]",
    },
    {
      icon: ListTodo,
      title: "Rencana Tugas",
      desc: "Cicilan per hari",
      prompt: "Fio, buatkan rencana cicil tugas",
      iconBg: "bg-[#7C5CFA]",
    },
    {
      icon: PiggyBank,
      title: "Simulasi Hemat",
      desc: "Potong 50% jajan",
      prompt: "Fio, simulasi hemat 50% jajan",
      iconBg: "bg-[#D97706]",
    },
  ];

  const formatClock = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };
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

    // 2. Skill-first: intent deterministik berbasis data real (tanpa biaya LLM)
    const intent = detectSkillIntent(query, categories);
    if (intent) {
      let skillDone = false;
      try {
        let token = "";
        if (user) {
          try {
            token = await user.getIdToken();
          } catch {}
        }
        const data = await callFioSkill(intent, token);
        addMessage({
          role: "assistant",
          content: formatSkillReply(intent.skill, data),
          skill: intent.skill,
          ...(intent.skill === "can-i-spend" && typeof data.allowed === "boolean"
            ? { skillAllowed: data.allowed }
            : {}),
        });
        triggerHaptic("success");
        skillDone = true;
      } catch (e) {
        // 401 (belum login / sesi kedaluwarsa) atau API down → lanjut ke LLM/fallback
        console.warn("Fio skill fallback to chat:", e);
      } finally {
        if (skillDone) {
          setLoading(false);
          return;
        }
        // skill gagal → loading tetap jalan, lanjut ke jalur LLM di bawah
      }
    }

    try {
      // Gather full realtime multi-tenant isolated context
      const activeTasks = tasks.filter((t) => t.status !== "done");
      const summary = getMonthlyBudgetSummary();

      let token = "";
      if (user) {
        try {
          token = await user.getIdToken();
        } catch {}
      }

      // Hitung jadwal kuliah hari ini (1 = Senin, ..., 7 = Minggu)
      const jsDay = new Date().getDay();
      const currentDayOfWeek = jsDay === 0 ? 7 : jsDay;

      // Hitung sisa hari D-Day jika ada
      let ddayDaysLeft: number | null = null;
      if (ddayEvent?.targetDate) {
        try {
          const target = new Date(ddayEvent.targetDate);
          target.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          ddayDaysLeft = differenceInDays(target, today);
        } catch {}
      }

      const userContext = {
        userProfile: {
          name: user?.displayName || user?.email?.split("@")[0] || "Mahasiswa",
          email: user?.email || undefined,
        },
        ddayEvent: ddayEvent?.targetDate
          ? {
              title: ddayEvent.title || "Target D-Day",
              targetDate: ddayEvent.targetDate,
              daysLeft: ddayDaysLeft,
            }
          : undefined,
        courses: (courses || []).map((c) => ({
          id: c.id,
          name: c.name,
          sks: c.sks,
          todaySchedules: (c.schedules || [])
            .filter((s) => s.dayOfWeek === currentDayOfWeek)
            .map((s) => ({
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              room: s.room,
            })),
        })),
        tasks: activeTasks.map((t) => ({
          id: t.id,
          title: t.title,
          course: t.courseName,
          deadline: t.deadline,
          urgencyScore: t.urgencyScore,
          priority: t.priority,
          status: t.status,
          completedSubtasks: t.subtasks?.filter((st) => st.isDone).length ?? t.completedSubtasksCount ?? 0,
          totalSubtasks: t.subtasks?.length ?? t.totalSubtasksCount ?? 0,
        })),
        accounts: (accounts || []).map((a) => ({
          name: a.name,
          provider: a.provider,
          currentBalance: a.currentBalance,
        })),
        totalNetWorth: getTotalNetWorth ? getTotalNetWorth() : undefined,
        budgetSummary: {
          totalLimit: summary.totalLimit,
          totalSpent: summary.totalSpent,
          remaining: summary.remaining,
          percentage: summary.overallPercentage,
          categories: (summary.categories || []).map((c) => ({
            name: c.categoryName || c.categoryId,
            spent: c.spentAmount,
            limit: c.monthlyLimit,
            usedPercentage: c.usedPercentage,
            status: c.status,
          })),
        },
        savingsGoals: (savingsGoals || [])
          .filter((s) => !s.isCompleted)
          .map((s) => ({
            title: s.title,
            currentAmount: s.currentAmount,
            targetAmount: s.targetAmount,
            percentage: s.targetAmount > 0 ? Math.round((s.currentAmount / s.targetAmount) * 100) : 0,
          })),
        debts: (debts || [])
          .filter((d) => !d.isSettled)
          .map((d) => ({
            friendName: d.friendName,
            amount: d.amount,
            type: d.type,
            description: d.description,
          })),
      };

      // Call streaming API
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: query }],
          context: userContext,
        }),
      });

      if (res.status === 429) {
        const rateLimitMsg = await res.text();
        addMessage({
          role: "assistant",
          content: rateLimitMsg || "Fio lagi istirahat sejenak nih. Coba lagi sebentar ya!",
        });
        return;
      }

      if (!res.ok) {
        throw new Error("Chat response failed");
      }

      // API mengembalikan text/plain (bukan JSON) — baca sesuai content-type
      const contentType = res.headers.get("content-type") || "";
      let reply: string;
      if (contentType.includes("application/json")) {
        const data = await res.json();
        reply = data.reply || data.content || data.text || "";
      } else {
        reply = await res.text();
      }
      addMessage({
        role: "assistant",
        content: reply.trim() || "Fio siap membantu kamu!",
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
        return `Tugas paling mendesak kamu saat ini adalah **${top.title}** (${top.courseName || "Kuliah"}) dengan skor urgensi **${Math.round(top.urgencyScore)}/100**.\n\nSaran Fio: Yuk cicil tugas ini sekarang selama 25 menit menggunakan Pomodoro timer!`;
      }
      return "Hore! Semua tugas kuliah kamu sudah beres atau belum ada tugas aktif. Istirahat sejenak ya!";
    }

    if (lower.includes("budget") || lower.includes("uang") || lower.includes("sisa") || lower.includes("saldo")) {
      return `Total sisa budget kamu bulan ini ada **${formatCurrencyIDR(summary.remaining)}** (terpakai ${summary.overallPercentage}%).\n\nKategori dengan pemakaian tertinggi adalah **${summary.categories.sort((a, b) => b.usedPercentage - a.usedPercentage)[0]?.categoryName || "Makan & Minum"}**.`;
    }

    if (lower.includes("nongkrong") || lower.includes("jajan") || lower.includes("kopi")) {
      const urgentCount = activeTasks.filter((t) => t.urgencyScore >= 80).length;
      if (urgentCount >= 2) {
        return `Hmm, minggu ini lagi ada **${urgentCount} deadline tugas yang cukup mepet**.\n\nKalau mau ngopi, saran Fio cari tempat yang tenang buat sekalian ngerjain tugas, atau seduh kopi di kos agar hemat!`;
      }
      return `Boleh banget! Tugas kamu masih aman terkendali. Selamat menikmati waktu luang, tapi tetap jaga pengeluaran ya!`;
    }

    return `Hai! Aku Fio, asisten cerdasmu di Felys. Aku bisa bantu cek deadline tugas kuliah, pantau sisa jatah belanja, atau rekomendasi strategi belajar kamu hari ini. Ada yang mau ditanyakan?`;
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 transition-opacity"
          />

          {/* Crisp, Solid Side Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{
              x: 0,
              width: typeof window !== "undefined" && window.innerWidth < 640
                ? "100%"
                : isWideMode
                ? 640
                : 440,
            }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[440px] bg-surface border-l border-border shadow-2xl flex flex-col overflow-hidden transition-[width] duration-300"
          >
            {/* Header with Dual Live Badge & Maximize/Minimize Action */}
            <div className="relative p-3.5 sm:p-4 border-b border-border flex items-center justify-between bg-surface z-20">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* AI Avatar */}
                <div className="w-8 h-8 rounded-xl bg-accent-deep text-white flex items-center justify-center shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight truncate">
                      Fio Assistant
                    </h3>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                  </div>

                  {/* Interactive Dual Live Badge (Prioritas 3) */}
                  <button
                    onClick={() => {
                      triggerHaptic("light");
                      setIsPopoverOpen(!isPopoverOpen);
                    }}
                    className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted hover:text-foreground transition-colors group cursor-pointer"
                    title="Klik untuk melihat ringkasan data aktif"
                  >
                    <span className="font-semibold text-foreground/85 truncate max-w-[150px] sm:max-w-[220px]">
                      {activeTasks.length} tugas • {liveSummary.isDeficit ? "Defisit" : "Sisa"}{" "}
                      {formatCurrencyIDR(Math.abs(liveSummary.remaining))}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 text-muted group-hover:text-foreground transition-transform duration-200 shrink-0 ${
                        isPopoverOpen ? "rotate-180 text-accent-deep" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Buttons: Wide Toggle, Clear Messages, Close */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Wide Mode Toggle */}
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    const next = !isWideMode;
                    setIsWideMode(next);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("felys_ai_wide_mode", String(next));
                    }
                  }}
                  className="hidden sm:flex p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-background border border-transparent hover:border-border transition-colors"
                  title={isWideMode ? "Kecilkan ke mode standar (440px)" : "Perlebar ke mode wide (640px)"}
                  aria-label="Toggle lebar drawer"
                >
                  {isWideMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {!isFresh && (
                  <button
                    onClick={() => {
                      triggerHaptic("warning");
                      clearMessages();
                    }}
                    aria-label="Bersihkan percakapan"
                    className="p-1.5 rounded-xl text-muted hover:text-[#D93D4A] hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-colors"
                    title="Bersihkan percakapan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handleClose}
                  aria-label="Tutup asisten Fio"
                  className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-background border border-transparent hover:border-border transition-colors"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Context Popover (Prioritas 3) */}
            <ContextSummaryPopover
              isOpen={isPopoverOpen}
              onClose={() => setIsPopoverOpen(false)}
              activeTasksCount={activeTasks.length}
              totalNetWorth={getTotalNetWorth ? getTotalNetWorth() : 0}
              remainingBudget={liveSummary.remaining}
              isDeficit={liveSummary.isDeficit}
              ddayTitle={ddayEvent?.title}
              ddayDaysLeft={ddayDaysLeft}
              coursesCount={courses.length}
            />

            {/* Message Conversation Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 relative z-10 bg-background/50">
              {isFresh && (
                /* Welcome Screen + Skill Shortcut Cards */
                <div className="flex flex-col items-center text-center pt-2 pb-1 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-accent-deep shadow-xs">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h4 className="text-sm font-bold text-foreground flex items-center justify-center gap-1.5">
                      <span>Halo! Aku Fio</span>
                      <Sparkles className="w-3.5 h-3.5 text-accent-deep" />
                    </h4>
                    <p className="text-xs text-muted leading-relaxed">
                      Tanyakan apapun, atau pakai jalan pintas berbasis data real-time di bawah.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 w-full">
                    {skillCards.map((card) => (
                      <button
                        key={card.title}
                        onClick={() => handleSendMessage(card.prompt)}
                        disabled={isLoading}
                        aria-label={`Jalan pintas: ${card.title}`}
                        className="rounded-xl border border-border bg-surface hover:bg-background p-3 flex flex-col items-start gap-1.5 text-left transition-colors active:scale-95 disabled:opacity-50 shadow-xs"
                      >
                        <span className={`w-7 h-7 rounded-lg ${card.iconBg} text-white flex items-center justify-center shadow-2xs`}>
                          <card.icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[11px] font-bold text-foreground leading-tight">
                          {card.title}
                        </span>
                        <span className="text-[10px] text-muted leading-tight">
                          {card.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => {
                const skillLabel =
                  msg.skill === "can-i-spend"
                    ? "Cek Jajan"
                    : msg.skill === "plan-tasks"
                      ? "Rencana Tugas"
                      : msg.skill === "simulate-saving"
                        ? "Simulasi Hemat"
                        : null;
                const verdictColor =
                  msg.skill === "can-i-spend"
                    ? msg.skillAllowed
                      ? "#1F8766"
                      : "#D93D4A"
                    : "var(--accent-deep, #7C5CFA)";
                const verdictBorder =
                  msg.skill === "can-i-spend"
                    ? msg.skillAllowed
                      ? "border-emerald-500/40"
                      : "border-red-500/40"
                    : "border-border";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex gap-2.5 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-lg bg-surface border border-border flex items-center justify-center text-accent-deep shrink-0 mt-1 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div className="flex flex-col gap-1 max-w-[85%]">
                      <div
                        className={`rounded-2xl p-3.5 sm:p-4 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-accent-deep text-white rounded-br-xs shadow-xs font-medium"
                            : `bg-surface text-foreground rounded-bl-xs border ${verdictBorder} shadow-xs`
                        }`}
                      >
                        {skillLabel && (
                          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border">
                            <span
                              className="w-1.5 h-1.5 rounded-full inline-block"
                              style={{ backgroundColor: verdictColor }}
                            />
                            <Zap className="w-3 h-3" style={{ color: verdictColor }} />
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: verdictColor }}>
                              {skillLabel} • data real-time
                            </span>
                          </div>
                        )}
                        <FormattedMessage content={msg.content} isUser={msg.role === "user"} />
                      </div>
                      <span
                        className={`flex items-center gap-1 text-[10px] text-muted px-1 ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {formatClock(msg.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {/* Multi-step Thinking Loader */}
              {isLoading && (
                <div className="flex gap-2.5 items-center">
                  <div className="w-6 h-6 rounded-lg bg-surface border border-border text-accent-deep flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-surface border border-border rounded-xl px-3.5 py-2 text-xs text-foreground flex items-center gap-2 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-accent-deep animate-pulse shrink-0" />
                    <span className="font-semibold text-foreground/90">
                      {thinkingTexts[thinkingStep]}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Dynamic Contextual Next-Action Chips (Prioritas 4) */}
            <div className="px-3.5 py-2.5 border-t border-border overflow-x-auto flex gap-1.5 no-scrollbar bg-surface">
              {contextualPrompts.map((chip, idx) => {
                const IconComponent = chip.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.label)}
                    aria-label={`Kirim saran: ${chip.label}`}
                    className="shrink-0 px-3 py-1.5 rounded-full bg-background border border-border text-muted hover:text-foreground hover:border-accent-deep/50 text-[11px] font-medium transition-colors active:scale-95 shadow-2xs inline-flex items-center gap-1.5"
                  >
                    {IconComponent && <IconComponent className="w-3 h-3 text-accent-deep shrink-0" />}
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Minimalist Input Bar */}
            <div className="p-3.5 sm:p-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-border bg-surface">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 bg-background border border-border rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-accent-deep/20 focus-within:border-accent-deep transition-all shadow-xs"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tanya Fio tentang tugas, pengeluaran, atau strategi kuliah..."
                  aria-label="Ketik pertanyaan untuk Fio"
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted focus:outline-none py-1.5"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Kirim pesan ke Fio"
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    input.trim() && !isLoading
                      ? "bg-accent-deep text-white hover:opacity-90 shadow-xs active:scale-90"
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
