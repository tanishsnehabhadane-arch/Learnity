"use client";

import { useEffect } from "react";
import { usePlannerStore } from "@/store/usePlannerStore";
import { FlashcardDeck } from "@/components/features/FlashcardDeck";

export default function ReviewPage() {
  const { dueReviews, loadDueReviews } = usePlannerStore();

  useEffect(() => {
    void loadDueReviews();
  }, [loadDueReviews]);

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-24 pt-24">
      <h1 className="font-display text-5xl font-black uppercase">Review queue</h1>
      <div className="mt-10">
        <FlashcardDeck items={dueReviews} />
      </div>
    </main>
  );
}
