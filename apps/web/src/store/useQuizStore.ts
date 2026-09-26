/**
 * Quiz session state (spec slice 2).
 */
import { create } from "zustand";

export interface QuizState {
  currentQuestionIndex: number;
  userAnswers: Map<number, string>;
  detectedGaps: string[];
  /** 1-10, adjusted live from backend response. */
  currentDifficulty: number;
  timeSpentMs: number;
  /** Self-reported confidence per answer. */
  confidenceRatings: Map<number, 1 | 2 | 3 | 4 | 5>;
  advanceQuestion: () => void;
  recordAnswer: (index: number, answer: string) => void;
  submitConfidence: (index: number, rating: 1 | 2 | 3 | 4 | 5) => void;
  setDifficulty: (difficulty: number) => void;
  addDetectedGap: (conceptId: string) => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>()((set) => ({
  currentQuestionIndex: 0,
  userAnswers: new Map(),
  detectedGaps: [],
  currentDifficulty: 5,
  timeSpentMs: 0,
  confidenceRatings: new Map(),
  advanceQuestion: () => set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1 })),
  recordAnswer: (index, answer) =>
    set((s) => {
      const next = new Map(s.userAnswers);
      next.set(index, answer);
      return { userAnswers: next };
    }),
  submitConfidence: (index, rating) =>
    set((s) => {
      const next = new Map(s.confidenceRatings);
      next.set(index, rating);
      return { confidenceRatings: next };
    }),
  setDifficulty: (currentDifficulty) => set({ currentDifficulty }),
  addDetectedGap: (conceptId) =>
    set((s) => (s.detectedGaps.includes(conceptId) ? s : { detectedGaps: [...s.detectedGaps, conceptId] })),
  reset: () =>
    set({
      currentQuestionIndex: 0,
      userAnswers: new Map(),
      detectedGaps: [],
      currentDifficulty: 5,
      timeSpentMs: 0,
      confidenceRatings: new Map(),
    }),
}));
