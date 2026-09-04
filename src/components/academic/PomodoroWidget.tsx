"use client";

import React, { useEffect, useState } from "react";
import { usePomodoroStore, PomodoroMode } from "@/stores/use-pomodoro-store";
import { useDataStore } from "@/stores/use-data-store";
import { notificationService } from "@/lib/notification-service";
import { triggerHaptic } from "@/lib/haptics";
import { Play, Pause, RotateCcw, CheckSquare, Bell, Sparkles, X, Minimize2, Maximize2, Coffee, Flame, PictureInPicture2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IOSSegmentedControl, SegmentOption } from "@/components/ui/IOSSegmentedControl";
import { PiPCompanionModal } from "@/components/shared/PiPCompanionModal";

export function PomodoroWidget() {
  const {
    mode,
    timeLeft,
    isRunning,
    activeTaskId,
    activeTaskTitle,
    completedSessions,
    isWidgetOpen,
    setMode,
    startTimer,
    pauseTimer,
    resetTimer,
    tick,
    setActiveTask,
    toggleWidget,
    setWidgetOpen,
  } = usePomodoroStore();

  const { tasks } = useDataStore();
  const [isMinimized, setIsMinimized] = useState(false);

  // Active uncompleted tasks
  const activeTasks = tasks.filter((t) => t.status !== "done");

  // Timer Tick Interval (Battery efficient: only runs when timer is running)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, tick]);

  // Tab Title Sync ([🍅 24:59] Task Name | Felys)
  useEffect(() => {
    const originalTitle = "Felys — Atur Waktu, Atur Uang, Tenang Aja";
    if (isRunning) {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      const emoji = mode === "focus" ? "🍅" : "☕";
      const taskLabel = activeTaskTitle ? ` ${activeTaskTitle} |` : "";
      document.title = `[${emoji} ${formattedTime}]${taskLabel} Felys`;
    } else {
      document.title = originalTitle;
    }

    return () => {
      document.title = originalTitle;
    };
  }, [timeLeft, isRunning, mode, activeTaskTitle]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleTogglePlay = async () => {
    triggerHaptic("medium");
    if (!isRunning) {
      if (!notificationService.isPermissionGranted()) {
        await notificationService.requestPermission();
      }
      startTimer();
    } else {
      pauseTimer();
    }
  };

  const handleModeChange = (newMode: PomodoroMode) => {
    triggerHaptic("light");
    setMode(newMode);
  };

  if (!isWidgetOpen) {
    // Floating Mini Indicator in bottom right
    return (
      <aside
        aria-label="Pomodoro Timer Melayang"
        onClick={() => {
          triggerHaptic("light");
          setWidgetOpen(true);
        }}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-5 left-5 z-40 cursor-pointer group animate-in slide-in-from-bottom-3"
      >
        <div className={`p-2.5 px-3.5 rounded-full border shadow-xl flex items-center gap-2.5 transition-all duration-300 group-hover:scale-105 ${
          isRunning
            ? "bg-gradient-to-r from-[#7C5CFA] to-[#6842f5] text-white border-transparent ring-2 ring-[#B69CFF]/50"
            : "bg-surface/95 backdrop-blur-md text-foreground border-border"
        }`}>
          <span className="text-sm">
            {mode === "focus" ? "🍅" : "☕"}
          </span>
          <span className="text-xs font-mono font-extrabold tracking-tight">
            {formatTime(timeLeft)}
          </span>
          {activeTaskTitle && (
            <span className="hidden sm:inline text-[11px] font-medium max-w-[120px] truncate opacity-90">
              {activeTaskTitle}
            </span>
          )}
          {isRunning && (
            <span className="w-2 h-2 rounded-full bg-[#7FE3C0] animate-pulse" />
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside aria-label="Panel Pomodoro Fokus" className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-5 left-5 z-40 w-[90vw] sm:w-80 animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-4 rounded-3xl bg-white dark:bg-[#26232E] border border-border shadow-2xl space-y-3.5 ring-1 ring-black/10">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{mode === "focus" ? "🍅" : "☕"}</span>
            <span className="text-xs font-bold text-foreground">
              {mode === "focus" ? "Sesi Fokus Belajar" : "Waktu Istirahat"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <PiPCompanionModal />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDE5FF] dark:bg-[#342F3E] text-[#7C5CFA]">
              {completedSessions} Selesai
            </span>
            <button
              onClick={() => setWidgetOpen(false)}
              className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Apple-style Drag-to-Scrub Mode Selector */}
        <IOSSegmentedControl<PomodoroMode>
          options={[
            {
              id: "focus",
              label: "Fokus (25m)",
              activeColor: "bg-[#7C5CFA]",
              activeTextColor: "text-white",
            },
            {
              id: "short_break",
              label: "Jeda (5m)",
              activeColor: "bg-[#7FE3C0]",
              activeTextColor: "text-[#0F3E30] dark:text-[#0F3E30]",
            },
            {
              id: "long_break",
              label: "Panjang (15m)",
              activeColor: "bg-[#8EC8FF]",
              activeTextColor: "text-[#0C2D48] dark:text-[#0C2D48]",
            },
          ]}
          value={mode}
          onChange={handleModeChange}
          size="sm"
          className="w-full shadow-xs"
        />

        {/* Big Time Display */}
        <div className="text-center py-2">
          <div className="text-4xl sm:text-5xl font-mono font-black text-foreground tracking-tight">
            {formatTime(timeLeft)}
          </div>
          <p className="text-[10px] text-muted mt-1">
            {isRunning ? "Fokus berjalan... Judul tab browser disinkronkan ✨" : "Siap memulai fokus nugas"}
          </p>
        </div>

        {/* Task Selector */}
        <div>
          <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
            Tugas yang Sedang Dikerjakan:
          </label>
          <select
            value={activeTaskId || ""}
            onChange={(e) => {
              const task = activeTasks.find((t) => t.id === e.target.value);
              setActiveTask(task ? task.id : null, task ? task.title : null);
            }}
            className="w-full bg-[#FAF9FC] dark:bg-[#342F3E] border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
          >
            <option value="">-- Tanpa Tugas Spesifik --</option>
            {activeTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.courseName || "Umum"})
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={handleTogglePlay}
            variant={isRunning ? "secondary" : "academic"}
            size="sm"
            className="flex-1 rounded-xl font-bold flex items-center justify-center gap-1.5"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? "Jeda" : "Mulai Fokus"}</span>
          </Button>

          <Button
            onClick={() => {
              triggerHaptic("light");
              resetTimer();
            }}
            variant="secondary"
            size="sm"
            className="rounded-xl px-3"
            title="Reset Waktu"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
