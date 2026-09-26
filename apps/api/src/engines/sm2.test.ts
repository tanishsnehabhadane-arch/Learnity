import { describe, expect, it } from "vitest";
import { isDue, schedule } from "./sm2.ts";

const fresh = { easeFactor: 2.5, interval: 0, repetitions: 0 };

describe("schedule (SM-2)", () => {
  it("first 'good' schedules 1 day out", () => {
    const r = schedule(fresh, "good");
    expect(r.interval).toBe(1);
    expect(r.repetitions).toBe(1);
  });

  it("second success schedules 6 days out", () => {
    const r = schedule({ ...fresh, repetitions: 1, interval: 1 }, "good");
    expect(r.interval).toBe(6);
  });

  it("third success multiplies by ease factor", () => {
    const r = schedule({ easeFactor: 2.5, interval: 6, repetitions: 2 }, "good");
    expect(r.interval).toBe(15); // round(6 * 2.5)
  });

  it("'again' resets repetitions and is due immediately", () => {
    const now = new Date("2026-01-10T00:00:00Z");
    const r = schedule({ easeFactor: 2.5, interval: 15, repetitions: 3 }, "again", now);
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(0);
    expect(r.dueAt.getTime()).toBe(now.getTime());
  });

  it("'again' lowers the ease factor per the SM-2 formula", () => {
    const r = schedule(fresh, "again");
    // EF' = 2.5 + (0.1 - 5·(0.08 + 5·0.02)) = 2.5 - 0.8 = 1.7
    expect(r.easeFactor).toBeCloseTo(1.7, 3);
  });

  it("'easy' stretches the interval and raises ease", () => {
    const base = schedule({ ...fresh, repetitions: 1, interval: 1 }, "easy");
    expect(base.easeFactor).toBeGreaterThan(2.5);
    expect(base.interval).toBeGreaterThanOrEqual(1);
  });

  it("'hard' contracts the interval relative to 'good'", () => {
    const state = { easeFactor: 2.5, interval: 10, repetitions: 3 };
    const hard = schedule(state, "hard");
    const good = schedule(state, "good");
    expect(hard.interval).toBeLessThan(good.interval);
  });

  it("ease factor never drops below 1.3", () => {
    let state = fresh;
    for (let i = 0; i < 10; i++) {
      state = schedule(state, "again");
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("due dates move forward for successful ratings", () => {
    const now = new Date("2026-03-01T00:00:00Z");
    const r = schedule({ ...fresh, repetitions: 1, interval: 1 }, "good", now);
    expect(r.dueAt.getTime()).toBeGreaterThan(now.getTime());
  });
});

describe("isDue", () => {
  it("is true for past dates and false for future ones", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    expect(isDue({ dueAt: new Date("2026-05-31T00:00:00Z") }, now)).toBe(true);
    expect(isDue({ dueAt: new Date("2026-06-02T00:00:00Z") }, now)).toBe(false);
  });
});
