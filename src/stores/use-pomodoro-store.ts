"use client";

import { create } from "zustand";
import { notificationService } from "@/lib/notification-service";
import { FirestoreService } from "@/lib/firebase/firestore-service";
import { auth } from "@/lib/firebase/client";

function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || null;
}

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
  initFirestoreSync: (userId: string) => () => void;
  resetPomodoroStore: () => void;
}

const DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60, // 25 min
  short_break: 5 * 60, // 5 min
  long_break: 15 * 60, // 15 min
};

let activePomodoroUnsubscribe: (() => void) | null = null;

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
    const { isRunning, targetEndTime, mode, completedSessions, activeTaskId, activeTaskTitle, totalFocusMinutesToday } = get();
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
        isFocus ? "Sesi Fokus Selesai!" : "Waktu Istirahat Selesai!",
        {
          body: isFocus
            ? `Kerja bagus! Waktunya istirahat sejenak 5 menit sebelum lanjut ${activeTaskTitle || "tugas"}.`
            : "Waktunya kembali fokus mengerjakan tugas!",
        }
      );

      // Record to Firestore if it was a focus session
      if (isFocus) {
        const userId = getCurrentUserId();
        if (userId) {
          FirestoreService.recordPomodoroSession(userId, {
            startTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            durationMinutes: 25,
            taskId: activeTaskId,
            taskTitle: activeTaskTitle,
            completed: true,
          }).catch((err) => console.warn("Firestore recordPomodoroSession warning:", err));
        }
      }

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

  initFirestoreSync: (userId: string) => {
    if (activePomodoroUnsubscribe) {
      activePomodoroUnsubscribe();
      activePomodoroUnsubscribe = null;
    }

    const unsub = FirestoreService.subscribePomodoroSessions(userId, (sessions) => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      let minutesToday = 0;
      let completedCount = 0;

      sessions.forEach((s) => {
        if (s.completed !== false) {
          completedCount++;
          if (s.createdAt && new Date(s.createdAt) >= todayStart) {
            minutesToday += Number(s.durationMinutes) || 25;
          }
        }
      });

      set({
        totalFocusMinutesToday: minutesToday,
        completedSessions: completedCount,
      });
    });

    activePomodoroUnsubscribe = unsub;
    return unsub;
  },

  resetPomodoroStore: () => {
    if (activePomodoroUnsubscribe) {
      activePomodoroUnsubscribe();
      activePomodoroUnsubscribe = null;
    }
    set({
      mode: "focus",
      timeLeft: DURATIONS.focus,
      isRunning: false,
      targetEndTime: null,
      activeTaskId: null,
      activeTaskTitle: null,
      completedSessions: 0,
      totalFocusMinutesToday: 0,
      isWidgetOpen: false,
    });
  },
}));
