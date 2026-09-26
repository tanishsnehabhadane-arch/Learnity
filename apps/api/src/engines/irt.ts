/**
 * 2-Parameter Logistic IRT model — the math behind adaptive item selection.
 *
 * Pure functions only: no I/O, fully unit-testable with known input/output pairs
 * (these modules are the highest-risk-of-silent-bug code in the system).
 */

/** 2PL probability of a correct response given ability theta. */
export function pCorrect(theta: number, a: number, b: number): number {
  const z = a * (theta - b);
  // Numerically stable logistic
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

/** Fisher information of an item at theta — the quantity CAT maximizes. */
export function fisherInformation(theta: number, a: number, b: number): number {
  const p = pCorrect(theta, a, b);
  return a * a * p * (1 - p);
}

export interface ResponseRecord {
  isCorrect: boolean;
  a: number;
  b: number;
}

const MLE_BOUNDS = { min: -3, max: 3 };
const NEWTON_MAX_ITERATIONS = 25;
const NEWTON_TOLERANCE = 1e-6;
const EAP_PRIOR_MEAN = 0;
const EAP_PRIOR_SD = 1;
const EAP_GRID = { min: -3, max: 3, steps: 61 };
const SE_FLOOR = 0.25; // asymptote so SE never reaches 0 with finite items

/**
 * Maximum Likelihood Estimation of theta via Newton-Raphson.
 * Falls back to EAP when MLE is unstable (all-correct / all-wrong response
 * vectors produce unbounded likelihood — the classic CAT edge case).
 */
export function estimateThetaMLE(responses: ResponseRecord[]): { theta: number; se: number } {
  if (responses.length === 0) return { theta: 0, se: 1 };

  const allCorrect = responses.every((r) => r.isCorrect);
  const allWrong = responses.every((r) => !r.isCorrect);
  if (allCorrect || allWrong) {
    return estimateThetaEAP(responses);
  }

  let theta = 0;
  for (let i = 0; i < NEWTON_MAX_ITERATIONS; i++) {
    const { first, second } = logLikelihoodDerivatives(theta, responses);
    if (Math.abs(first) < NEWTON_TOLERANCE) break;
    // Guard against zero/negative information (would push theta the wrong way)
    if (second >= 0) break;
    const next = theta - first / second;
    const clamped = Math.min(MLE_BOUNDS.max, Math.max(MLE_BOUNDS.min, next));
    if (Math.abs(clamped - theta) < NEWTON_TOLERANCE) {
      theta = clamped;
      break;
    }
    theta = clamped;
  }

  return { theta, se: standardError(theta, responses) };
}

/**
 * Expected A Posteriori estimate on a grid with N(0,1) prior.
 * Stable at the extremes where MLE diverges.
 */
export function estimateThetaEAP(responses: ResponseRecord[]): { theta: number; se: number } {
  const { min, max, steps } = EAP_GRID;
  const step = (max - min) / (steps - 1);

  let num = 0;
  let den = 0;
  for (let i = 0; i < steps; i++) {
    const theta = min + i * step;
    let likelihood = 1;
    for (const r of responses) {
      const p = pCorrect(theta, r.a, r.b);
      likelihood *= r.isCorrect ? p : 1 - p;
    }
    // Normal prior density (unnormalized is fine — constants cancel)
    const prior = Math.exp(-0.5 * ((theta - EAP_PRIOR_MEAN) / EAP_PRIOR_SD) ** 2);
    const weight = likelihood * prior;
    num += theta * weight;
    den += weight;
  }

  const theta = den === 0 ? 0 : num / den;
  return { theta, se: standardError(theta, responses) };
}

/** Observed Fisher information-based standard error of theta. */
export function standardError(theta: number, responses: ResponseRecord[]): number {
  const info = responses.reduce((sum, r) => sum + fisherInformation(theta, r.a, r.b), 0);
  if (info <= 0) return SE_FLOOR * 4;
  return Math.max(SE_FLOOR, 1 / Math.sqrt(info));
}

function logLikelihoodDerivatives(
  theta: number,
  responses: ResponseRecord[],
): { first: number; second: number } {
  let first = 0;
  let second = 0;
  for (const r of responses) {
    const p = pCorrect(theta, r.a, r.b);
    const pDiff = r.a * p * (1 - p);
    // d/dθ log L = Σ (u - p) * a * p(1-p) / (p(1-p))  → simplified per-item:
    first += r.isCorrect ? r.a * (1 - p) : -r.a * p;
    // Second derivative of log-likelihood for 2PL:
    second += -(r.a * r.a) * p * (1 - p);
  }
  return { first, second };
}

/** Maps a continuous IRT b-parameter to the UI's 1-10 difficulty display. */
export function bToDisplayDifficulty(b: number): number {
  const clamped = Math.min(3, Math.max(-3, b));
  // +0.5 before rounding keeps integer displays exactly round-trippable
  return Math.round(((clamped + 3) / 6) * 9 + 0.5);
}

/** Inverse of bToDisplayDifficulty — accepts a UI 1-10 difficulty setting. */
export function displayDifficultyToB(display: number): number {
  const clamped = Math.min(10, Math.max(1, display));
  const b = ((clamped - 0.5) / 9) * 6 - 3;
  return Math.min(3, Math.max(-3, b));
}

/** Buckets b into coarse bands used as AI-content cache keys. */
export function difficultyBand(b: number): string {
  const display = bToDisplayDifficulty(b);
  if (display <= 3) return "easy";
  if (display <= 6) return "medium";
  return "hard";
}
