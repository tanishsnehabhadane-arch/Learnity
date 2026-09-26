/**
 * Bayesian Knowledge Tracing (BKT) — per-concept mastery updates.
 * Pure functions; parameters are calibrated nightly (see jobs/recalibrate.ts).
 */
import { config } from "../config.ts";

export interface BktParams {
  pGuess: number;
  pSlip: number;
  pTransit: number;
}

export interface BktState {
  /** p(L_{t-1}) — prior mastery probability. */
  mastery: number;
  attemptsCount: number;
}

export interface BktResult {
  mastery: number;
  status: "not_started" | "in_progress" | "gap_detected" | "mastered";
}

/** Seed params until per-concept calibration data exists (spec default). */
export function defaultParams(): BktParams {
  return { ...config.bkt.defaults };
}

/**
 * One BKT update step.
 * Correct:     p(L_t) = p(L_{t-1}) * (1-pSlip) / (p(L_{t-1})*(1-pSlip) + (1-p(L_{t-1}))*pGuess)
 * Incorrect:   p(L_t) = p(L_{t-1}) * pSlip   / (p(L_{t-1})*pSlip     + (1-p(L_{t-1}))*(1-pGuess))
 * Then learning transition: p(L) += (1 - p(L)) * pTransit
 */
export function updateMastery(state: BktState, isCorrect: boolean, params: BktParams): BktResult {
  const pL = clamp01(state.mastery);
  const posterior = isCorrect
    ? (pL * (1 - params.pSlip)) / (pL * (1 - params.pSlip) + (1 - pL) * params.pGuess)
    : (pL * params.pSlip) / (pL * params.pSlip + (1 - pL) * (1 - params.pGuess));

  const withLearning = posterior + (1 - posterior) * params.pTransit;
  const mastery = clamp01(withLearning);

  return { mastery, status: classify(mastery, state.attemptsCount + 1) };
}

/** Status classification shared by the attempt-ingestion path. */
export function classify(mastery: number, attemptsCount: number): BktResult["status"] {
  if (attemptsCount === 0) return "not_started";
  if (mastery >= config.bkt.masteryThreshold) return "mastered";
  if (mastery < config.bkt.gapThreshold && attemptsCount >= config.bkt.minAttemptsForGapFlag) {
    return "gap_detected";
  }
  return "in_progress";
}

/**
 * Confidence calibration delta: self-reported (1-5, normalized to 0-1)
 * minus actual binary outcome. Positive ⇒ overconfident.
 */
export function confidenceCalibrationDelta(
  priorDelta: number,
  priorCount: number,
  confidenceRating: number,
  isCorrect: boolean,
): number {
  const reported = (clamp(confidenceRating, 1, 5) - 1) / 4; // 0..1
  const actual = isCorrect ? 1 : 0;
  const sample = reported - actual;
  return (priorDelta * priorCount + sample) / (priorCount + 1);
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}
