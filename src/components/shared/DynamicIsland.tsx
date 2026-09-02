"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePomodoroStore, PomodoroMode } from "@/stores/use-pomodoro-store";
import { triggerHaptic } from "@/lib/haptics";
import { playPop, playWhoosh, playTick } from "@/lib/sounds";
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Flame,
  PictureInPicture2,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Maximize2,
} from "lucide-react";
import { IOSSegmentedControl } from "@/components/ui/IOSSegmentedControl";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function DynamicIsland() {
  const {
    mode,
    timeLeft,
    isRunning,
    activeTaskTitle,
    completedSessions,
    setMode,
    startTimer,
    pauseTimer,
    resetTimer,
    tick,
  } = usePomodoroStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const islandRef = useRef<HTMLDivElement>(null);

  // Background drift-free timer ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Click outside to collapse
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (islandRef.current && !islandRef.current.contains(e.target as Node)) {
        if (isExpanded) {
          setIsExpanded(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  const totalDuration =
    mode === "focus" ? 25 * 60 : mode === "short_break" ? 5 * 60 : 15 * 60;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalDuration - timeLeft) / totalDuration) * 100))
  );

  const toggleExpand = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic("light");
    if (!isExpanded) {
      playPop();
    } else {
      playWhoosh();
    }
    setIsExpanded(!isExpanded);
  };

  const handleToggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("medium");
    if (isRunning) {
      playPop();
      pauseTimer();
    } else {
      playPop();
      startTimer();
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("warning");
    playPop();
    resetTimer();
  };

  const handleModeChange = (newMode: PomodoroMode) => {
    triggerHaptic("light");
    setMode(newMode);
  };

  const handleOpenPiP = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("light");
    try {
      if ("documentPictureInPicture" in window) {
        // @ts-ignore
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 320,
          height: 240,
        });

        const doc = pipWindow.document;
        doc.title = "🍅 Felys Pomodoro Companion";
        doc.body.style.margin = "0";
        doc.body.style.fontFamily = "system-ui, sans-serif";
        doc.body.style.background = "#181716";
        doc.body.style.color = "#F8F6F2";
        doc.body.style.display = "flex";
        doc.body.style.flexDirection = "column";
        doc.body.style.alignItems = "center";
        doc.body.style.justifyContent = "center";
        doc.body.style.height = "100vh";
        doc.body.style.padding = "16px";

        doc.body.innerHTML = `
          <div style="font-size: 32px; font-weight: 800; font-family: monospace; letter-spacing: -1px; margin-bottom: 8px;">
            ${formatTime(timeLeft)}
          </div>
          <div style="font-size: 12px; font-weight: bold; color: #B69CFF; margin-bottom: 12px;">
            ${mode === "focus" ? "🍅 Sesi Fokus Belajar" : "☕ Waktu Istirahat"}
          </div>
          <div style="font-size: 11px; opacity: 0.8; max-width: 200px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${activeTaskTitle || "Felys Workspace"}
          </div>
        `;
      }
    } catch (err) {
      console.warn("PiP not supported or cancelled:", err);
    }
  };

  return (
    <div
      ref={islandRef}
      className="fixed top-2.5 sm:top-3.5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      style={{ perspective: 1000 }}
    >
      <motion.div
        layout
        initial={false}
        animate={{
          width: isExpanded ? "min(92vw, 360px)" : isRunning ? 210 : 160,
          height: isExpanded ? "auto" : 38,
          borderRadius: isExpanded ? 28 : 20,
        }}
        transition={{
          type: "spring",
          stiffness: 450,
          damping: 32,
        }}
        onClick={!isExpanded ? toggleExpand : undefined}
        className="bg-black/95 dark:bg-[#121110]/98 text-white shadow-2xl border border-white/15 backdrop-blur-2xl overflow-hidden cursor-pointer select-none"
        style={{
          boxShadow: isExpanded
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.15)"
            : "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* COMPACT DYNAMIC ISLAND PILL */
            <motion.div
              key="compact"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="h-[38px] px-3 flex items-center justify-between gap-2.5"
            >
              {/* Left Indicator */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-sm select-none">
                  {mode === "focus" ? "🍅" : "☕"}
                </span>
                {isRunning ? (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7FE3C0] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7FE3C0]" />
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                )}
              </div>

              {/* Center Countdown */}
              <div className="font-mono font-extrabold text-xs tracking-tight text-white/95">
                {formatTime(timeLeft)}
              </div>

              {/* Right Mini Equalizer / Audio Wave */}
              <div className="flex items-center gap-0.5 shrink-0">
                {isRunning ? (
                  <div className="flex items-center gap-0.5 h-3">
                    <span className="w-0.5 h-3 bg-[#7C5CFA] rounded-full animate-pulse" />
                    <span className="w-0.5 h-2 bg-[#7FE3C0] rounded-full animate-pulse delay-75" />
                    <span className="w-0.5 h-3.5 bg-[#B69CFF] rounded-full animate-pulse delay-150" />
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-white/50 tracking-wider">
                    {mode === "focus" ? "25m" : "5m"}
                  </span>
                )}
              </div>
            </motion.div>
          ) : (
            /* EXPANDED DYNAMIC ISLAND CARD */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 sm:p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header inside Island */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-base">
                    {mode === "focus" ? "🍅" : "☕"}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">
                      {mode === "focus" ? "Sesi Fokus Belajar" : "Waktu Istirahat"}
                    </span>
                    <span className="text-[10px] text-white/60 font-medium truncate max-w-[180px] block">
                      {activeTaskTitle || "Felys Workspace"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#B69CFF] flex items-center gap-1">
                    <Flame className="w-3 h-3 text-[#FFC978]" />
                    <span>{completedSessions} Selesai</span>
                  </span>
                  <button
                    onClick={toggleExpand}
                    className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Big Time Display & Circular/Linear Progress */}
              <div className="text-center py-1">
                <div className="text-3xl sm:text-4xl font-mono font-extrabold text-white tracking-tight">
                  {formatTime(timeLeft)}
                </div>
                <div className="w-full h-1.5 bg-white/15 rounded-full mt-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#7C5CFA] via-[#B69CFF] to-[#7FE3C0] rounded-full"
                    initial={false}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Mode Selector Tabs (Drag-to-Scrub) */}
              <div>
                <IOSSegmentedControl<PomodoroMode>
                  options={[
                    {
                      id: "focus",
                      label: "Fokus 🍅",
                      activeColor: "bg-[#7C5CFA]",
                      activeTextColor: "text-white",
                    },
                    {
                      id: "short_break",
                      label: "Jeda ☕",
                      activeColor: "bg-[#7FE3C0]",
                      activeTextColor: "text-[#0F3E30]",
                    },
                    {
                      id: "long_break",
                      label: "Panjang 🛋️",
                      activeColor: "bg-[#8EC8FF]",
                      activeTextColor: "text-[#0C2D48]",
                    },
                  ]}
                  value={mode}
                  onChange={handleModeChange}
                  size="sm"
                  className="w-full bg-white/10 border border-white/10 text-white"
                />
              </div>

              {/* Quick Action Controls */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleToggleTimer}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isRunning
                      ? "bg-[#FF7A85] text-white hover:bg-[#FF6673]"
                      : "bg-[#7FE3C0] text-[#0F3E30] hover:bg-[#6BD8B2]"
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Jeda Waktu</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                      <span>Mulai Fokus</span>
                    </>
                  )}
                </button>

                {"documentPictureInPicture" in (typeof window !== "undefined" ? window : {}) && (
                  <button
                    type="button"
                    onClick={handleOpenPiP}
                    className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                    title="Buka Jendela Mengambang (PiP)"
                  >
                    <PictureInPicture2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
