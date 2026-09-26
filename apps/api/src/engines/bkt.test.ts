import { describe, expect, it } from "vitest";
import { confidenceCalibrationDelta, classify, defaultParams, updateMastery } from "./bkt.ts";

describe("updateMastery", () => {
  it("increases mastery on a correct answer", () => {
    const result = updateMastery({ mastery: 0.2, attemptsCount: 1 }, true, defaultParams());
    expect(result.mastery).toBeGreaterThan(0.2);
  });

  it("decreases mastery on an incorrect answer", () => {
    const result = updateMastery({ mastery: 0.5, attemptsCount: 3 }, false, defaultParams());
    expect(result.mastery).toBeLessThan(0.5);
  });

  it("correct answers always yield higher mastery than incorrect ones", () => {
    const params = defaultParams();
    for (const start of [0.05, 0.3, 0.6, 0.9]) {
      const up = updateMastery({ mastery: start, attemptsCount: 2 }, true, params);
      const down = updateMastery({ mastery: start, attemptsCount: 2 }, false, params);
      expect(up.mastery).toBeGreaterThan(down.mastery);
    }
  });

  it("incorrect answers never raise mastery above the transit floor from viable states", () => {
    const params = defaultParams();
    // From states at or above pTransit, the posterior drop dominates the transit lift.
    // (Below ~pTransit, standard BKT's unconditioned learning transition can net-increase
    // mastery even after a miss — expected model behavior, not a bug.)
    for (const start of [0.2, 0.3, 0.6, 0.9]) {
      const down = updateMastery({ mastery: start, attemptsCount: 2 }, false, params);
      expect(down.mastery).toBeLessThanOrEqual(start);
    }
  });

  it("repeated correct answers approach 1 monotonically", () => {
    const params = defaultParams();
    let state = { mastery: 0.1, attemptsCount: 0 };
    let previous = 0;
    for (let i = 0; i < 20; i++) {
      const result = updateMastery(state, true, params);
      expect(result.mastery).toBeGreaterThan(previous);
      previous = result.mastery;
      state = { mastery: result.mastery, attemptsCount: state.attemptsCount + 1 };
    }
    expect(state.mastery).toBeGreaterThan(0.9);
  });

  it("a single correct answer from cold start stays below the gap threshold effect (posterior is modest)", () => {
    // p(L)=0 → posterior after correct = (0·(1-slip))/(0+(1)·guess) = 0, then transit lift
    const result = updateMastery({ mastery: 0, attemptsCount: 0 }, true, defaultParams());
    expect(result.mastery).toBeCloseTo(defaultParams().pTransit, 8);
    expect(result.mastery).toBeLessThan(0.4); // one lucky guess ≠ mastery
  });
});

describe("classify", () => {
  it("classifies by threshold and attempt count", () => {
    expect(classify(0.96, 2)).toBe("mastered");
    expect(classify(0.3, 1)).toBe("in_progress"); // too few attempts to flag
    expect(classify(0.3, 5)).toBe("gap_detected");
    expect(classify(0.5, 5)).toBe("in_progress");
    expect(classify(0.5, 0)).toBe("not_started");
  });
});

describe("confidenceCalibrationDelta", () => {
  it("positive delta for overconfident (high rating, wrong answer)", () => {
    const delta = confidenceCalibrationDelta(0, 0, 5, false);
    expect(delta).toBeCloseTo(1, 8);
  });

  it("negative delta for underconfident (low rating, correct answer)", () => {
    const delta = confidenceCalibrationDelta(0, 0, 1, true);
    expect(delta).toBeCloseTo(-1, 8);
  });

  it("running average blends prior with new sample", () => {
    const first = confidenceCalibrationDelta(0, 0, 4, false); // 0.75 - 0 = 0.75
    const second = confidenceCalibrationDelta(first, 1, 1, true); // (0.75 + -1)/2 = -0.125
    expect(second).toBeCloseTo(-0.125, 8);
  });
});
