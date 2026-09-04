import { BudgetStatus } from "@/types/finance";
import { UrgencyService } from "./urgency.service";

export function budgetIdFor(year: number, month: number, categoryId: string): string {
  return `${year}_${month}_${categoryId}`;
}

export function monthYearFromDate(dateInput: string | Date): { month: number; year: number } {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export function statusFromPct(pct: number): BudgetStatus {
  if (pct >= 100) return "overbudget";
  if (pct >= 90) return "warning";
  if (pct >= 70) return "attention";
  return "safe";
}

/** Server-side urgency recompute helper (P5): pure, testable. */
export function recomputeUrgency(params: {
  deadline: string | Date;
  priority: "low" | "medium" | "high";
  estimatedHours?: number | null;
}): number {
  return UrgencyService.calculateScore(params);
}
