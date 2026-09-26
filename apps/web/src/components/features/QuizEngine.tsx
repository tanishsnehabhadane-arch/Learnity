/**
 * QuizEngine — shared engine for diagnostic and adaptive practice sessions.
 * Server drives item selection; client animates: correct → green flash +
 * micro-confetti (400ms), incorrect → red shake (250ms), gap → banner.
 */
"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/axios-client";
import type { AttemptFeedback, PresentedQuestion } from "@/types";
import { Button } from "@/components/ui/Button";
import { SPRING_INTERACTIVE } from "@/lib/animations";
import { useQuizStore } from "@/store/useQuizStore";
import { useUIStore } from "@/store/useUIStore";
import { AlertTriangle, Check } from "lucide-react";

export interface QuizEngineProps {
  sessionId: string;
  firstItem: PresentedQuestion;
  /** "diagnostic" posts to /assessments/diagnostic, "adaptive" to /quiz/adaptive. */
  mode: "diagnostic" | "adaptive";
  /** Called when the server ends the session. */
  onComplete?: (feedback: AttemptFeedback) => void;
}

interface AnswerResponse {
  nextItem: PresentedQuestion | null;
  completed: boolean;
  lastAttempt: AttemptFeedback;
  calibration?: { theta: number; se: number; itemsAdministered: number };
  intervention?: boolean;
}

export function QuizEngine({ sessionId, firstItem, mode, onComplete }: QuizEngineProps): JSX.Element {
  const [item, setItem] = useState<PresentedQuestion>(firstItem);
  const [selected, setSelected] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [feedback, setFeedback] = useState<AttemptFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showGapBanner, setShowGapBanner] = useState(false);
  const [awaitingConfidence, setAwaitingConfidence] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);

  const startedAt = useRef(Date.now());
  const pendingNext = useRef<AnswerResponse | null>(null);
  const reduceFeedback = useUIStore((s) => s.reduceFeedbackIntensity);
  const addDetectedGap = useQuizStore((s) => s.addDetectedGap);
  const setDifficulty = useQuizStore((s) => s.setDifficulty);

  const url = mode === "diagnostic" ? "/assessments/diagnostic" : "/quiz/adaptive";

  const submit = useCallback(
    async (answer: string) => {
      if (submitting || feedback) return;
      setSubmitting(true);
      setSelected(answer);
      try {
        const res = await api.post<AnswerResponse>(`${url}/${sessionId}/answer`, {
          questionId: item.questionId,
          answer,
          responseTimeMs: Date.now() - startedAt.current,
        });
        const fb = res.data.lastAttempt;
        setFeedback(fb);
        setAnsweredCount((c) => c + 1);
        setDifficulty(item.difficulty);
        pendingNext.current = res.data;
        if (fb.gapFlagged) {
          addDetectedGap(item.conceptId);
          setShowGapBanner(true);
          window.setTimeout(() => setShowGapBanner(false), 4_000);
        }
        setAwaitingConfidence(true);
      } finally {
        setSubmitting(false);
      }
    },
    [addDetectedGap, feedback, item.conceptId, item.difficulty, item.questionId, sessionId, submitting, url],
  );

  /** Confidence strip doubles as "continue" — the server already has the next item. */
  const continueToNext = useCallback(
    (rating: 1 | 2 | 3 | 4 | 5) => {
      setAwaitingConfidence(false);
      setFeedback(null);
      setSelected(null);
      setTextAnswer("");
      startedAt.current = Date.now();

      const pending = pendingNext.current;
      pendingNext.current = null;
      if (!pending) return;
      if (pending.completed || pending.nextItem === null) {
        onComplete?.(pending.lastAttempt);
      } else {
        setItem(pending.nextItem);
      }
    },
    [onComplete],
  );

  return (
    <div className="relative">
      <div className="mb-6 flex items-center justify-between font-tech text-xs uppercase tracking-wider">
        <span>Difficulty {item.difficulty}/10</span>
        <span>{answeredCount} answered</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.article
          key={item.questionId}
          initial={{ opacity: 0, y: 24 }}
          animate={{
            opacity: 1,
            y: 0,
            x: feedback && !feedback.isCorrect && !reduceFeedback ? [-6, 6, -4, 4, 0] : 0,
          }}
          exit={{ opacity: 0, y: -24 }}
          transition={SPRING_INTERACTIVE}
          className="relative border-2 border-black bg-white p-8 shadow-brutal dark:border-white dark:bg-neutral-900"
        >
          {feedback?.isCorrect && <ConfettiBurst reduced={reduceFeedback} />}

          <p className="font-tech text-xs uppercase tracking-widest text-crimson">Question</p>
          <h2 className="mt-2 text-xl font-medium leading-relaxed">{item.body}</h2>

          {item.type === "mcq" ? (
            <div className="mt-6 grid gap-3">
              {(item.choices ?? []).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  disabled={feedback !== null || submitting}
                  onClick={() => void submit(choice)}
                  className={[
                    "min-h-12 border-2 px-4 py-3 text-left text-sm transition-colors",
                    "border-black dark:border-white",
                    selected === choice
                      ? feedback?.isCorrect
                        ? "bg-mastery text-black"
                        : "bg-crimson text-white"
                      : "bg-white hover:bg-electric/10 dark:bg-neutral-900",
                  ].join(" ")}
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <form
              className="mt-6 flex gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (textAnswer.trim()) void submit(textAnswer.trim());
              }}
            >
              <input
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={feedback !== null || submitting}
                className="h-12 flex-1 border-2 border-black px-3 font-mono dark:border-white"
                aria-label="Your answer"
              />
              <Button type="submit" loading={submitting}>
                Submit
              </Button>
            </form>
          )}

          <AnimatePresence>
            {awaitingConfidence && feedback && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 border-t-2 border-black pt-4 dark:border-white"
              >
                <p className="font-tech text-xs uppercase tracking-wider">
                  {feedback.isCorrect ? "Correct." : "Not quite."} How confident were you? (1 = guess, 5 = sure)
                </p>
                <div className="mt-2 flex gap-2">
                  {([1, 2, 3, 4, 5] as const).map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => continueToNext(rating)}
                      className="h-11 w-11 border-2 border-black font-tech font-bold hover:bg-electric hover:text-white dark:border-white"
                      aria-label={`Confidence ${rating}, continue`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.article>
      </AnimatePresence>

      <AnimatePresence>
        {showGapBanner && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={SPRING_INTERACTIVE}
            role="alert"
            className="fixed inset-x-0 top-20 z-[80] mx-auto w-fit border-2 border-black bg-gap px-6 py-3 font-display text-lg font-black uppercase shadow-brutal dark:border-white"
          >
            <AlertTriangle className="mr-2 inline h-5 w-5" aria-hidden />
            Gap detected — your path will adjust
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Micro-confetti: purposeful, 400ms, respects reduced-feedback setting. */
function ConfettiBurst({ reduced }: { reduced: boolean }): JSX.Element {
  if (reduced) {
    return (
      <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center border-2 border-black bg-mastery dark:border-white">
        <Check className="h-5 w-5" aria-hidden />
      </span>
    );
  }
  return (
    <span className="absolute right-4 top-4" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 1, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            x: Math.cos((i / 8) * Math.PI * 2) * 40,
            y: Math.sin((i / 8) * Math.PI * 2) * 40,
          }}
          transition={{ duration: 0.4 }}
          className="absolute h-2 w-2 bg-mastery"
        />
      ))}
      <Check className="relative h-6 w-6 text-mastery" aria-hidden />
    </span>
  );
}
