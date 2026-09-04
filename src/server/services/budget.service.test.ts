import { describe, it, expect } from "vitest";
import { BudgetService } from "./budget.service";

describe("BudgetService", () => {
  it("status threshold 70/90/100", () => {
    expect(BudgetService.getBudgetStatus(69)).toBe("safe");
    expect(BudgetService.getBudgetStatus(70)).toBe("attention");
    expect(BudgetService.getBudgetStatus(90)).toBe("warning");
    expect(BudgetService.getBudgetStatus(100)).toBe("overbudget");
  });

  it("monthly summary agregat benar + defisit terdeteksi", () => {
    const s = BudgetService.calculateMonthlySummary({
      month: 9, year: 2026,
      categories: [
        { id: "c1", name: "Makan", icon: "x", color: "#fff", isEssential: true, type: "expense" },
        { id: "c2", name: "Jajan", icon: "x", color: "#fff", isEssential: false, type: "expense" },
      ],
      transactions: [
        { id: "t1", type: "expense", amount: 80000, categoryId: "c2", date: "2026-09-05T10:00:00.000Z", createdAt: "" },
        { id: "t2", type: "income", amount: 50000, categoryId: "c1", date: "2026-09-01T10:00:00.000Z", createdAt: "" },
      ],
      budgets: [{ categoryId: "c2", monthlyLimit: 100000 }],
    });
    expect(s.totalSpent).toBe(80000);
    expect(s.totalIncome).toBe(50000);
    expect(s.isDeficit).toBe(true);
    expect(s.categories.find((c) => c.categoryId === "c2")?.usedPercentage).toBe(80);
  });

  it("daily allowance & burn-rate kritis", () => {
    const s = BudgetService.calculateMonthlySummary({
      month: new Date().getMonth() + 1, year: new Date().getFullYear(),
      categories: [{ id: "c1", name: "Makan", icon: "x", color: "#fff", isEssential: true, type: "expense" }],
      transactions: [
        { id: "t1", type: "expense", amount: 900000, categoryId: "c1", date: new Date().toISOString(), createdAt: "" },
        { id: "t2", type: "income", amount: 1000000, categoryId: "c1", date: new Date().toISOString(), createdAt: "" },
      ],
      budgets: [{ categoryId: "c1", monthlyLimit: 1000000 }],
    });
    const d = BudgetService.calculateDailyAllowance({ summary: s, transactions: [], recurringBills: [] });
    expect(d.dailyAllowance).toBeGreaterThanOrEqual(0);
    expect(d.remainingDays).toBeGreaterThanOrEqual(1);
  });
});
