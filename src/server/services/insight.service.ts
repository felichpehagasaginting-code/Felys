import { Task } from "@/types/academic";
import { Budget } from "@/types/finance";
import { AIInsight } from "@/types/ai";
import { differenceInDays } from "date-fns";

/**
 * AI-LOGIC.md Section 4 & BRANDING.md Section 4: Cross-Mode & AI Insight Engine
 */
export class InsightService {
  /**
   * Evaluasi kondisi Cross-Mode Insight
   */
  public static evaluateCrossModeInsight(params: {
    tasks: Task[];
    budgets: Budget[];
  }): AIInsight | null {
    const now = new Date();

    // Kondisi 1: Ada >= 2 task dengan urgencyScore >= 80 dalam 7 hari ke depan
    const urgentTasks = params.tasks.filter((t) => {
      if (t.status === "done") return false;
      const deadline = new Date(t.deadline);
      const daysLeft = differenceInDays(deadline, now);
      return t.urgencyScore >= 80 && daysLeft <= 7 && daysLeft >= -1;
    });

    // Kondisi 2: Ada >= 1 kategori non-esensial dengan pemakaian >= 70%
    const overloadedNonEssential = params.budgets.find(
      (b) => !b.isEssential && b.usedPercentage >= 70
    );

    if (urgentTasks.length >= 2 && overloadedNonEssential) {
      const courseNames = Array.from(new Set(urgentTasks.map((t) => t.courseName || t.title)))
        .slice(0, 2)
        .join(" & ");

      return {
        id: `ins_cross_${Date.now()}`,
        type: "cross_mode",
        title: "Keseimbangan Tugas & Dompet",
        content: `Minggu ini ada ${urgentTasks.length} deadline mepet (${courseNames}). Budget ${overloadedNonEssential.categoryName} juga udah kepake ${overloadedNonEssential.usedPercentage}%, coba direm dulu biar fokus ngerjain tugas 👀`,
        relatedTaskId: urgentTasks[0].id,
        relatedCategoryId: overloadedNonEssential.categoryId,
        actionCta: {
          label: "Mulai Kerjain Tugas",
          actionType: "start_task",
          targetId: urgentTasks[0].id,
        },
        isDismissed: false,
        createdAt: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Task recommendation insight (Top urgent)
   */
  public static generateTaskRecommendation(tasks: Task[]): AIInsight | null {
    const activeTasks = tasks
      .filter((t) => t.status !== "done")
      .sort((a, b) => b.urgencyScore - a.urgencyScore);

    if (activeTasks.length === 0) return null;

    const topTask = activeTasks[0];
    if (topTask.urgencyScore < 50) return null;

    return {
      id: `ins_task_${Date.now()}`,
      type: "task_recommendation",
      title: "Tugas Paling Urgent",
      content: `${topTask.title} (${topTask.courseName || "Kuliah"}) butuh perhatian kamu duluan — skor urgensi ${Math.round(topTask.urgencyScore)}/100 🔥`,
      relatedTaskId: topTask.id,
      actionCta: {
        label: "Buka Tugas",
        actionType: "navigate_task",
        targetId: topTask.id,
      },
      isDismissed: false,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Progressive budget alert insight
   */
  public static generateBudgetAlert(budgets: Budget[]): AIInsight | null {
    // Cari yang overbudget atau warning tertinggi
    const urgentBudget = budgets
      .filter((b) => b.usedPercentage >= 70)
      .sort((a, b) => b.usedPercentage - a.usedPercentage)[0];

    if (!urgentBudget) return null;

    let content = "";
    if (urgentBudget.usedPercentage >= 100) {
      content = `Pengeluaran ${urgentBudget.categoryName} udah tembus limit (${urgentBudget.usedPercentage}%). Tetap santai, tapi prioritaskan kebutuhan esensial ya 💸`;
    } else if (urgentBudget.usedPercentage >= 90) {
      content = `Sisa budget ${urgentBudget.categoryName} tinggal sedikit (${100 - urgentBudget.usedPercentage}% lagi). Ayo direm dikit 😅`;
    } else {
      content = `Budget ${urgentBudget.categoryName} udah terpakai ${urgentBudget.usedPercentage}%. Masih aman tapi tetap dipantau ya!`;
    }

    return {
      id: `ins_budget_${Date.now()}`,
      type: "budget_alert",
      title: `Peringatan Budget: ${urgentBudget.categoryName}`,
      content,
      relatedCategoryId: urgentBudget.categoryId,
      actionCta: {
        label: "Cek Budget",
        actionType: "open_budget",
        targetId: urgentBudget.categoryId,
      },
      isDismissed: false,
      createdAt: new Date().toISOString(),
    };
  }
}
