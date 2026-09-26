"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios-client";
import { useUserStore } from "@/store/useUserStore";
import { usePlannerStore } from "@/store/usePlannerStore";
import { ProgressCard } from "@/components/features/ProgressCard";
import { StreakBadgeRail } from "@/components/features/StreakBadgeRail";
import { MasteryHeatmap } from "@/components/features/MasteryHeatmap";
import type { LearningPathResponse, MasteryHeatmapResponse, ReviewDueResponse } from "@/types";

export default function DashboardPage() {
  const { profile, learningPath, loadProfile } = useUserStore();
  const dueReviews = usePlannerStore((s) => s.dueReviews);
  const loadDueReviews = usePlannerStore((s) => s.loadDueReviews);

  useEffect(() => {
    void loadProfile();
    void loadDueReviews();
  }, [loadProfile, loadDueReviews]);

  const heatmap = useQuery({
    queryKey: ["heatmap", "me"],
    queryFn: async () => {
      const studentId = profile?.id;
      if (!studentId) return null;
      const res = await api.get<MasteryHeatmapResponse>(`/analytics/${studentId}/mastery-heatmap`);
      return res.data;
    },
    enabled: profile !== null,
  });

  const top = learningPath?.items[0] ?? null;

  return (
    <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-24">
      <h1 className="sr-only">Dashboard</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProgressCard item={top} />
        </div>
        <StreakBadgeRail
          streak={{ current: profile?.streak.current ?? 0, longest: profile?.streak.longest ?? 0 }}
          xp={profile?.xp ?? 0}
          badges={profile?.badges ?? []}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="reviews-heading" className="border-2 border-black bg-white p-6 shadow-brutal dark:border-white dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <h2 id="reviews-heading" className="font-tech text-sm font-bold uppercase">Reviews due today</h2>
            <Link href="/review" className="font-tech text-xs uppercase underline">Review queue</Link>
          </div>
          <p className="mt-3 font-display text-6xl font-black">{dueReviews.length}</p>
          <p className="font-tech text-xs uppercase opacity-70">spaced-repetition items</p>
        </section>

        <section aria-labelledby="heatmap-heading" className="border-2 border-black bg-white p-6 shadow-brutal dark:border-white dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <h2 id="heatmap-heading" className="font-tech text-sm font-bold uppercase">Mastery snapshot</h2>
            <Link href="/analytics" className="font-tech text-xs uppercase underline">Full analytics</Link>
          </div>
          <div className="mt-4">
            <MasteryHeatmap data={heatmap.data ?? null} />
          </div>
        </section>
      </div>
    </main>
  );
}
