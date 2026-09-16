import { describe, it, expect } from "vitest";
import { FinancialProjectionService } from "./financial-projection.service";

describe("FinancialProjectionService", () => {
  it("calculates accurate goal timeline based on daily savings rate", () => {
    // Rp 500.000 current, Rp 1.000.000 target, Rp 10.000 / day
    // Remaining: 500.000 -> 50 days needed
    const timeline = FinancialProjectionService.calculateGoalTimeline(
      500000,
      1000000,
      10000
    );

    expect(timeline.remainingAmount).toBe(500000);
    expect(timeline.daysNeeded).toBe(50);
  });

  it("simulates days saved with extra daily savings", () => {
    // Rp 0 current, Rp 300.000 target, base 10.000/day (30 days) -> extra 5.000/day (15.000/day = 20 days)
    // Saved: 10 days
    const simulation = FinancialProjectionService.simulateDaysSaved(
      0,
      300000,
      10000,
      5000
    );

    expect(simulation.originalDays).toBe(30);
    expect(simulation.newDays).toBe(20);
    expect(simulation.daysSaved).toBe(10);
  });

  it("compares investment returns over time", () => {
    const comparison = FinancialProjectionService.compareVehicles(100000, 12);

    expect(comparison.length).toBe(3);
    const cash = comparison.find((c) => c.name.includes("Kas"));
    const rdpu = comparison.find((c) => c.name.includes("RDPU"));
    const gold = comparison.find((c) => c.name.includes("Emas"));

    expect(cash?.gain).toBe(0);
    expect(rdpu?.gain).toBeGreaterThan(0);
    expect(gold?.gain).toBeGreaterThan(rdpu!.gain);
  });
});
