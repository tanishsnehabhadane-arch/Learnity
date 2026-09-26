import { describe, expect, it } from "vitest";
import {
  bToDisplayDifficulty,
  difficultyBand,
  displayDifficultyToB,
  estimateThetaEAP,
  estimateThetaMLE,
  fisherInformation,
  pCorrect,
  standardError,
  type ResponseRecord,
} from "./irt.ts";

const item = { a: 1, b: 0 };

describe("pCorrect (2PL)", () => {
  it("returns 0.5 when theta equals b", () => {
    expect(pCorrect(0, 1, 0)).toBeCloseTo(0.5, 10);
  });

  it("is monotone increasing in theta", () => {
    expect(pCorrect(-2, 1, 0)).toBeLessThan(pCorrect(0, 1, 0));
    expect(pCorrect(0, 1, 0)).toBeLessThan(pCorrect(2, 1, 0));
  });

  it("matches known logistic values", () => {
    // p = 1/(1+e^-1) ≈ 0.7311
    expect(pCorrect(1, 1, 0)).toBeCloseTo(0.7311, 4);
    // p = 1/(1+e^2) ≈ 0.1192
    expect(pCorrect(-2, 1, 0)).toBeCloseTo(0.1192, 4);
  });

  it("steeper discrimination widens range around b", () => {
    expect(pCorrect(1, 2, 0)).toBeGreaterThan(pCorrect(1, 1, 0));
    expect(pCorrect(-1, 2, 0)).toBeLessThan(pCorrect(-1, 1, 0));
  });
});

describe("fisherInformation", () => {
  it("is maximal at theta = b and symmetric around it", () => {
    const atB = fisherInformation(0, 1, 0);
    const far = fisherInformation(2, 1, 0);
    expect(atB).toBeCloseTo(0.25, 6); // a²·p(1-p) = 1·0.25
    expect(fisherInformation(-2, 1, 0)).toBeCloseTo(far, 8);
    expect(atB).toBeGreaterThan(far);
  });

  it("scales with discrimination²", () => {
    expect(fisherInformation(0, 2, 0)).toBeCloseTo(1.0, 6); // 4 · 0.25
  });
});

describe("theta estimation", () => {
  it("MLE converges near the true theta for a consistent responder", () => {
    const responses: ResponseRecord[] = [
      { isCorrect: true, a: 1, b: -0.5 },
      { isCorrect: true, a: 1, b: 0 },
      { isCorrect: false, a: 1, b: 0.5 },
    ];
    const { theta } = estimateThetaMLE(responses);
    // MLE maximizes likelihood; 2 correct (b ≤ 0) vs 1 miss (b = 0.5)
    // must push the estimate above 0 but below the hardest failure
    expect(theta).toBeGreaterThan(0);
    expect(theta).toBeLessThan(1.0);
  });

  it("MLE falls back to EAP for all-correct response vectors", () => {
    const allCorrect: ResponseRecord[] = [
      { isCorrect: true, a: 1, b: 2 },
      { isCorrect: true, a: 1, b: 2.5 },
    ];
    const { theta } = estimateThetaMLE(allCorrect);
    expect(theta).toBeLessThan(3); // EAP prior shrinks the estimate
  });

  it("EAP with no responses returns the prior mean", () => {
    const { theta } = estimateThetaEAP([]);
    expect(theta).toBeCloseTo(0, 6);
  });

  it("estimate increases with more correct answers", () => {
    const weak: ResponseRecord[] = [{ isCorrect: false, a: 1, b: 0 }];
    const strong: ResponseRecord[] = [
      { isCorrect: true, a: 1, b: 0 },
      { isCorrect: true, a: 1, b: 1 },
    ];
    expect(estimateThetaEAP(strong).theta).toBeGreaterThan(estimateThetaEAP(weak).theta);
  });
});

describe("standardError", () => {
  it("decreases with more items", () => {
    const one: ResponseRecord[] = [{ isCorrect: true, a: 1, b: 0 }];
    const five: ResponseRecord[] = Array.from({ length: 5 }, (_, i) => ({
      isCorrect: i % 2 === 0,
      a: 1,
      b: i * 0.2 - 0.4,
    }));
    expect(standardError(0, five)).toBeLessThan(standardError(0, one));
  });

  it("never drops below the floor", () => {
    const ten: ResponseRecord[] = Array.from({ length: 50 }, (_, i) => ({
      isCorrect: i % 2 === 0,
      a: 1,
      b: i * 0.1 - 2.5,
    }));
    expect(standardError(0, ten)).toBeGreaterThanOrEqual(0.25);
  });
});

describe("difficulty conversions", () => {
  it("maps b=0 to display 5 and back", () => {
    expect(bToDisplayDifficulty(0)).toBe(5);
    expect(displayDifficultyToB(5)).toBeCloseTo(0, 8);
  });

  it("round-trips across the scale within rounding error", () => {
    for (let display = 1; display <= 10; display++) {
      const back = bToDisplayDifficulty(displayDifficultyToB(display));
      expect(Math.abs(back - display)).toBeLessThanOrEqual(0.5);
    }
  });

  it("buckets b into cache bands", () => {
    expect(difficultyBand(-2)).toBe("easy");
    expect(difficultyBand(0)).toBe("medium");
    expect(difficultyBand(2.5)).toBe("hard");
  });
});
