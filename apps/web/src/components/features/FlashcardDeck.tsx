/**
 * FlashcardDeck — swipeable card stack (Framer Motion drag), flip animation,
 * "again / hard / good / easy" ratings feeding the backend's SM-2 scheduler.
 */
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/axios-client";
import type { ReviewItemDto } from "@/types";
import { SPRING_INTERACTIVE } from "@/lib/animations";
import { Button } from "@/components/ui/Button";

export function FlashcardDeck({ items }: { items: ReviewItemDto[] }): JSX.Element {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [exitDirection, setExitDirection] = useState(0);

  const current = items[index];

  const rate = (rating: "again" | "hard" | "good" | "easy"): void => {
    if (!current) return;
    void api.post(`/review/${current.id}/rate`, { rating }).catch(() => undefined);
    setExitDirection(rating === "again" ? -1 : 1);
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  if (!current) {
    return (
      <div className="border-2 border-black bg-white p-10 text-center shadow-brutal dark:border-white dark:bg-neutral-900">
        <p className="font-display text-3xl font-black uppercase">Queue clear</p>
        <p className="mt-2 opacity-70">No reviews due right now. Your memory is bulletproof today.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-2 text-center font-tech text-xs uppercase tracking-widest opacity-70">
        {items.length - index} remaining · {current.topicName}
      </p>

      <AnimatePresence mode="wait">
        <motion.button
          key={current.id}
          type="button"
          onClick={() => setFlipped((f) => !f)}
          initial={{ opacity: 0, x: 80 * exitDirection, rotate: exitDirection * 6 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          exit={{ opacity: 0, x: -160 * exitDirection, rotate: exitDirection * -10 }}
          transition={SPRING_INTERACTIVE}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={(_, info) => {
            if (info.offset.x < -120) rate("again");
            else if (info.offset.x > 120) rate("good");
          }}
          className="block min-h-[280px] w-full border-2 border-black bg-white p-8 text-center shadow-brutal dark:border-white dark:bg-neutral-900"
          aria-label={flipped ? "Review card answer" : "Review card question, click to flip"}
        >
          <p className="font-tech text-[10px] uppercase tracking-widest text-crimson">
            {flipped ? "Answer" : "Prompt"}
          </p>
          <p className="mt-6 text-xl font-medium">{current.conceptName}</p>
          {flipped && (
            <p className="mt-4 text-sm opacity-75">
              Rate your recall below. Intervals follow the SM-2 schedule.
            </p>
          )}
          {!flipped && <p className="mt-8 font-tech text-xs uppercase opacity-50">Tap to flip</p>}
        </motion.button>
      </AnimatePresence>

      <div className="mt-6 grid grid-cols-4 gap-2">
        <Button variant="primary" onClick={() => rate("again")} aria-label="Rate: again">
          Again
        </Button>
        <Button variant="outline" onClick={() => rate("hard")} aria-label="Rate: hard">
          Hard
        </Button>
        <Button variant="secondary" onClick={() => rate("good")} aria-label="Rate: good">
          Good
        </Button>
        <Button variant="mastery" onClick={() => rate("easy")} aria-label="Rate: easy">
          Easy
        </Button>
      </div>
    </div>
  );
}
