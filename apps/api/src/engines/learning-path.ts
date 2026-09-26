/**
 * Learning path recomputation.
 * Eligibility: prerequisites all >= mastery threshold.
 * Ranking: gap severity > recency of last exposure > curriculum sequence weight,
 * then interleaves 1 spaced-repetition review per N new-content items.
 */
import { config } from "../config.ts";
import type { ConceptGraphNode } from "./gap-detection.ts";
import { isRawGap } from "./gap-detection.ts";

export interface PathCandidate extends ConceptGraphNode {
  curriculumOrder: number;
  lastAttemptAt: Date | null;
}

export interface RankedConcept {
  conceptId: string;
  score: number;
  kind: "gap_remediation" | "new_content";
  rationale: string;
}

export interface RecomputedPath {
  queue: RankedConcept[];
}

/**
 * Rank eligible concepts. Lower score = higher priority.
 * Deterministic: tie-broken by curriculum order, then id.
 */
export function rankConcepts(
  candidates: PathCandidate[],
  masteryThreshold = config.bkt.masteryThreshold,
): RankedConcept[] {
  const now = Date.now();
  const eligible = candidates.filter((c) => prerequisitesMet(c, candidates, masteryThreshold));

  const scored = eligible.map((c) => {
    const gapSeverity = isRawGap(c) ? 0 : 1; // gaps first
    // Stale content ranks higher: recent exposure → recency 1 → lower priority
    const daysSince =
      c.lastAttemptAt === null ? 30 : Math.min(30, (now - c.lastAttemptAt.getTime()) / 86_400_000);
    const recency = 1 - daysSince / 30; // 0 (stale/never) .. 1 (today)
    const sequence = c.curriculumOrder / 1_000;

    const score = gapSeverity * 10 + recency * 3 + sequence;
    return { c, score };
  });

  scored.sort(
    (a, b) => a.score - b.score || a.c.curriculumOrder - b.c.curriculumOrder || a.c.id.localeCompare(b.c.id),
  );

  return scored.map(({ c, score }) => ({
    conceptId: c.id,
    score: Number(score.toFixed(4)),
    kind: isRawGap(c) ? ("gap_remediation" as const) : ("new_content" as const),
    rationale: rationaleFor(c),
  }));
}

/**
 * Interleave review items into the ranked new-content queue:
 * 1 review per `ratio` new items (spec default 4). Review entries are
 * inserted unchanged after every Nth new-content item; leftovers append.
 */
export function interleaveReviews<T, R>(
  ranked: T[],
  reviews: R[],
  ratio = config.path.reviewInterleaveRatio,
): Array<T | R> {
  if (reviews.length === 0) return [...ranked];
  const out: Array<T | R> = [];
  let reviewIdx = 0;
  for (let i = 0; i < ranked.length; i++) {
    out.push(ranked[i] as T);
    if ((i + 1) % ratio === 0 && reviewIdx < reviews.length) {
      out.push(reviews[reviewIdx] as R);
      reviewIdx += 1;
    }
  }
  // Remaining reviews append at the end
  while (reviewIdx < reviews.length) {
    out.push(reviews[reviewIdx] as R);
    reviewIdx += 1;
  }
  return out;
}

function prerequisitesMet(
  candidate: PathCandidate,
  all: PathCandidate[],
  threshold: number,
): boolean {
  const byId = new Map(all.map((c) => [c.id, c]));
  return candidate.prerequisiteIds.every((id) => {
    const prereq = byId.get(id);
    return prereq !== undefined && prereq.masteryProbability >= threshold;
  });
}

/**
 * Deterministic, template-based rationale (explainability requirement).
 * STUB: replaced/augmented by AI-generated rationale strings via
 * services/ai/rationale.ts once Claude integration lands; templates remain
 * the fallback when the cache is cold so the path is never unexplained.
 */
function rationaleFor(c: PathCandidate): string {
  if (isRawGap(c)) {
    return "Your recent attempts suggest this concept needs reinforcement before moving on — it underpins several upcoming topics.";
  }
  if (c.masteryProbability === 0 && c.attemptsCount === 0) {
    return "Next in your curriculum sequence — all prerequisites are mastered.";
  }
  return "Ready to advance: prerequisites are solid and it has been a while since your last exposure.";
}
