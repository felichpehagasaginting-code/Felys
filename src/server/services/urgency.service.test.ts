import { describe, it, expect } from "vitest";
import { UrgencyService } from "./urgency.service";

function isoInHours(h: number): string {
  return new Date(Date.now() + h * 3600_000).toISOString();
}

describe("UrgencyService", () => {
  it("deadline <=24 jam => 100", () => {
    expect(UrgencyService.calculateDeadlineFactor(isoInHours(5))).toBe(100);
  });
  it("deadline 2-3 hari => 80", () => {
    expect(UrgencyService.calculateDeadlineFactor(isoInHours(60))).toBe(80);
  });
  it("skor total high+dekat > low+jauh", () => {
    const urgent = UrgencyService.calculateScore({ deadline: isoInHours(10), priority: "high", estimatedHours: 4 });
    const chill = UrgencyService.calculateScore({ deadline: isoInHours(24 * 20), priority: "low", estimatedHours: 1 });
    expect(urgent).toBeGreaterThan(chill);
    expect(urgent).toBeLessThanOrEqual(100);
  });
  it("effort default netral 50 bila tanpa estimasi", () => {
    expect(UrgencyService.calculateEffortFactor(null, isoInHours(100))).toBe(50);
  });
  it("rasio beban berat menaikkan effort", () => {
    expect(UrgencyService.calculateEffortFactor(20, isoInHours(24))).toBe(100);
  });
});
