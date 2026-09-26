/**
 * Planner / spaced-repetition state (spec slice 4).
 */
import { create } from "zustand";
import type { ReviewItemDto } from "@/types";
import { api } from "@/lib/axios-client";

export interface PlannerState {
  dueReviews: ReviewItemDto[];
  /** ISO date strings of planned study blocks (calendar stub until planner phase). */
  scheduledSessions: Array<{ conceptId: string; scheduledFor: string }>;
  loadDueReviews: () => Promise<void>;
  scheduleSession: (conceptId: string, scheduledFor: string) => Promise<void>;
  snoozeReview: (itemId: string, hours: number) => Promise<void>;
}

export const usePlannerStore = create<PlannerState>()((set) => ({
  dueReviews: [],
  scheduledSessions: [],
  loadDueReviews: async () => {
    try {
      const res = await api.get<{ dueCount: number; items: ReviewItemDto[] }>("/review/due");
      set({ dueReviews: res.data.items });
    } catch {
      set({ dueReviews: [] });
    }
  },
  scheduleSession: async (conceptId, scheduledFor) => {
    await api.post("/review/sessions", { conceptId, scheduledFor });
    set((s) => ({
      scheduledSessions: [...s.scheduledSessions, { conceptId, scheduledFor }],
    }));
  },
  snoozeReview: async (itemId, hours) => {
    // Snooze = rate "hard" after pushing dueAt via a scheduled session-like update.
    // STUB: dedicated snooze endpoint in the planner phase; client-side shift for now.
    set((s) => ({
      dueReviews: s.dueReviews.map((r) =>
        r.id === itemId
          ? { ...r, dueAt: new Date(Date.now() + hours * 3_600_000).toISOString() }
          : r,
      ),
    }));
  },
}));
