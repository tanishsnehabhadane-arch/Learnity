"use client";

import { use, useCallback, useState } from "react";
import { api } from "@/lib/axios-client";
import { QuizEngine } from "@/components/features/QuizEngine";
import type { AttemptFeedback, QuizStartResponse } from "@/types";

export default function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const [session, setSession] = useState<QuizStartResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AttemptFeedback | null>(null);

  const start = useCallback(async () => {
    try {
      const res = await api.post<QuizStartResponse>("/quiz/adaptive/start", {
        conceptIds: quizId.startsWith("concept:") ? [quizId.slice(8)] : undefined,
      });
      setSession(res.data);
    } catch {
      setError("Could not start the quiz — is your diagnostic done and the API seeded?");
    }
  }, [quizId]);

  if (session) {
    return (
      <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-24 pt-24">
        <QuizEngine
          sessionId={session.sessionId}
          firstItem={session.firstItem}
          mode="adaptive"
          onComplete={(fb) => setFeedback(fb)}
        />
      </main>
    );
  }

  return (
    <main id="main" className="mx-auto flex min-h-[60dvh] w-full max-w-3xl flex-col items-center justify-center px-4 pt-24 text-center">
      {feedback ? (
        <>
          <h1 className="font-display text-5xl font-black uppercase">Session complete</h1>
          <p className="mt-3 opacity-75">Your learning path has been recomputed. Check the dashboard for what's next.</p>
        </>
      ) : (
        <>
          <h1 className="font-display text-5xl font-black uppercase">Adaptive practice</h1>
          <p className="mt-3 max-w-md opacity-75">
            Difficulty ratchets with your performance: two in a row moves you up, two misses
            brings it back and offers an AI explanation.
          </p>
          <button
            type="button"
            onClick={() => void start()}
            className="mt-8 inline-flex h-12 items-center border-2 border-black bg-crimson px-6 font-tech text-sm font-bold uppercase text-white shadow-brutal dark:border-white"
          >
            Start session
          </button>
          {error && <p role="alert" className="mt-4 text-sm text-crimson">{error}</p>}
        </>
      )}
    </main>
  );
}
