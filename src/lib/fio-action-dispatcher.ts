"use client";

import { usePomodoroStore } from "@/stores/use-pomodoro-store";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";

export type FioActionType =
  | "start_pomodoro"
  | "open_task_modal"
  | "open_finance_modal"
  | "navigate_courses"
  | "navigate_budget";

export interface FioActionButton {
  label: string;
  icon?: string;
  action: FioActionType;
  param?: string;
}

export class FioActionDispatcher {
  public static execute(action: FioActionType, param?: string) {
    triggerHaptic("medium");

    switch (action) {
      case "start_pomodoro": {
        const pomodoro = usePomodoroStore.getState();
        pomodoro.setWidgetOpen(true);
        if (!pomodoro.isRunning) {
          pomodoro.startTimer();
        }
        toast.success("Timer Pomodoro 25 menit dimulai! Selamat fokus");
        break;
      }

      case "open_task_modal": {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("felys-open-task-modal"));
        }
        break;
      }

      case "open_finance_modal": {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("felys-open-finance-modal"));
        }
        break;
      }

      case "navigate_courses": {
        if (typeof window !== "undefined") {
          window.location.href = "/academic/courses";
        }
        break;
      }

      case "navigate_budget": {
        if (typeof window !== "undefined") {
          window.location.href = "/finance";
        }
        break;
      }

      default:
        console.warn("Unknown Fio action:", action);
    }
  }

  /**
   * Mendeteksi aksi yang relevan dari teks jawaban Fio untuk dibuatkan tombol interaktif otomatis
   */
  public static detectActions(text: string): FioActionButton[] {
    const lower = text.toLowerCase();
    const actions: FioActionButton[] = [];

    // Deteksi Pomodoro / Belajar fokus
    if (lower.includes("pomodoro") || lower.includes("cicil tugas") || lower.includes("fokus 25 menit")) {
      actions.push({
        label: "Mulai Pomodoro 25m",
        action: "start_pomodoro",
        icon: "timer",
      });
    }

    // Deteksi Catat Transaksi / Hemat / Jajan
    if (
      lower.includes("catat pengeluaran") ||
      lower.includes("simulasi hemat") ||
      lower.includes("kurangi jajan") ||
      lower.includes("beli kopi")
    ) {
      actions.push({
        label: "Catat Pengeluaran",
        action: "open_finance_modal",
        icon: "wallet",
      });
    }

    // Deteksi Tambah Tugas / Deadline
    if (lower.includes("tambah tugas") || lower.includes("buat tugas baru") || lower.includes("tugas baru")) {
      actions.push({
        label: "Tambah Tugas Baru",
        action: "open_task_modal",
        icon: "plus",
      });
    }

    // Hindari duplikasi
    return actions.slice(0, 2);
  }
}
