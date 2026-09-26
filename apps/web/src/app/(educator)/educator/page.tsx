"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios-client";
import type { EducatorOverview } from "@/types";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const DEMO_COHORT = "demo-cohort";

export default function EducatorDashboardPage() {
  const [cohortId, setCohortId] = useState(DEMO_COHORT);

  const overview = useQuery({
    queryKey: ["educator", cohortId],
    queryFn: async () => {
      const res = await api.get<EducatorOverview>(`/educator/cohort/${cohortId}/overview`);
      return res.data;
    },
  });

  const exportCsv = (data: EducatorOverview): void => {
    const rows = [
      ["studentId", "name", "avgMastery", "openGaps", "flagged"],
      ...data.students.map((s) => [s.studentId, s.name, s.avgMastery.toFixed(3), String(s.openGapCount), String(s.flagged)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `cohort-${cohortId}-progress.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-5xl font-black uppercase">Cohort overview</h1>
        {overview.data && (
          <Button variant="secondary" onClick={() => exportCsv(overview.data)}>
            Export CSV
          </Button>
        )}
      </div>

      {overview.isLoading && <p className="mt-6 text-sm opacity-70">Loading cohort…</p>}
      {overview.isError && (
        <p className="mt-6 text-sm text-crimson" role="alert">
          Educator auth required — log in as an educator (seed: teacher@learnity.dev / educator123).
        </p>
      )}

      {overview.data && (
        <>
          <p className="mt-2 font-tech text-xs uppercase tracking-widest opacity-70">
            {overview.data.studentCount} students · {overview.data.flaggedCount} flagged (3+ open gaps)
          </p>

          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {overview.data.students.map((student) => (
              <li key={student.studentId}>
                <Card className={student.flagged ? "border-crimson" : undefined}>
                  <CardBody className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-tech text-sm font-bold uppercase">{student.name}</p>
                      {student.flagged && (
                        <span className="bg-crimson px-2 py-0.5 font-tech text-[10px] font-bold uppercase text-white">
                          flagged
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-tech text-xs uppercase opacity-70">
                      Avg mastery {(student.avgMastery * 100).toFixed(0)}% · {student.openGapCount} open gaps
                    </p>
                    <Link
                      href={`/educator/students/${student.studentId}`}
                      className="mt-3 inline-block font-tech text-xs uppercase underline"
                    >
                      Drill down
                    </Link>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
