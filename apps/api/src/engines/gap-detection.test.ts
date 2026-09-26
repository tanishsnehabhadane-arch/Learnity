import { describe, expect, it } from "vitest";
import { detectGaps, hasMasteredDependent, resolveActionableGap, type ConceptGraphNode } from "./gap-detection.ts";

function node(overrides: Partial<ConceptGraphNode> & { id: string }): ConceptGraphNode {
  return {
    prerequisiteIds: [],
    masteryProbability: 1,
    attemptsCount: 5,
    status: "mastered",
    ...overrides,
  };
}

/**
 * Fixture DAG (the spec's motivating case):
 *   distributing_negative → solving_linear → quadratics
 * Student failed quadratics; the actionable gap is the prerequisite root.
 */
function linearAlgebraGraph(): Map<string, ConceptGraphNode> {
  return new Map([
    ["distributing_negative", node({ id: "distributing_negative", masteryProbability: 0.2, status: "gap_detected" })],
    ["solving_linear", node({ id: "solving_linear", masteryProbability: 0.35, status: "gap_detected", prerequisiteIds: ["distributing_negative"] })],
    ["quadratics", node({ id: "quadratics", masteryProbability: 0.3, status: "gap_detected", prerequisiteIds: ["solving_linear"] })],
    ["unrelated_mastered", node({ id: "unrelated_mastered" })],
  ]);
}

describe("resolveActionableGap", () => {
  it("walks the prerequisite DAG backward to the root cause", () => {
    const gap = resolveActionableGap("quadratics", linearAlgebraGraph());
    expect(gap.conceptId).toBe("distributing_negative");
    expect(gap.observedOn).toBe("quadratics");
    expect(gap.depth).toBe(2);
  });

  it("returns the node itself when prerequisites are healthy", () => {
    const graph = new Map([
      ["healthy_prereq", node({ id: "healthy_prereq" })],
      ["failed", node({ id: "failed", masteryProbability: 0.1, status: "gap_detected", prerequisiteIds: ["healthy_prereq"] })],
    ]);
    const gap = resolveActionableGap("failed", graph);
    expect(gap.conceptId).toBe("failed");
    expect(gap.depth).toBe(0);
  });

  it("marks unexpected gaps when a dependent concept is already mastered", () => {
    const graph = new Map([
      ["prereq", node({ id: "prereq", masteryProbability: 0.2, status: "gap_detected" })],
      ["dependent", node({ id: "dependent", prerequisiteIds: ["prereq"] })], // mastered despite gap
    ]);
    const gap = resolveActionableGap("prereq", graph);
    expect(gap.unexpected).toBe(true);
  });

  it("handles unknown node ids without throwing", () => {
    const gap = resolveActionableGap("missing", new Map());
    expect(gap.conceptId).toBe("missing");
    expect(gap.depth).toBe(0);
  });
});

describe("detectGaps", () => {
  it("deduplicates chains to a single root-cause gap", () => {
    const gaps = detectGaps(linearAlgebraGraph());
    const ids = gaps.map((g) => g.conceptId);
    expect(ids).toContain("distributing_negative");
    expect(ids).not.toContain("quadratics");
    expect(ids).not.toContain("solving_linear");
  });

  it("sorts deepest root causes first", () => {
    const gaps = detectGaps(linearAlgebraGraph());
    expect(gaps[0]?.conceptId).toBe("distributing_negative");
  });

  it("ignores healthy nodes", () => {
    const graph = new Map([["fine", node({ id: "fine" })]]);
    expect(detectGaps(graph)).toHaveLength(0);
  });
});

describe("hasMasteredDependent", () => {
  it("detects the inconsistency signal", () => {
    const graph = linearAlgebraGraph();
    expect(hasMasteredDependent("solving_linear", graph)).toBe(false);
    const withMasteredDependent = new Map([
      ["base", node({ id: "base", masteryProbability: 0.2, status: "gap_detected" })],
      ["advanced", node({ id: "advanced", prerequisiteIds: ["base"] })],
    ]);
    expect(hasMasteredDependent("base", withMasteredDependent)).toBe(true);
  });
});
