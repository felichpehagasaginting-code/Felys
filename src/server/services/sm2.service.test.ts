import { describe, it, expect } from "vitest";
import { SM2Service } from "./sm2.service";
import { FlashcardItem } from "@/types/flashcard";

describe("SM2Service", () => {
  const baseCard: FlashcardItem = {
    id: "card-1",
    question: "Apa itu kompleksitas waktu Binary Search?",
    answer: "O(log n)",
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  };

  it("resets repetition and sets interval to 1 on failed recall (rating < 3)", () => {
    const reviewed = SM2Service.reviewCard(
      { ...baseCard, repetition: 3, interval: 10 },
      1 // Again
    );

    expect(reviewed.repetition).toBe(0);
    expect(reviewed.interval).toBe(1);
    expect(reviewed.easeFactor).toBeLessThanOrEqual(2.5);
  });

  it("advances interval to 1 on first successful recall (repetition 0 -> 1)", () => {
    const reviewed = SM2Service.reviewCard(baseCard, 3); // Good

    expect(reviewed.repetition).toBe(1);
    expect(reviewed.interval).toBe(1);
  });

  it("advances interval to 6 on second successful recall (repetition 1 -> 2)", () => {
    const step1 = SM2Service.reviewCard(baseCard, 3);
    const step2 = SM2Service.reviewCard(step1, 4); // Easy

    expect(step2.repetition).toBe(2);
    expect(step2.interval).toBe(6);
  });

  it("scales interval exponentially on subsequent successful recalls", () => {
    const step1 = SM2Service.reviewCard(baseCard, 3); // interval 1
    const step2 = SM2Service.reviewCard(step1, 3); // interval 6
    const step3 = SM2Service.reviewCard(step2, 4); // 6 * ~2.6 = ~16

    expect(step3.repetition).toBe(3);
    expect(step3.interval).toBeGreaterThanOrEqual(15);
  });
});
