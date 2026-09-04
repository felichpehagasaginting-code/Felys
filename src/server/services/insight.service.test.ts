import { describe, it, expect } from "vitest";
import { InsightService } from "./insight.service";

function task(id: string, score: number, daysFromNow: number) {
  return {
    id, title: `Tugas ${id}`, courseId: "c1", courseName: "MK",
    deadline: new Date(Date.now() + daysFromNow * 86400_000).toISOString(),
    priority: "high" as const, status: "todo" as const,
    urgencyScore: score, createdAt: "", updatedAt: "",
  };
}

describe("InsightService (P5 thresholds)", () => {
  it("cross-mode muncul bila >=2 urgent>=80 & 1 non-esensial>=70%", () => {
    const r = InsightService.evaluateCrossModeInsight({
      tasks: [task("a", 90, 2), task("b", 85, 3)],
      budgets: [{
        id: "2026_9_c2", categoryId: "c2", monthlyLimit: 100, month: 9, year: 2026,
        spentAmount: 75, remainingAmount: 25, usedPercentage: 75, status: "attention",
      }],
    });
    expect(r).not.toBeNull();
    expect(r?.type).toBe("cross_mode");
  });

  it("tidak muncul bila hanya 1 task urgent (anti-spam)", () => {
    const r = InsightService.evaluateCrossModeInsight({
      tasks: [task("a", 95, 1)],
      budgets: [{
        id: "x", categoryId: "c2", monthlyLimit: 100, month: 9, year: 2026,
        spentAmount: 80, remainingAmount: 20, usedPercentage: 80, status: "attention",
      }],
    });
    expect(r).toBeNull();
  });

  it("budget alert overbudget memberi pesan urgent", () => {
    const r = InsightService.generateBudgetAlert([{
      id: "x", categoryId: "c2", categoryName: "Jajan", monthlyLimit: 100,
      month: 9, year: 2026, spentAmount: 120, remainingAmount: -20,
      usedPercentage: 120, status: "overbudget",
    }]);
    expect(r?.type).toBe("budget_alert");
  });
});
