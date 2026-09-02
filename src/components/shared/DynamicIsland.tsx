"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePomodoroStore, PomodoroMode } from "@/stores/use-pomodoro-store";
import { triggerHaptic } from "@/lib/haptics";
import { playPop, playWhoosh } from "@/lib/sounds";
import {
  Play,
  Pause,
  RotateCcw,
  Flame,
  ChevronUp,
  GripHorizontal,
  ExternalLink,
  Layers,
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
  const [isDragging, setIsDragging] = useState(false);
  const [autoPopOut, setAutoPopOut] = useState(true);
  const islandRef = useRef<HTMLDivElement>(null);
  const pipWindowRef = useRef<any>(null);

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

  // Update Pop-Out window content whenever state changes
  useEffect(() => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      const doc = pipWindowRef.current.document;
      const timeEl = doc.getElementById("pip-time");
      const titleEl = doc.getElementById("pip-title");
      const statusEl = doc.getElementById("pip-status");
      const playBtn = doc.getElementById("pip-play-btn");

      if (timeEl) timeEl.textContent = formatTime(timeLeft);
      if (titleEl) titleEl.textContent = activeTaskTitle || "Felys Workspace";
      if (statusEl) statusEl.textContent = mode === "focus" ? "🍅 Fokus Belajar" : "☕ Waktu Istirahat";
      if (playBtn) {
        playBtn.textContent = isRunning ? "⏸️ Jeda" : "▶️ Mulai";
        playBtn.style.backgroundColor = isRunning ? "#FF7A85" : "#7FE3C0";
        playBtn.style.color = isRunning ? "#FFFFFF" : "#0F3E30";
      }
    }
  }, [timeLeft, isRunning, mode, activeTaskTitle]);

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
    if (isDragging) return;

    triggerHaptic("light");
    if (!isExpanded) {
      playPop();
    } else {
      playWhoosh();
    }
    setIsExpanded(!isExpanded);
  };

  const handleToggleTimer = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic("medium");
    if (isRunning) {
      playPop();
      pauseTimer();
    } else {
      playPop();
      startTimer();
    }
  };

  const handleReset = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic("warning");
    playPop();
    resetTimer();
  };

  const handleModeChange = (newMode: PomodoroMode) => {
    triggerHaptic("light");
    setMode(newMode);
  };

  // Launch Built-In Floating Island Window (Always On Top)
  const openFloatingIsland = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      if ("documentPictureInPicture" in window) {
        if (pipWindowRef.current && !pipWindowRef.current.closed) {
          pipWindowRef.current.focus();
          return;
        }

        // @ts-ignore
        const pip = await window.documentPictureInPicture.requestWindow({
          width: 250,
          height: 105,
        });

        pipWindowRef.current = pip;

        const doc = pip.document;
        doc.title = "🍅 Felys Dynamic Island";
        doc.body.style.margin = "0";
        doc.body.style.padding = "10px";
        doc.body.style.boxSizing = "border-box";
        doc.body.style.fontFamily = "system-ui, -apple-system, sans-serif";
        doc.body.style.backgroundColor = "#000000";
        doc.body.style.color = "#FFFFFF";
        doc.body.style.display = "flex";
        doc.body.style.flexDirection = "column";
        doc.body.style.justifyContent = "space-between";
        doc.body.style.height = "100vh";
        doc.body.style.userSelect = "none";
        doc.body.style.overflow = "hidden";

        doc.body.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 14px;">${mode === "focus" ? "🍅" : "☕"}</span>
              <span id="pip-status" style="font-size: 11px; font-weight: 700; color: #B69CFF;">
                ${mode === "focus" ? "Fokus Belajar" : "Istirahat"}
              </span>
            </div>
            <span id="pip-title" style="font-size: 10px; color: #A39D94; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${activeTaskTitle || "Felys"}
            </span>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
            <div id="pip-time" style="font-size: 26px; font-weight: 800; font-family: monospace; letter-spacing: -1px; color: #FFFFFF;">
              ${formatTime(timeLeft)}
            </div>

            <div style="display: flex; gap: 6px;">
              <button id="pip-reset-btn" style="background: rgba(255,255,255,0.15); border: none; color: white; border-radius: 12px; padding: 6px 8px; font-size: 11px; cursor: pointer; font-weight: bold;">
                🔄
              </button>
              <button id="pip-play-btn" style="background: ${isRunning ? "#FF7A85" : "#7FE3C0"}; border: none; color: ${isRunning ? "#FFFFFF" : "#0F3E30"}; border-radius: 12px; padding: 6px 12px; font-size: 11px; cursor: pointer; font-weight: 800;">
                ${isRunning ? "⏸️ Jeda" : "▶️ Mulai"}
              </button>
            </div>
          </div>
        `;

        // Attach listeners inside PiP
        const playBtn = doc.getElementById("pip-play-btn");
        const resetBtn = doc.getElementById("pip-reset-btn");

        if (playBtn) {
          playBtn.onclick = () => {
            const currentRunning = usePomodoroStore.getState().isRunning;
            if (currentRunning) {
              pauseTimer();
            } else {
              startTimer();
            }
          };
        }

        if (resetBtn) {
          resetBtn.onclick = () => {
            resetTimer();
          };
        }

        pip.addEventListener("pagehide", () => {
          pipWindowRef.current = null;
        });
      }
    } catch (err) {
      console.warn("Floating Island Pop-Out notice:", err);
    }
  }, [mode, activeTaskTitle, timeLeft, isRunning, pauseTimer, startTimer, resetTimer]);

  // Seamless Auto-Pop Out on App Switch / Tab Visibility Change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isRunning && autoPopOut) {
        if (!pipWindowRef.current || pipWindowRef.current.closed) {
          openFloatingIsland();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isRunning, autoPopOut, openFloatingIsland]);

  return (
    <motion.div
      ref={islandRef}
      drag
      dragMomentum={false}
      dragElastic={0.12}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        triggerHaptic("light");
        setTimeout(() => setIsDragging(false), 120);
      }}
      className="fixed top-[calc(env(safe-area-inset-top,0px)+4.5rem)] right-4 sm:right-8 z-50 pointer-events-auto touch-none"
      style={{ touchAction: "none" }}
    >
      <motion.div
        layout
        initial={false}
        animate={{
          width: isExpanded ? "min(90vw, 360px)" : isRunning ? 220 : 170,
          height: isExpanded ? "auto" : 40,
          borderRadius: isExpanded ? 28 : 22,
        }}
        transition={{
          type: "spring",
          stiffness: 450,
          damping: 32,
        }}
        onClick={!isExpanded ? toggleExpand : undefined}
        className={`bg-black/95 dark:bg-[#121110]/98 text-white shadow-2xl border border-white/15 backdrop-blur-2xl overflow-hidden select-none transition-shadow ${
          isDragging ? "cursor-grabbing scale-105 shadow-2xl" : "cursor-grab"
        }`}
        style={{
          boxShadow: isExpanded
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.15)"
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
              className="h-[40px] px-3 flex items-center justify-between gap-2.5 relative group"
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

              {/* Right Mini Equalizer & Pop-Out Quick Button */}
              <div className="flex items-center gap-1 shrink-0">
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFloatingIsland();
                  }}
                  className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/15 transition-all"
                  title="Lepas Kapsul Melayang ke Luar App (Always-On-Top)"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
                <GripHorizontal className="w-3 h-3 text-white/30 group-hover:text-white/70 transition-colors" />
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
              {/* Header inside Island with Drag Bar */}
              <div className="flex items-center justify-between cursor-grab active:cursor-grabbing">
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
                    title="Kecilkan Island"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Big Time Display & Linear Progress */}
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

              {/* Seamless Auto-Pop Out Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10 text-[11px]">
                <div className="flex items-center gap-1.5 text-white/80">
                  <Layers className="w-3.5 h-3.5 text-[#7FE3C0]" />
                  <span>Kapsul tetap melayang saat pindah app</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoPopOut}
                  onChange={(e) => setAutoPopOut(e.target.checked)}
                  className="rounded text-[#7C5CFA] focus:ring-0 cursor-pointer accent-[#7C5CFA] w-3.5 h-3.5"
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

                <button
                  type="button"
                  onClick={openFloatingIsland}
                  className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                  title="Lepas Kapsul ke Luar Layar"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
