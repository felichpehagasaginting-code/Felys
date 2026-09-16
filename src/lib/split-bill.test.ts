import { describe, it, expect } from "vitest";
import { calculateProportionalSplit } from "./split-bill";

describe("calculateProportionalSplit", () => {
  it("calculates proportional tax and service charges correctly", () => {
    const participants = [
      { id: "1", name: "Budi", subtotal: 30000, items: "Ayam Bakar" },
      { id: "2", name: "Sari", subtotal: 10000, items: "Es Teh & Tahu" },
    ];

    // Tax 10%, Service 5%
    // Subtotal: 40.000
    // Tax: 4.000 (Budi pays 75% = 3.000, Sari pays 25% = 1.000)
    // Service: 2.000 (Budi pays 1.500, Sari pays 500)
    // Budi total: 34.500
    // Sari total: 11.500
    // Grand total: 46.000
    const result = calculateProportionalSplit(participants, 10, 5);

    expect(result.subtotal).toBe(40000);
    expect(result.taxAmount).toBe(4000);
    expect(result.serviceAmount).toBe(2000);
    expect(result.grandTotal).toBe(46000);

    const budi = result.results.find((r) => r.name === "Budi");
    const sari = result.results.find((r) => r.name === "Sari");

    expect(budi?.total).toBe(34500);
    expect(sari?.total).toBe(11500);
  });

  it("handles zero subtotal gracefully", () => {
    const result = calculateProportionalSplit([], 11, 0);
    expect(result.grandTotal).toBe(0);
    expect(result.results.length).toBe(0);
  });
});
