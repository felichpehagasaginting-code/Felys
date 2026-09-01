import { differenceInDays, differenceInHours } from "date-fns";
import { PriorityLevel } from "@/types/academic";

/**
 * AI-LOGIC.md Section 2 implementation: Urgency Score Calculation Engine
 */
export class UrgencyService {
  private static readonly W1 = 0.5; // Bobot Deadline
  private static readonly W2 = 0.3; // Bobot Prioritas Manual
  private static readonly W3 = 0.2; // Bobot Estimasi Beban Kerja

  /**
   * Hitung deadlineFactor (0 - 100)
   */
  public static calculateDeadlineFactor(deadline: Date | string): number {
    const deadlineDate = typeof deadline === "string" ? new Date(deadline) : deadline;
    const now = new Date();
    const daysLeft = differenceInDays(deadlineDate, now);
    const hoursLeft = differenceInHours(deadlineDate, now);

    if (hoursLeft <= 24) {
      return 100; // <= 1 hari
    }
    if (daysLeft <= 3) {
      return 80; // 2-3 hari
    }
    if (daysLeft <= 7) {
      return 50; // 4-7 hari
    }
    if (daysLeft <= 14) {
      return 25; // 8-14 hari
    }
    return 10; // > 14 hari
  }

  /**
   * Hitung priorityFactor (0 - 100)
   */
  public static calculatePriorityFactor(priority: PriorityLevel): number {
    switch (priority) {
      case "high":
        return 100;
      case "medium":
        return 60;
      case "low":
        return 30;
      default:
        return 60;
    }
  }

  /**
   * Hitung effortFactor (0 - 100)
   */
  public static calculateEffortFactor(
    estimatedHours?: number | null,
    deadline?: Date | string
  ): number {
    if (!estimatedHours || estimatedHours <= 0) {
      return 50; // Netral default
    }

    if (!deadline) {
      return Math.min(100, Math.max(10, estimatedHours * 10));
    }

    const deadlineDate = typeof deadline === "string" ? new Date(deadline) : deadline;
    const now = new Date();
    const hoursRemaining = Math.max(1, differenceInHours(deadlineDate, now));

    // Rasio jam estimasi kerja dibanding sisa jam sebelum deadline
    const ratio = estimatedHours / hoursRemaining;

    if (ratio >= 0.5) return 100; // butuh >= 50% dari seluruh sisa waktu
    if (ratio >= 0.25) return 80;
    if (ratio >= 0.1) return 60;
    return 40;
  }

  /**
   * Hitung Total Urgency Score (0 - 100)
   */
  public static calculateScore(params: {
    deadline: Date | string;
    priority: PriorityLevel;
    estimatedHours?: number | null;
  }): number {
    const df = this.calculateDeadlineFactor(params.deadline);
    const pf = this.calculatePriorityFactor(params.priority);
    const ef = this.calculateEffortFactor(params.estimatedHours, params.deadline);

    const score = (this.W1 * df) + (this.W2 * pf) + (this.W3 * ef);
    return Math.round(score * 10) / 10; // 1 desimal
  }
}
