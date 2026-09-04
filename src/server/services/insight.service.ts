import { Task } from "@/types/academic";
import { Budget } from "@/types/finance";
import { AIInsight } from "@/types/ai";
import { differenceInDays } from "date-fns";

/**
 * AI-LOGIC.md Section 4 & BRANDING.md Section 4: Cross-Mode & AI Insight Engine
 */
export class InsightService {
  /**
   * Evaluasi kondisi Cross-Mode Insight: Korelasi Beban Akademik vs Pengeluaran
   */
  public static evaluateCrossModeInsight(params: {
    tasks: Task[];
    budgets: Budget[];
  }): AIInsight | null {
    const now = new Date();

    // P5 — sesuai AI-LOGIC.md: >=2 task urgency>=80 deadline<=7 hari + >=1 non-esensial >=70%
    const urgentTasks = params.tasks.filter((t) => {
      if (t.status === "done") return false;
      const deadline = new Date(t.deadline);
      const daysLeft = differenceInDays(deadline, now);
      return t.urgencyScore >= 80 && daysLeft <= 7 && daysLeft >= -1;
    });

    // Kondisi 2: kategori non-esensial pemakaian >= 70%
    const overloadedDiscretionary = params.budgets.find(
      (b) => !b.isEssential && b.usedPercentage >= 70
    );

    // Kondisi 3: Total estimasi jam tugas >= 6 jam
    const totalHours = urgentTasks.reduce((acc, t) => acc + (t.estimatedHours || 3), 0);

    if (urgentTasks.length >= 2 && overloadedDiscretionary) {
      const courseNames = Array.from(
        new Set(urgentTasks.map((t) => t.courseName || t.title))
      )
        .slice(0, 2)
        .join(" & ");

      return {
        id: `ins_cross_${Date.now()}`,
        type: "cross_mode",
        title: "Keseimbangan Kuliah & Dompet ⚖️",
        content: `Pekan ini jadwalmu cukup padat (${urgentTasks.length} deadline mepet: ${courseNames}, estimasi ~${totalHours} jam). Budget ${overloadedDiscretionary.categoryName} sudah terpakai ${overloadedDiscretionary.usedPercentage}%. Yuk jaga stamina tanpa boros jajan pesan-antar makanan!`,
        relatedTaskId: urgentTasks[0].id,
        relatedCategoryId: overloadedDiscretionary.categoryId,
        actionCta: {
          label: "Mulai Cicil Tugas",
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
    if (topTask.urgencyScore < 40) return null;

    return {
      id: `ins_task_${Date.now()}`,
      type: "task_recommendation",
      title: "Prioritas Utama Kuliah 🔥",
      content: `Tugas "${topTask.title}" (${topTask.courseName || "Kuliah"}) butuh perhatianmu pertama kali — skor urgensi ${Math.round(topTask.urgencyScore)}/100. Semangat selesaikan lebih awal!`,
      relatedTaskId: topTask.id,
      actionCta: {
        label: "Buka Detail Tugas",
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
      content = `Pengeluaran untuk ${urgentBudget.categoryName} sudah mencapai batas limit bulanan (${urgentBudget.usedPercentage}%). Tetap tenang, yuk alihkan fokus ke kebutuhan esensial ya! 💡`;
    } else if (urgentBudget.usedPercentage >= 90) {
      content = `Sisa anggaran ${urgentBudget.categoryName} tersisa ${100 - urgentBudget.usedPercentage}%. Yuk tahan jajan beberapa hari ke depan agar cashflow tetap aman! ✨`;
    } else {
      content = `Anggaran ${urgentBudget.categoryName} sudah terpakai ${urgentBudget.usedPercentage}%. Pengeluaranmu masih terkendali dengan baik, pertahankan! 👍`;
    }

    return {
      id: `ins_budget_${Date.now()}`,
      type: "budget_alert",
      title: `Monitoring Anggaran: ${urgentBudget.categoryName}`,
      content,
      relatedCategoryId: urgentBudget.categoryId,
      actionCta: {
        label: "Cek Alokasi Budget",
        actionType: "open_budget",
        targetId: urgentBudget.categoryId,
      },
      isDismissed: false,
      createdAt: new Date().toISOString(),
    };
  }
}
