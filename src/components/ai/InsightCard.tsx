"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, X, ArrowRight, AlertTriangle, CheckCircle2, MessageSquare, Zap, Clock } from "lucide-react";
import { AIInsight } from "@/types/ai";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { useAIStore } from "@/stores/use-ai-store";
import { useRouter } from "next/navigation";
import { triggerHaptic } from "@/lib/haptics";
import { cn, formatCurrencyIDR, getBudgetStatusConfig, getUrgencyBadgeConfig } from "@/lib/utils";

function formatRelative(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins < 1) return "baru saja";
    if (mins < 60) return `${mins} mnt lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

interface InsightCardProps {
  insight: AIInsight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const { dismissInsight, toggleTaskStatus, categories, tasks, getMonthlyBudgetSummary } = useDataStore();
  const { openDrawerWithPrompt } = useAIStore();
  const router = useRouter();

  if (insight.isDismissed) return null;

  // Data pendukung meter visual (lookup real dari store)
  const summary = getMonthlyBudgetSummary();
  const linkedBudget =
    summary.categories.find((c) => c.categoryId === insight.relatedCategoryId) ||
    [...summary.categories].sort((a, b) => b.usedPercentage - a.usedPercentage)[0];
  const linkedTask =
    tasks.find((t) => t.id === insight.relatedTaskId) ||
    [...tasks].filter((t) => t.status !== "done").sort((a, b) => b.urgencyScore - a.urgencyScore)[0];
  const urgentCount = tasks.filter((t) => t.status !== "done" && t.urgencyScore >= 80).length;

  const handleAction = () => {
    triggerHaptic("medium");
    if (!insight.actionCta) return;

    if (insight.actionCta.actionType === "start_task" && insight.actionCta.targetId) {
      toggleTaskStatus(insight.actionCta.targetId);
      dismissInsight(insight.id);
    } else if (insight.actionCta.actionType === "navigate_task") {
      router.push("/academic");
    } else if (insight.actionCta.actionType === "open_budget") {
      router.push("/finance/budget");
    }
  };

  const handleAskFio = () => {
    triggerHaptic("light");
    openDrawerWithPrompt(`Fio, tolong beri saran langkah praktis untuk insight ini: "${insight.content}"`);
  };

  // Prompt skill deterministik sesuai tipe insight — dieksekusi via
  // deteksi intent di AIDrawer (tanpa biaya LLM, berbasis data real).
  const getSkillPrompt = (): { label: string; prompt: string } | null => {
    if (insight.type === "cross_mode") {
      return { label: "Cek boleh jajan?", prompt: "Fio, boleh aku jajan 25000 hari ini?" };
    }
    if (insight.type === "task_recommendation") {
      return { label: "Rencana cicil", prompt: "Fio, buatkan rencana cicil tugas" };
    }
    if (insight.type === "budget_alert") {
      const cat = categories.find((c) => c.id === insight.relatedCategoryId);
      return {
        label: "Simulasi hemat",
        prompt: `Fio, simulasi hemat 50%${cat ? ` ${cat.name}` : ""}`,
      };
    }
    return null;
  };
  const skillCta = getSkillPrompt();

  const handleRunSkill = () => {
    if (!skillCta) return;
    triggerHaptic("medium");
    openDrawerWithPrompt(skillCta.prompt);
  };

  const isCrossMode = insight.type === "cross_mode";
  const isBudget = insight.type === "budget_alert";

  const budgetCfg = linkedBudget ? getBudgetStatusConfig(linkedBudget.usedPercentage) : null;
  const urgencyCfg = linkedTask ? getUrgencyBadgeConfig(linkedTask.urgencyScore) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-[28px] p-5 sm:p-6 border transition-all duration-300 shadow-soft",
        isCrossMode
          ? "bg-gradient-to-r from-[#EDE5FF]/80 via-[#FAF9FC] to-[#E0FBF2]/80 dark:from-[#251F30] dark:via-[#1D1B22] dark:to-[#172520] border-[#B69CFF]/40"
          : "bg-surface border-border"
      )}
    >
      {/* Soft Ambient Light Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#7C5CFA]/15 to-[#7FE3C0]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-8 h-8 rounded-2xl flex items-center justify-center text-white shadow-soft shrink-0",
              isCrossMode
                ? "bg-gradient-to-tr from-[#7C5CFA] via-[#B69CFF] to-[#7FE3C0]"
                : isBudget
                  ? budgetCfg?.barColor || "bg-[#7C5CFA]"
                  : "bg-[#7C5CFA]"
            )}
          >
            {isCrossMode ? (
              <Sparkles className="w-4 h-4" />
            ) : isBudget ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
              {isCrossMode ? "Cross-Mode Intelligence" : "Rekomendasi Fio"}
              <span className="flex items-center gap-0.5 normal-case font-medium text-muted">
                <Clock className="w-2.5 h-2.5" />
                {formatRelative(insight.createdAt)}
              </span>
            </span>
            <h4 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {insight.title}
            </h4>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => {
            triggerHaptic("light");
            dismissInsight(insight.id);
          }}
          className="p-1.5 rounded-full text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title="Abaikan insight"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed mb-3">
        {insight.content}
      </p>

      {/* Data Meter — visual seirama badge skill di drawer */}
      {isCrossMode ? (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFE8EA] text-[#D93D4A] text-[11px] font-bold">
            🔥 {urgentCount} deadline mepet
          </span>
          {linkedBudget && budgetCfg && (
            <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold", budgetCfg.badgeBg, budgetCfg.textColor)}>
              💸 {linkedBudget.categoryName} {linkedBudget.usedPercentage}%
            </span>
          )}
        </div>
      ) : isBudget && linkedBudget && budgetCfg ? (
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
            <span className="text-foreground/80">{linkedBudget.categoryName}</span>
            <span className={budgetCfg.textColor}>
              {linkedBudget.usedPercentage}% • sisa {formatCurrencyIDR(Math.max(0, linkedBudget.remainingAmount))}
            </span>
          </div>
          <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, linkedBudget.usedPercentage)}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={cn("h-full rounded-full", budgetCfg.barColor)}
            />
          </div>
        </div>
      ) : linkedTask && urgencyCfg ? (
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
            <span className="text-foreground/80 truncate mr-2">🎯 {linkedTask.title}</span>
            <span className={urgencyCfg.textClass}>
              {Math.round(linkedTask.urgencyScore)}/100 {urgencyCfg.label}
            </span>
          </div>
          <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, linkedTask.urgencyScore)}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#7C5CFA] to-[#B69CFF]"
            />
          </div>
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {insight.actionCta && (
          <Button
            onClick={handleAction}
            size="sm"
            variant="primary"
            className="rounded-xl font-bold"
          >
            <span>{insight.actionCta.label}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}

        <Button
          onClick={handleAskFio}
          size="sm"
          variant="secondary"
          className="rounded-xl font-medium"
        >
          <MessageSquare className="w-3.5 h-3.5 text-accent mr-1" />
          <span>Tanya Fio AI</span>
        </Button>

        {skillCta && (
          <Button
            onClick={handleRunSkill}
            size="sm"
            variant="secondary"
            className="rounded-xl font-bold border-[#7C5CFA]/40 text-[#7C5CFA]"
          >
            <Zap className="w-3.5 h-3.5 mr-1" />
            <span>{skillCta.label}</span>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
