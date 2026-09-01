"use client";

import React from "react";
import { Sparkles, X, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AIInsight } from "@/types/ai";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { useAIStore } from "@/stores/use-ai-store";
import { useRouter } from "next/navigation";
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
    openDrawerWithPrompt(`Fio, tolong beri saran langkah praktis untuk insight ini: "${insight.content}"`);
  };

  const isCrossMode = insight.type === "cross_mode";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-5 border transition-all duration-300 shadow-soft",
        isCrossMode
          ? "bg-gradient-to-r from-[#EDE5FF]/90 via-[#F5F1FF]/80 to-[#E0FBF2]/90 dark:from-[#2A2338] dark:to-[#1E2E28] border-[#B69CFF]/40"
          : "bg-surface border-border"
      )}
    >
      {/* Decorative gradient blur */}
      {isCrossMode && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#B69CFF]/20 to-[#7FE3C0]/20 rounded-full blur-2xl -z-10 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-sm",
              isCrossMode ? "bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0]" : "bg-[#7C5CFA]"
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
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                {isCrossMode ? "Insight AI Lintas Mode" : "Rekomendasi Fio"}
              </span>
            </div>
            <h4 className="text-sm font-bold text-foreground">{insight.title}</h4>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => dismissInsight(insight.id)}
          className="p-1 rounded-full text-muted hover:text-foreground hover:bg-black/5 transition-colors"
          title="Abaikan insight ini"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <p className="text-sm text-[#4E4A56] dark:text-[#D1CADB] leading-relaxed mb-4 font-normal">
        {insight.content}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {insight.actionCta && (
          <Button
            onClick={handleAction}
            size="sm"
            variant="primary"
            className="rounded-xl"
          >
            <span>{insight.actionCta.label}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}

        <Button
          onClick={handleAskFio}
          size="sm"
          variant="secondary"
          className="rounded-xl"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Tanya Fio</span>
        </Button>
      </div>
    </div>
  );
}
