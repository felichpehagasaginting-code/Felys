import { Task } from "@/types/academic";
import { Budget, MonthlyBudgetSummary, DailyAllowanceSummary } from "@/types/finance";

/**
 * P8: Skill deterministik Fio — jawaban angka memakai data real,
 * bukan halusinasi LLM. LLM dipakai untuk bahasa, skill ini untuk fakta.
 */
export class FioSkills {
  /** "Boleh jajan Rp X?" — cek daily remaining + budget kategori + tagihan. */
  static canISpend(params: {
    amount: number;
    categoryId?: string;
    summary: MonthlyBudgetSummary;
    daily: DailyAllowanceSummary;
  }): { allowed: boolean; message: string } {
    const { amount, categoryId, summary, daily } = params;
    if (amount <= 0) return { allowed: false, message: "Nominal harus lebih dari 0." };
    const cat = categoryId ? summary.categories.find((c) => c.categoryId === categoryId) : undefined;
    if (cat && cat.monthlyLimit > 0 && cat.spentAmount + amount > cat.monthlyLimit) {
      const over = cat.spentAmount + amount - cat.monthlyLimit;
      return {
        allowed: false,
        message: `Jangan dulu — kalau jajan Rp ${amount.toLocaleString("id-ID")}, budget ${cat.categoryName} jebol Rp ${over.toLocaleString("id-ID")}. Sisa hari ini tinggal Rp ${daily.todayRemaining.toLocaleString("id-ID")}.`,
      };
    }
    if (daily.todayRemaining - amount < 0) {
      return {
        allowed: false,
        message: `Sisa jatah hari ini Rp ${daily.todayRemaining.toLocaleString("id-ID")}, sedangkan kamu mau pakai Rp ${amount.toLocaleString("id-ID")}. Tunda ke besok atau ambil dari jatah darurat ya.`,
      };
    }
    return {
      allowed: true,
      message: `Boleh! Sisa jatah hari ini Rp ${daily.todayRemaining.toLocaleString("id-ID")}, setelah pakai Rp ${amount.toLocaleString("id-ID")} masih sisa Rp ${(daily.todayRemaining - amount).toLocaleString("id-ID")} untuk ${daily.remainingDays} hari ke depan.`,
    };
  }

  /** Bagi estimasi jam tugas ke sisa hari sebelum deadline. */
  static planTasks(tasks: Task[]): { taskId: string; title: string; hoursPerDay: number; daysLeft: number }[] {
    const now = new Date();
    return tasks
      .filter((t) => t.status !== "done")
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 5)
      .map((t) => {
        const daysLeft = Math.max(1, Math.ceil((new Date(t.deadline).getTime() - now.getTime()) / 86400_000));
        const total = t.estimatedHours || 3;
        return { taskId: t.id, title: t.title, daysLeft, hoursPerDay: Math.round((total / daysLeft) * 10) / 10 };
      });
  }

  /** Simulasi: kalau potong kategori X sebesar Y%, burn-date mundur berapa hari. */
  static simulateSaving(params: {
    cutCategoryId: string;
    cutPct: number; // 0-100
    summary: MonthlyBudgetSummary;
    dailyBurnRate: number;
  }): string {
    const { cutCategoryId, cutPct, summary, dailyBurnRate } = params;
    const cat = summary.categories.find((c) => c.categoryId === cutCategoryId);
    if (!cat) return "Kategori tidak ditemukan.";
    const saved = Math.round(cat.spentAmount * (cutPct / 100));
    if (dailyBurnRate <= 0) return `Kamu hemat Rp ${saved.toLocaleString("id-ID")} dari ${cat.categoryName}.`;
    const extraDays = Math.floor(saved / dailyBurnRate);
    return `Potong ${cat.categoryName} ${cutPct}% (~Rp ${saved.toLocaleString("id-ID")}) bikin dompet tahan ~${extraDays} hari lebih lama.`;
  }
}
