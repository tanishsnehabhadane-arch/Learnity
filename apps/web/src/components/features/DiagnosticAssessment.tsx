/**
 * DiagnosticAssessment — full-screen, distraction-free first-run calibration.
 * Live "calibrating your level" ring (items administered, not fake %), then an
 * animated reveal of the generated learning path.
 */
"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/axios-client";
import type { AttemptFeedback, DiagnosticStartResponse, LearningPathResponse } from "@/types";
import { QuizEngine } from "./QuizEngine";
import { Button } from "@/components/ui/Button";
import { SPRING_INTERACTIVE } from "@/lib/animations";
import Link from "next/link";

export function DiagnosticAssessment({ subjectId }: { subjectId: string }): JSX.Element {
  const [session, setSession] = useState<DiagnosticStartResponse | null>(null);
  const [completedFeedback, setCompletedFeedback] = useState<AttemptFeedback | null>(null);
  const [path, setPath] = useState<LearningPathResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<DiagnosticStartResponse>("/assessments/diagnostic/start", {
        subjectId,
      });
      setSession(res.data);
    } catch {
      setError("Could not start the assessment. Is the API running and seeded?");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  const handleComplete = useCallback(() => {
    setCompletedFeedback((prev) => prev);
    // Wait briefly for the post-diagnostic recompute job, then fetch the path.
    window.setTimeout(() => {
      void api
        .get<LearningPathResponse>("/students/me/learning-path")
        .then((res) => setPath(res.data))
        .catch(() => setPath(null));
    }, 2_500);
  }, []);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-base dark:bg-base" role="dialog" aria-label="Diagnostic assessment">
      <header className="flex items-center justify-between border-b-2 border-black px-6 py-4 dark:border-white">
        <p className="font-tech text-sm font-bold uppercase tracking-widest">Calibration · Algebra I</p>
        <CalibrationRing active={session !== null && completedFeedback === null} />
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-8">
        {!session && (
          <div className="text-center">
            <h1 className="font-display text-5xl font-black uppercase leading-tight md:text-6xl">
              Let's find your <span className="text-crimson">real level</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg opacity-75">
              A handful of adaptive questions — no fixed length. The assessment stops when it
              has a precise picture of your strengths and gaps.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button onClick={() => void start()} loading={loading} size="lg">
                Begin calibration
              </Button>
            </div>
            {error && <p role="alert" className="mt-4 text-sm text-crimson">{error}</p>}
          </div>
        )}

        {session && !path && (
          <QuizEngine
            sessionId={session.sessionId}
            firstItem={session.firstItem}
            mode="diagnostic"
            onComplete={handleComplete}
          />
        )}

        {path && (
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={SPRING_INTERACTIVE}>
            <p className="font-tech text-xs uppercase tracking-[0.3em] text-crimson">Calibrated</p>
            <h2 className="mt-2 font-display text-4xl font-black uppercase">Your path, generated</h2>
            <ol className="mt-8 space-y-3">
              {path.items.slice(0, 6).map((item, index) => (
                <motion.li
                  key={item.conceptId}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...SPRING_INTERACTIVE, delay: index * 0.07 }}
                  className="border-2 border-black bg-white p-4 shadow-brutal-sm dark:border-white dark:bg-neutral-900"
                >
                  <p className="font-tech text-sm font-bold uppercase">
                    {index + 1}. {item.conceptName}
                    <span className="ml-2 text-[10px] text-crimson">{item.kind.replace("_", " ")}</span>
                  </p>
                  <p className="mt-1 text-sm opacity-75">{item.rationale}</p>
                </motion.li>
              ))}
            </ol>
            <div className="mt-8">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center border-2 border-black bg-crimson px-6 font-tech text-sm font-bold uppercase text-white shadow-brutal dark:border-white"
              >
                Go to my dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/** Pulsing ring indicating live calibration (deliberately not a % bar). */
function CalibrationRing({ active }: { active: boolean }): JSX.Element {
  return (
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-black dark:border-white ${active ? "animate-pulse" : ""}`}
      title={active ? "Calibrating your level" : "Idle"}
      role="img"
      aria-label={active ? "Calibrating your level" : "Calibration idle"}
    >
      <span className={`h-3 w-3 rounded-full ${active ? "bg-electric" : "bg-black dark:bg-white"}`} />
    </span>
  );
}
