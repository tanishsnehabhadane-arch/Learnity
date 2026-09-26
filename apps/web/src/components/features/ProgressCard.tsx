/**
 * ProgressCard — dashboard hero card: next recommended topic + why (explainability).
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LearningPathItem } from "@/types";
import { SPRING_INTERACTIVE } from "@/lib/animations";

export function ProgressCard({ item }: { item: LearningPathItem | null }): JSX.Element {
  if (!item) {
    return (
      <div className="border-2 border-black bg-white p-8 shadow-brutal dark:border-white dark:bg-neutral-900">
        <p className="font-tech text-xs uppercase tracking-widest text-crimson">Recommended next</p>
        <h2 className="mt-2 font-display text-4xl font-black uppercase">
          Complete your calibration
        </h2>
        <p className="mt-3 max-w-md opacity-75">
          Take the adaptive diagnostic and Learnity will build a personal path — with a reason
          for every recommendation.
        </p>
        <Link
          href="/diagnostic"
          className="mt-6 inline-flex h-12 items-center border-2 border-black bg-crimson px-6 font-tech text-sm font-bold uppercase text-white shadow-brutal dark:border-white"
        >
          Start calibration
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_INTERACTIVE}
      className="border-2 border-black bg-white p-8 shadow-brutal dark:border-white dark:bg-neutral-900"
    >
      <p className="font-tech text-xs uppercase tracking-widest text-crimson">Recommended next</p>
      <h2 className="mt-2 font-display text-4xl font-black uppercase">{item.conceptName}</h2>
      <p className="mt-1 font-tech text-xs uppercase opacity-60">
        {item.subjectName} · {item.topicName} · {item.kind.replace("_", " ")}
      </p>
      <p className="mt-3 max-w-xl text-sm opacity-80">Why: {item.rationale}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/quiz"
          className="inline-flex h-12 items-center border-2 border-black bg-crimson px-6 font-tech text-sm font-bold uppercase text-white shadow-brutal dark:border-white"
        >
          Start adaptive quiz
        </Link>
        <Link
          href={`/learn/path`}
          className="inline-flex h-12 items-center border-2 border-black px-6 font-tech text-sm font-bold uppercase shadow-brutal-sm dark:border-white"
        >
          View my path
        </Link>
      </div>
    </motion.div>
  );
}
