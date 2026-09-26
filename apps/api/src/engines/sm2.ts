/**
 * SM-2 spaced-repetition scheduler (SuperMemo-2 as used by Anki).
 * Pure function — deterministic given inputs.
 */
import type { Rating } from "../generated/prisma/index.js";

export interface Sm2State {
  easeFactor: number; // >= 1.3
  interval: number; // days
  repetitions: number;
}

export interface Sm2Result extends Sm2State {
  /** When the item is next due. */
  dueAt: Date;
}

const MIN_EF = 1.3;
const DAY_MS = 86_400_000;

/**
 * Classic SM-2 update:
 *  - "again" resets repetitions and interval (relearn).
 *  - quality mapping: again=0, hard=3, good=4, easy=5.
 */
export function schedule(state: Sm2State, rating: Rating, now = new Date()): Sm2Result {
  const quality = rating === "again" ? 0 : rating === "hard" ? 3 : rating === "good" ? 4 : 5;

  let { easeFactor, interval, repetitions } = state;

  // EF update formula
  const newEf = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(MIN_EF, Number(newEf.toFixed(3)));

  if (rating === "again") {
    repetitions = 0;
    interval = 0; // due immediately (same-session relearn)
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);

    if (rating === "hard") interval = Math.max(1, Math.round(interval * 0.8));
    if (rating === "easy") interval = Math.round(interval * 1.3);
  }

  const dueAt = new Date(now.getTime() + interval * DAY_MS);
  return { easeFactor, interval, repetitions, dueAt };
}

/** Concepts at risk of decay: previously mastered and due (or overdue). */
export function isDue(item: { dueAt: Date }, now = new Date()): boolean {
  return item.dueAt.getTime() <= now.getTime();
}
