import { describe, expect, it } from "vitest";
import { difficultyRatchet, selectNextItem, shouldTerminate, type CatItem } from "./cat.ts";
import type { ResponseRecord } from "./irt.ts";

const items: CatItem[] = [
  { id: "q1", a: 1, b: -2 },
  { id: "q2", a: 1, b: -1 },
  { id: "q3", a: 1, b: 0 },
  { id: "q4", a: 1, b: 1 },
  { id: "q5", a: 1, b: 2 },
];

describe("selectNextItem", () => {
  it("picks the item nearest theta (max Fisher information)", () => {
    const decision = selectNextItem(items, { theta: 0.2, itemsAdministered: 0 }, {
      seTerminationThreshold: 0.3,
      maxItems: 10,
    });
    expect(decision.nextItem?.id).toBe("q3");
    expect(decision.reason).toBe("selected");
  });

  it("respects the excluded set (no immediate repeats)", () => {
    const decision = selectNextItem(items, { theta: 0, itemsAdministered: 1 }, {
      seTerminationThreshold: 0.3,
      maxItems: 10,
      excludedItemIds: new Set(["q3"]),
    });
    expect(decision.nextItem?.id).not.toBe("q3");
  });

  it("terminates at the max-item cap even with candidates left", () => {
    const decision = selectNextItem(items, { theta: 0, itemsAdministered: 10 }, {
      seTerminationThreshold: 0.3,
      maxItems: 10,
    });
    expect(decision.nextItem).toBeNull();
    expect(decision.reason).toBe("max_items_reached");
  });

  it("terminates when no candidates remain", () => {
    const decision = selectNextItem([], { theta: 0, itemsAdministered: 0 }, {
      seTerminationThreshold: 0.3,
      maxItems: 10,
    });
    expect(decision.nextItem).toBeNull();
    expect(decision.reason).toBe("no_candidates");
  });
});

describe("shouldTerminate", () => {
  it("stops on SE threshold", () => {
    expect(shouldTerminate(0.25, 3, { seTerminationThreshold: 0.3, maxItems: 20 })).toBe(true);
  });

  it("continues while SE is high and items remain", () => {
    expect(shouldTerminate(0.8, 3, { seTerminationThreshold: 0.3, maxItems: 20 })).toBe(false);
  });

  it("stops at the hard cap", () => {
    expect(shouldTerminate(0.9, 20, { seTerminationThreshold: 0.3, maxItems: 20 })).toBe(true);
  });
});

describe("difficultyRatchet", () => {
  const c = (b: number): ResponseRecord => ({ isCorrect: true, a: 1, b });
  const w = (b: number): ResponseRecord => ({ isCorrect: false, a: 1, b });

  it("ratchets up after 2 consecutive correct", () => {
    const r = difficultyRatchet(0, [c(-1), c(0)]);
    expect(r.nextB).toBeCloseTo(0.5, 8);
    expect(r.intervention).toBe(false);
  });

  it("ratchets down and signals intervention after 2 consecutive incorrect", () => {
    const r = difficultyRatchet(0, [w(1), w(0)]);
    expect(r.nextB).toBeCloseTo(-0.5, 8);
    expect(r.intervention).toBe(true);
  });

  it("holds steady on mixed results", () => {
    expect(difficultyRatchet(0, [c(0), w(0)]).nextB).toBe(0);
    expect(difficultyRatchet(0, [w(0), c(0)]).nextB).toBe(0);
  });

  it("holds with fewer than 2 responses", () => {
    expect(difficultyRatchet(0, [c(0)]).nextB).toBe(0);
    expect(difficultyRatchet(0, []).nextB).toBe(0);
  });

  it("clamps to the theta scale", () => {
    expect(difficultyRatchet(2.9, [c(3), c(3)]).nextB).toBe(3);
    expect(difficultyRatchet(-2.9, [w(3), w(3)]).nextB).toBe(-3);
  });
});
