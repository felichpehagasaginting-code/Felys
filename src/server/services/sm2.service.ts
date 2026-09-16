import { FlashcardItem, FlashcardRating } from "@/types/flashcard";

/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm
 * Maps user grade (1: Again, 2: Hard, 3: Good, 4: Easy) to new interval and ease factor.
 */
export class SM2Service {
  /**
   * Calculates new interval, repetition count, ease factor, and due date.
   */
  public static reviewCard(
    card: FlashcardItem,
    rating: FlashcardRating,
    now: Date = new Date()
  ): FlashcardItem {
    let { interval, repetition, easeFactor } = card;

    // Default fallbacks if initial card
    interval = interval || 0;
    repetition = repetition || 0;
    easeFactor = easeFactor || 2.5;

    if (rating < 3) {
      // Failed recall: reset repetitions, review tomorrow
      repetition = 0;
      interval = 1;
    } else {
      // Successful recall
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetition += 1;
    }

    // Update Ease Factor (EF' = EF + (0.1 - (4 - grade) * (0.08 + (4 - grade) * 0.02)))
    const gradeDistance = 4 - rating;
    const newEaseFactor = Math.max(
      1.3,
      easeFactor + (0.1 - gradeDistance * (0.08 + gradeDistance * 0.02))
    );

    // Calculate Next Due Date
    const nextDueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

    return {
      ...card,
      interval,
      repetition,
      easeFactor: Number(newEaseFactor.toFixed(2)),
      dueDate: nextDueDate.toISOString(),
      lastReviewedAt: now.toISOString(),
    };
  }

  /**
   * Filters cards in a deck that are due for review today.
   */
  public static getDueCards(cards: FlashcardItem[], now: Date = new Date()): FlashcardItem[] {
    const todayIso = now.toISOString();
    return cards.filter((c) => !c.dueDate || c.dueDate <= todayIso);
  }
}
