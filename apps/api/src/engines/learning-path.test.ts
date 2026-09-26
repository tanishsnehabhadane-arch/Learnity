import { describe, expect, it } from "vitest";
import { interleaveReviews, rankConcepts, type PathCandidate } from "./learning-path.ts";

function candidate(overrides: Partial<PathCandidate> & { id: string }): PathCandidate {
  return {
    prerequisiteIds: [],
    masteryProbability: 1,
    attemptsCount: 0,
    status: "not_started",
    curriculumOrder: 0,
    lastAttemptAt: null,
    ...overrides,
  };
}

describe("rankConcepts", () => {
  it("ranks gap remediation above new content", () => {
    const gap = candidate({ id: "gap", masteryProbability: 0.2, attemptsCount: 5, status: "gap_detected", curriculumOrder: 10 });
    const fresh = candidate({ id: "fresh", curriculumOrder: 1 });
    const ranked = rankConcepts([fresh, gap]);
    expect(ranked[0]?.conceptId).toBe("gap");
    expect(ranked[0]?.kind).toBe("gap_remediation");
  });

  it("excludes concepts whose prerequisites are not mastered", () => {
    const prereq = candidate({ id: "prereq", masteryProbability: 0.9, attemptsCount: 4, status: "in_progress" });
    const dependent = candidate({ id: "dependent", prerequisiteIds: ["prereq"], curriculumOrder: 2 });
    const ranked = rankConcepts([prereq, dependent]);
    expect(ranked.map((r) => r.conceptId)).not.toContain("dependent");
    expect(ranked.map((r) => r.conceptId)).toContain("prereq");
  });

  it("includes concepts whose prerequisites are mastered", () => {
    const prereq = candidate({ id: "prereq" });
    const dependent = candidate({ id: "dependent", prerequisiteIds: ["prereq"], curriculumOrder: 2 });
    const ranked = rankConcepts([prereq, dependent]);
    expect(ranked.map((r) => r.conceptId)).toContain("dependent");
  });

  it("prioritizes stale in-progress content over freshly-seen content", () => {
    const stale = candidate({
      id: "stale",
      masteryProbability: 0.7,
      attemptsCount: 4,
      status: "in_progress",
      curriculumOrder: 5,
      lastAttemptAt: new Date(Date.now() - 20 * 86_400_000),
    });
    const recent = candidate({
      id: "recent",
      masteryProbability: 0.7,
      attemptsCount: 4,
      status: "in_progress",
      curriculumOrder: 5,
      lastAttemptAt: new Date(),
    });
    const ranked = rankConcepts([recent, stale]);
    expect(ranked[0]?.conceptId).toBe("stale");
  });

  it("breaks ties deterministically by curriculum order then id", () => {
    const a = candidate({ id: "a", curriculumOrder: 3 });
    const b = candidate({ id: "b", curriculumOrder: 3 });
    const c = candidate({ id: "c", curriculumOrder: 1 });
    const ranked = rankConcepts([b, a, c]);
    expect(ranked.map((r) => r.conceptId)).toEqual(["c", "a", "b"]);
  });

  it("attaches a rationale string to every ranked item (explainability)", () => {
    const ranked = rankConcepts([
      candidate({ id: "gap", masteryProbability: 0.2, attemptsCount: 5, status: "gap_detected" }),
      candidate({ id: "new" }),
    ]);
    for (const item of ranked) {
      expect(item.rationale.length).toBeGreaterThan(10);
    }
  });
});

describe("interleaveReviews", () => {
  it("inserts one review after every N new items", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const reviews = ["r1", "r2"];
    const out = interleaveReviews(items, reviews, 4);
    expect(out).toEqual([1, 2, 3, 4, "r1", 5, 6, 7, 8, "r2"]);
  });

  it("appends leftover reviews at the end", () => {
    const out = interleaveReviews([1, 2, 3], ["r1", "r2"], 4);
    expect(out).toEqual([1, 2, 3, "r1", "r2"]);
  });

  it("returns the original list when there are no reviews", () => {
    expect(interleaveReviews([1, 2], [], 4)).toEqual([1, 2]);
  });
});
