"use client";

import React, { useState } from "react";
import { usePomodoroStore } from "@/stores/use-pomodoro-store";
import { useDataStore } from "@/stores/use-data-store";
import { formatCurrencyIDR } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import { PictureInPicture2, Play, Pause, CheckSquare, Sparkles, X, ShieldCheck } from "lucide-react";

export function PiPCompanionModal() {
  const {
    mode,
    timeLeft,
    isRunning,
    activeTaskTitle,
    activeTaskId,
    startTimer,
    pauseTimer,
  } = usePomodoroStore();

  const { tasks, getDailyAllowanceSummary } = useDataStore();
  const daily = getDailyAllowanceSummary();

  const [isPiPActive, setIsPiPActive] = useState(false);

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleLaunchPiP = async () => {
    triggerHaptic("medium");

    // Check Document Picture-in-Picture API
    if ("documentPictureInPicture" in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 320,
          height: 220,
        });

        // Copy styles
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join("");
            const style = document.createElement("style");
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch {
            const link = document.createElement("link");
            if (styleSheet.href) {
              link.rel = "stylesheet";
              link.type = styleSheet.type;
              link.media = styleSheet.media.toString();
              link.href = styleSheet.href;
              pipWindow.document.head.appendChild(link);
            }
          }
        });

        pipWindow.document.body.className = "bg-[#1C1A22] text-white p-4 font-sans select-none";
        pipWindow.document.body.innerHTML = `
          <div style="font-family: system-ui, sans-serif; text-align: center; display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; font-weight: bold; color: #B69CFF;">${mode === "focus" ? "🍅 FOCUS SESSION" : "☕ BREAK TIME"}</span>
              <span style="font-size: 10px; color: #7FE3C0; font-weight: bold;">Sisa Jajan: ${formatCurrencyIDR(daily.todayRemaining)}</span>
            </div>

            <div style="font-size: 38px; font-weight: 900; font-family: monospace; letter-spacing: -1px; margin: 8px 0; color: #FFFFFF;">
              ${formatTime(timeLeft)}
            </div>

            <div style="font-size: 12px; font-weight: bold; color: #EDE5FF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${activeTaskTitle || "Felys Study Companion"}
            </div>
          </div>
        `;

        toast.success("Mini-Widget PiP melayang aktif di layar desktop! ✨");
        setIsPiPActive(true);
      } catch (err) {
        toast.info("Browser membatasi PiP atau ditutup.");
      }
    } else {
      toast.info("Gunakan Google Chrome / Microsoft Edge versi terbaru untuk fitur Picture-in-Picture window.");
    }
  };

  return (
    <button
      onClick={handleLaunchPiP}
      className="p-2 rounded-xl text-muted hover:text-[#7C5CFA] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
      title="Buka Mini-Widget Melayang (Picture-in-Picture)"
    >
      <PictureInPicture2 className="w-4 h-4" />
    </button>
  );
}
