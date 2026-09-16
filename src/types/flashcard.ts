export type FlashcardRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface FlashcardItem {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  interval: number; // in days
  repetition: number;
  easeFactor: number; // default 2.5
  dueDate: string; // ISO string
  lastReviewedAt?: string;
}

export interface FlashcardDeck {
  id: string;
  courseId?: string;
  courseName?: string;
  title: string;
  description?: string;
  cards: FlashcardItem[];
  createdAt: string;
  updatedAt: string;
}
