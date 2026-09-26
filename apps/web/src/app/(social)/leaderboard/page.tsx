"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";

interface Entry {
  rank: number;
  name: string;
  xp: number;
  streak: number;
}

const MOCK_ENTRIES: Entry[] = [
  { rank: 1, name: "Ada L.", xp: 4820, streak: 21 },
  { rank: 2, name: "Grace H.", xp: 4510, streak: 14 },
  { rank: 3, name: "Alan T.", xp: 4290, streak: 9 },
  { rank: 4, name: "Katherine J.", xp: 3870, streak: 11 },
  { rank: 5, name: "Margaret H.", xp: 3560, streak: 7 },
];

export default function LeaderboardPage() {
  const [scope, setScope] = useState<"cohort" | "global">("global");

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-24 pt-24">
      <h1 className="font-display text-5xl font-black uppercase">Leaderboard</h1>

      <div className="mt-6 flex gap-2" role="group" aria-label="Leaderboard scope">
        {(["cohort", "global"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            aria-pressed={scope === s}
            className={`border-2 border-black px-4 py-2 font-tech text-xs font-bold uppercase shadow-brutal-sm dark:border-white ${
              scope === s ? "bg-ink text-base dark:bg-white dark:text-black" : "bg-white dark:bg-neutral-900"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Card className="mt-6">
        <CardBody className="p-0">
          <table className="w-full text-left">
            <caption className="sr-only">Leaderboard rankings ({scope})</caption>
            <thead>
              <tr className="border-b-2 border-black font-tech text-xs uppercase dark:border-white">
                <th scope="col" className="p-3">#</th>
                <th scope="col" className="p-3">Student</th>
                <th scope="col" className="p-3">XP</th>
                <th scope="col" className="p-3">Streak</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ENTRIES.map((entry) => (
                <tr key={entry.rank} className="border-b border-black/10 dark:border-white/10">
                  <td className="p-3 font-display font-black">{entry.rank}</td>
                  <td className="p-3">{entry.name}</td>
                  <td className="p-3 font-tech">{entry.xp.toLocaleString()}</td>
                  <td className="p-3 font-tech">{entry.streak}🔥</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <p className="mt-4 text-xs opacity-70">
        Opt-in only — control visibility in Settings. STUB: live rankings endpoint lands with the
        social phase.
      </p>
    </main>
  );
}
