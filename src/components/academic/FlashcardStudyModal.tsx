"use client";

import React, { useState } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FlashcardItem, FlashcardRating } from "@/types/flashcard";
import { SM2Service } from "@/server/services/sm2.service";
import { triggerHaptic } from "@/lib/haptics";
import { playPop } from "@/lib/sounds";
import confetti from "canvas-confetti";
import {
  Sparkles,
  RotateCw,
  CheckCircle2,
  Brain,
  HelpCircle,
  X,
  ChevronRight,
  Flame,
  BookOpen,
} from "lucide-react";

interface FlashcardStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckTitle: string;
  cards: FlashcardItem[];
  onSaveProgress?: (updatedCards: FlashcardItem[]) => void;
}

export function FlashcardStudyModal({
  isOpen,
  onClose,
  deckTitle,
  cards: initialCards,
  onSaveProgress,
}: FlashcardStudyModalProps) {
  const [cards, setCards] = useState<FlashcardItem[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Synchronize when initialCards changes
  React.useEffect(() => {
    setCards(initialCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  }, [initialCards]);

  if (!isOpen) return null;

  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? Math.round(((currentIndex + (isFinished ? 1 : 0)) / cards.length) * 100) : 0;

  const handleFlip = () => {
    triggerHaptic("light");
    playPop();
    setIsFlipped(!isFlipped);
  };

  const handleRating = (rating: FlashcardRating) => {
    triggerHaptic(rating >= 3 ? "success" : "medium");

    if (!currentCard) return;

    // Apply SuperMemo-2 algorithm
    const updatedCard = SM2Service.reviewCard(currentCard, rating);
    const newCards = [...cards];
    newCards[currentIndex] = updatedCard;
    setCards(newCards);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      onSaveProgress?.(newCards);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-lg w-[92vw] p-5 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#EDE5FF] dark:bg-[#342A45] text-[#7C5CFA] flex items-center justify-center shadow-xs shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-foreground truncate">
                {deckTitle || "Sesi Belajar Flashcard"}
              </h3>
              <p className="text-xs text-muted">
                Metode Active Recall & Spaced Repetition (SM-2)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted font-semibold">
            <span>
              {isFinished ? "Selesai!" : `Kartu ${currentIndex + 1} dari ${cards.length}`}
            </span>
            <span className="font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-surface border border-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7C5CFA] via-[#B69CFF] to-[#7FE3C0] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {!isFinished && currentCard ? (
          <div className="space-y-4 pt-1">
            {/* 3D Flashcard Box */}
            <div
              onClick={handleFlip}
              className="min-h-[220px] sm:min-h-[260px] p-6 rounded-3xl bg-surface border-2 border-border shadow-soft hover:shadow-md cursor-pointer transition-all flex flex-col justify-between select-none relative group"
            >
              {/* Badge Top */}
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className={`px-2.5 py-0.5 rounded-full ${
                  isFlipped
                    ? "bg-[#E0FBF2] dark:bg-[#1E332A] text-[#1F8766] dark:text-[#7FE3C0]"
                    : "bg-[#EDE5FF] dark:bg-[#342A45] text-[#7C5CFA]"
                }`}>
                  {isFlipped ? "💡 Jawaban & Konsep Kunci" : "❓ Pertanyaan Ujian"}
                </span>
                <span className="text-muted flex items-center gap-1 group-hover:text-foreground transition-colors">
                  <RotateCw className="w-3 h-3" />
                  <span>Klik untuk membalik</span>
                </span>
              </div>

              {/* Card Content */}
              <div className="py-4 my-auto text-center space-y-3">
                <p className="text-base sm:text-lg font-bold text-foreground leading-relaxed">
                  {isFlipped ? currentCard.answer : currentCard.question}
                </p>
                {isFlipped && currentCard.explanation && (
                  <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto bg-black/5 dark:bg-white/5 p-2.5 rounded-xl">
                    ℹ️ {currentCard.explanation}
                  </p>
                )}
              </div>

              {/* Footer hint */}
              <div className="text-center text-[10px] text-muted font-medium">
                {isFlipped
                  ? "Seberapa mudah kamu mengingat ini tadi?"
                  : "Coba tebak jawabannya dalam pikiranmu sebelum membalik kartu."}
              </div>
            </div>

            {/* Answer Ratings (Only shown when flipped) */}
            {isFlipped ? (
              <div className="space-y-1.5 animate-in fade-in-50">
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRating(1)}
                    className="p-2.5 rounded-2xl bg-[#FFE8EA] dark:bg-[#361E22] text-[#D93D4A] hover:brightness-95 active:scale-95 transition-all text-xs font-bold flex flex-col items-center gap-0.5 shadow-xs"
                  >
                    <span>Lupa 🔄</span>
                    <span className="text-[10px] opacity-80 font-normal">Besok diulang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRating(2)}
                    className="p-2.5 rounded-2xl bg-[#FFF4E5] dark:bg-[#3A2A1A] text-[#B86B14] dark:text-[#F3A536] hover:brightness-95 active:scale-95 transition-all text-xs font-bold flex flex-col items-center gap-0.5 shadow-xs"
                  >
                    <span>Sulit ⏱️</span>
                    <span className="text-[10px] opacity-80 font-normal">2 hari lagi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRating(3)}
                    className="p-2.5 rounded-2xl bg-[#E8F4FD] dark:bg-[#1A2D3E] text-[#1E70B8] dark:text-[#6AB3ED] hover:brightness-95 active:scale-95 transition-all text-xs font-bold flex flex-col items-center gap-0.5 shadow-xs"
                  >
                    <span>Baik 👍</span>
                    <span className="text-[10px] opacity-80 font-normal">Ingat jelas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRating(4)}
                    className="p-2.5 rounded-2xl bg-[#E0FBF2] dark:bg-[#1A3328] text-[#1F8766] dark:text-[#7FE3C0] hover:brightness-95 active:scale-95 transition-all text-xs font-bold flex flex-col items-center gap-0.5 shadow-xs"
                  >
                    <span>Mudah ⚡</span>
                    <span className="text-[10px] opacity-80 font-normal">Sangat paham</span>
                  </button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="academic"
                size="md"
                onClick={handleFlip}
                className="w-full rounded-2xl font-bold flex items-center justify-center gap-2 shadow-soft"
              >
                <span>Lihat Kunci Jawaban</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          /* Finished State */
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-[#E0FBF2] text-[#1F8766] flex items-center justify-center mx-auto shadow-soft">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-foreground">
                Sesi Belajar Selesai! 🎉
              </h4>
              <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                Kamu telah menyelesaikan review {cards.length} kartu konsep kuliah. Algoritma SM-2 telah menjadwalkan tanggal pengulangan berikutnya agar memorimu tahan lama!
              </p>
            </div>
            <Button
              type="button"
              variant="academic"
              size="md"
              onClick={onClose}
              className="rounded-2xl font-bold px-6 shadow-soft"
            >
              Kembali ke Dashboard
            </Button>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
