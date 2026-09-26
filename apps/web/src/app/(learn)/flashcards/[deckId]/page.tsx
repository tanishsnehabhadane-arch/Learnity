"use client";

import { useEffect } from "react";
import { usePlannerStore } from "@/store/usePlannerStore";
import { FlashcardDeck } from "@/components/features/FlashcardDeck";

export default function FlashcardsPage() {
  const { dueReviews, loadDueReviews } = usePlannerStore();

  useEffect(() => {
    void loadDueReviews();
  }, [loadDueReviews]);

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-24 pt-24">
      <h1 className="font-display text-5xl font-black uppercase">Flashcards</h1>
      <p className="mt-2 font-tech text-xs uppercase tracking-widest opacity-70">
        Swipe or rate — SM-2 decides when you'll see each card again
      </p>
      <div className="mt-10">
        <FlashcardDeck items={dueReviews} />
      </div>
    </main>
  );
}
