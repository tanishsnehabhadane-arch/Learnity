"use client";

import { useEffect } from "react";
import { usePlannerStore } from "@/store/usePlannerStore";
import { FlashcardDeck } from "@/components/features/FlashcardDeck";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function PlannerPage() {
  const { dueReviews, loadDueReviews, scheduleSession, scheduledSessions } = usePlannerStore();

  useEffect(() => {
    void loadDueReviews();
  }, [loadDueReviews]);

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-24 pt-24">
      <h1 className="font-display text-5xl font-black uppercase">Study planner</h1>
      <p className="mt-2 font-tech text-xs uppercase tracking-widest opacity-70">
        Spaced repetition · SM-2 scheduling
      </p>

      <section className="mt-8" aria-labelledby="review-queue-heading">
        <h2 id="review-queue-heading" className="font-tech text-sm font-bold uppercase">Review queue</h2>
        <div className="mt-4">
          <FlashcardDeck items={dueReviews} />
        </div>
      </section>

      <section className="mt-10 border-2 border-black bg-white p-6 shadow-brutal dark:border-white dark:bg-neutral-900" aria-labelledby="schedule-heading">
        <h2 id="schedule-heading" className="font-tech text-sm font-bold uppercase">Schedule a session</h2>
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const conceptId = String(form.get("conceptId") ?? "");
            const scheduledFor = new Date(String(form.get("scheduledFor") ?? "")).toISOString();
            if (conceptId && !Number.isNaN(Date.parse(scheduledFor))) {
              void scheduleSession(conceptId, scheduledFor);
            }
          }}
        >
          <Input label="Concept ID" name="conceptId" required className="w-64" />
          <Input label="When" name="scheduledFor" type="datetime-local" required className="w-64" />
          <Button type="submit">Schedule</Button>
        </form>
        {scheduledSessions.length > 0 && (
          <ul className="mt-4 space-y-1 font-tech text-xs uppercase">
            {scheduledSessions.map((s, i) => (
              <li key={i}>▸ {s.conceptId} @ {new Date(s.scheduledFor).toLocaleString()}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
