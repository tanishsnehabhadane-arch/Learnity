"use client";

import { useUserStore } from "@/store/useUserStore";
import { LearningPathTree } from "@/components/features/LearningPathTree";

export default function CoursePathPage() {
  const learningPath = useUserStore((s) => s.learningPath);
  const loadProfile = useUserStore((s) => s.loadProfile);

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-24 pt-24">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-5xl font-black uppercase">Learning path</h1>
        <button type="button" onClick={() => void loadProfile()} className="font-tech text-xs uppercase underline">
          Refresh
        </button>
      </div>
      <p className="mt-2 max-w-2xl text-sm opacity-75">
        Recomputed after every graded activity — tap any node for details.
      </p>
      <div className="mt-8">
        <LearningPathTree path={learningPath} />
      </div>
    </main>
  );
}
