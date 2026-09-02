"use client";

import React from "react";
import { Sparkles, X, ArrowRight, AlertTriangle, CheckCircle2, MessageSquare } from "lucide-react";
import { AIInsight } from "@/types/ai";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { useAIStore } from "@/stores/use-ai-store";
import { useRouter } from "next/navigation";
import { triggerHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  insight: AIInsight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const { dismissInsight, toggleTaskStatus } = useDataStore();
  const { openDrawerWithPrompt } = useAIStore();
  const router = useRouter();

  if (insight.isDismissed) return null;

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

  const isCrossMode = insight.type === "cross_mode";

  return (
    <div
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
                : "bg-[#7C5CFA]"
            )}
          >
            {isCrossMode ? (
              <Sparkles className="w-4 h-4" />
            ) : insight.type === "budget_alert" ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
              {isCrossMode ? "Cross-Mode Intelligence" : "Rekomendasi Fio"}
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
      <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed mb-4">
        {insight.content}
      </p>

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
      </div>
    </div>
  );
}
