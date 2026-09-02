"use client";

import { create } from "zustand";
import { notificationService } from "@/lib/notification-service";

export type PomodoroMode = "focus" | "short_break" | "long_break";

interface PomodoroState {
  mode: PomodoroMode;
  timeLeft: number; // in seconds
  isRunning: boolean;
  targetEndTime: number | null; // Timestamp for drift-free background execution
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  completedSessions: number;
  totalFocusMinutesToday: number;
  isWidgetOpen: boolean;

  // Actions
  setMode: (mode: PomodoroMode) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  setActiveTask: (id: string | null, title: string | null) => void;
  toggleWidget: () => void;
  setWidgetOpen: (open: boolean) => void;
}

const DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60, // 25 min
  short_break: 5 * 60, // 5 min
  long_break: 15 * 60, // 15 min
};

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  mode: "focus",
  timeLeft: DURATIONS.focus,
  isRunning: false,
  targetEndTime: null,
  activeTaskId: null,
  activeTaskTitle: null,
  completedSessions: 0,
  totalFocusMinutesToday: 0,
  isWidgetOpen: false,

  setMode: (mode) => {
    set({
      mode,
      timeLeft: DURATIONS[mode],
      isRunning: false,
      targetEndTime: null,
    });
  },

  startTimer: () => {
    const { timeLeft } = get();
    const targetEndTime = Date.now() + timeLeft * 1000;
    set({ isRunning: true, targetEndTime });
  },

  pauseTimer: () => {
    const { targetEndTime } = get();
    if (targetEndTime) {
      const remainingSecs = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
      set({ isRunning: false, targetEndTime: null, timeLeft: remainingSecs });
    } else {
      set({ isRunning: false });
    }
  },

  resetTimer: () => {
    const { mode } = get();
    set({
      timeLeft: DURATIONS[mode],
      isRunning: false,
      targetEndTime: null,
    });
  },

  tick: () => {
    const { isRunning, targetEndTime, mode, completedSessions, activeTaskTitle, totalFocusMinutesToday } = get();
    if (!isRunning || !targetEndTime) return;

    const remainingSecs = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));

    if (remainingSecs <= 0) {
      // Session Completed!
      const isFocus = mode === "focus";
      const nextMode: PomodoroMode = isFocus
        ? (completedSessions + 1) % 4 === 0
          ? "long_break"
          : "short_break"
        : "focus";

      notificationService.playChime(isFocus ? "focus_done" : "break_done");
      notificationService.sendNotification(
        isFocus ? "🎉 Sesi Fokus Selesai!" : "☕ Waktu Istirahat Selesai!",
        {
          body: isFocus
            ? `Kerja bagus! Waktunya istirahat sejenak 5 menit sebelum lanjut ${activeTaskTitle || "tugas"}.`
            : "Waktunya kembali fokus mengerjakan tugas!",
        }
      );

      set({
        mode: nextMode,
        timeLeft: DURATIONS[nextMode],
        isRunning: false,
        targetEndTime: null,
        completedSessions: isFocus ? completedSessions + 1 : completedSessions,
        totalFocusMinutesToday: isFocus ? totalFocusMinutesToday + 25 : totalFocusMinutesToday,
      });
    } else {
      set({ timeLeft: remainingSecs });
    }
  },

  setActiveTask: (id, title) => set({ activeTaskId: id, activeTaskTitle: title }),
  toggleWidget: () => set((s) => ({ isWidgetOpen: !s.isWidgetOpen })),
  setWidgetOpen: (open) => set({ isWidgetOpen: open }),
}));
