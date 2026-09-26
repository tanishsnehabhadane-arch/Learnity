/**
 * User profile & learning data (spec slice 3).
 */
import { create } from "zustand";
import type { StudentProfile, LearningPathResponse } from "@/types";
import { api, getAccessToken } from "@/lib/axios-client";

export interface UserState {
  profile: StudentProfile | null;
  learningPath: LearningPathResponse | null;
  nextRecommendedTopic: string;
  streak: { current: number; longest: number; freezesAvailable: number };
  xp: number;
  badges: StudentProfile["badges"];
  loadProfile: () => Promise<void>;
  clear: () => void;
}

export const useUserStore = create<UserState>()((set) => ({
  profile: null,
  learningPath: null,
  nextRecommendedTopic: "",
  streak: { current: 0, longest: 0, freezesAvailable: 0 },
  xp: 0,
  badges: [],
  loadProfile: async () => {
    if (!getAccessToken()) return;
    try {
      const studentId = readStudentId();
      if (!studentId) return;
      const [me, path] = await Promise.all([
        api.get<StudentProfile>(`/students/${studentId}/profile`),
        api.get<LearningPathResponse>(`/students/${studentId}/learning-path`).catch(() => null),
      ]);
      set({
        profile: me.data,
        streak: me.data.streak,
        xp: me.data.xp,
        badges: me.data.badges,
        learningPath: path?.data ?? null,
        nextRecommendedTopic: path?.data.items[0]?.conceptName ?? "",
      });
    } catch {
      set({ profile: null });
    }
  },
  clear: () =>
    set({
      profile: null,
      learningPath: null,
      nextRecommendedTopic: "",
      streak: { current: 0, longest: 0, freezesAvailable: 0 },
      xp: 0,
      badges: [],
    }),
}));

/** Reads the student id from the JWT access token payload. */
function readStudentId(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem("learnity.access");
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { sub?: string };
    return claims.sub ?? null;
  } catch {
    return null;
  }
}
