"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios-client";
import { useUserStore } from "@/store/useUserStore";
import { MasteryHeatmap } from "@/components/features/MasteryHeatmap";
import type { DetectedGapsResponse, MasteryHeatmapResponse } from "@/types";

export default function AnalyticsPage() {
  const { profile, loadProfile } = useUserStore();

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const studentId = profile?.id;

  const heatmap = useQuery({
    queryKey: ["heatmap", studentId],
    queryFn: async () => {
      const res = await api.get<MasteryHeatmapResponse>(`/analytics/${studentId}/mastery-heatmap`);
      return res.data;
    },
    enabled: studentId !== undefined,
  });

  const gaps = useQuery({
    queryKey: ["gaps", studentId],
    queryFn: async () => {
      const res = await api.get<DetectedGapsResponse>(`/concepts/${studentId}/gaps`);
      return res.data;
    },
    enabled: studentId !== undefined,
  });

  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-4 pb-24 pt-24">
      <h1 className="font-display text-5xl font-black uppercase">Analytics</h1>

      <section className="mt-8" aria-labelledby="mastery-heading">
        <h2 id="mastery-heading" className="font-tech text-sm font-bold uppercase">Mastery heatmap</h2>
        <div className="mt-4 border-2 border-black bg-white p-6 shadow-brutal dark:border-white dark:bg-neutral-900">
          <MasteryHeatmap data={heatmap.data ?? null} />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="gaps-heading">
        <h2 id="gaps-heading" className="font-tech text-sm font-bold uppercase">Actionable gaps</h2>
        {gaps.isLoading && <p className="mt-3 text-sm opacity-70">Analyzing…</p>}
        {gaps.data && gaps.data.gaps.length === 0 && (
          <p className="mt-3 text-sm opacity-70">No open gaps — prerequisites are aligned.</p>
        )}
        <ul className="mt-4 space-y-3">
          {gaps.data?.gaps.map((gap) => (
            <li
              key={gap.conceptId}
              className="border-2 border-black bg-white p-4 shadow-brutal-sm dark:border-white dark:bg-neutral-900"
            >
              <p className="font-tech text-sm font-bold uppercase">
                {gap.conceptName}
                {gap.unexpected && (
                  <span className="ml-2 bg-crimson px-1.5 py-0.5 text-[10px] text-white">unexpected</span>
                )}
              </p>
              <p className="mt-1 text-sm opacity-75">
                Surfaced while working on <strong>{gap.observedOnName}</strong> — the prerequisite is the real gap.
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
