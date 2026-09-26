/**
 * Computerized Adaptive Testing (CAT) item selection + termination.
 * Pure logic over an item candidate list — DB access happens in routes/services.
 */
import { fisherInformation, type ResponseRecord } from "./irt.ts";

export interface CatItem {
  id: string;
  /** IRT discrimination */
  a: number;
  /** IRT difficulty */
  b: number;
  conceptId: string;
}

export interface CatState {
  theta: number;
  /** Number of items administered so far in this session. */
  itemsAdministered: number;
}

export interface CatConfig {
  /** Stop when SE(theta) drops below this. */
  seTerminationThreshold: number;
  /** Hard cap on items per session. */
  maxItems: number;
  /** Items recently served to this student (avoid immediate repeats). */
  excludedItemIds?: Set<string>;
}

export interface CatDecision {
  /** null → session is complete. */
  nextItem: CatItem | null;
  reason: "se_threshold_met" | "max_items_reached" | "no_candidates" | "selected";
}

/**
 * Select the next item maximizing Fisher information at the current theta.
 * Explicit termination: SE < threshold OR maxItems reached — never a fixed length.
 */
export function selectNextItem(
  candidates: CatItem[],
  state: CatState,
  config: CatConfig,
): CatDecision {
  if (state.itemsAdministered >= config.maxItems) {
    return { nextItem: null, reason: "max_items_reached" };
  }

  const excluded = config.excludedItemIds ?? new Set<string>();
  const eligible = candidates.filter((c) => !excluded.has(c.id));
  if (eligible.length === 0) {
    return { nextItem: null, reason: "no_candidates" };
  }

  let best: CatItem | null = null;
  let bestInfo = -Infinity;
  for (const item of eligible) {
    const info = fisherInformation(state.theta, item.a, item.b);
    if (info > bestInfo) {
      bestInfo = info;
      best = item;
    }
  }

  return best === null
    ? { nextItem: null, reason: "no_candidates" }
    : { nextItem: best, reason: "selected" };
}

/** True when the diagnostic should stop given the current estimation state. */
export function shouldTerminate(
  se: number,
  itemsAdministered: number,
  config: Pick<CatConfig, "seTerminationThreshold" | "maxItems">,
): boolean {
  return se < config.seTerminationThreshold || itemsAdministered >= config.maxItems;
}

/**
 * Difficulty ratchet for ongoing adaptive practice sessions:
 * 2 consecutive correct → harder; 2 consecutive incorrect → easier.
 * Returns the target b for the next item, plus whether an AI intervention
 * (mid-session "gap detected, want an explanation?") should trigger.
 */
export function difficultyRatchet(
  currentB: number,
  responseHistory: ResponseRecord[],
  stepSize = 0.5,
): { nextB: number; intervention: boolean } {
  const last2 = responseHistory.slice(-2);
  let nextB = currentB;
  let intervention = false;

  if (last2.length === 2 && last2[0] !== undefined && last2[1] !== undefined) {
    const [r1, r2] = last2 as [ResponseRecord, ResponseRecord];
    if (r1.isCorrect && r2.isCorrect) {
      nextB = currentB + stepSize;
    } else if (!r1.isCorrect && !r2.isCorrect) {
      nextB = currentB - stepSize;
      intervention = true;
    }
  }

  // Clamp to the standard theta scale
  return { nextB: Math.min(3, Math.max(-3, nextB)), intervention };
}
