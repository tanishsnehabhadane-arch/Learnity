"use client";

import { use, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios-client";
import { Card, CardBody } from "@/components/ui/Card";

interface StudentDetail {
  studentId: string;
  name: string;
  concepts: Array<{
    conceptId: string;
    conceptName: string;
    masteryProbability: number;
    status: string;
    attemptsCount: number;
    confidenceCalibration: number;
  }>;
}

export default function StudentDrillDownPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);

  const student = useQuery({
    queryKey: ["educator-student", studentId],
    queryFn: async () => {
      const res = await api.get<StudentDetail>(`/educator/students/${studentId}`);
      return res.data;
    },
    retry: false,
  });

  useEffect(() => {
    student.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  return (
    <main id="main" className="mx-auto w-full max-w-4xl px-4 pb-24 pt-24">
      <h1 className="font-display text-4xl font-black uppercase">{student.data?.name ?? "Student"}</h1>

      {student.data && (
        <Card className="mt-6">
          <CardBody className="p-0">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Concept mastery for {student.data.name}</caption>
              <thead>
                <tr className="border-b-2 border-black font-tech text-xs uppercase dark:border-white">
                  <th scope="col" className="p-3">Concept</th>
                  <th scope="col" className="p-3">Mastery</th>
                  <th scope="col" className="p-3">Status</th>
                  <th scope="col" className="p-3">Attempts</th>
                  <th scope="col" className="p-3">Calibration</th>
                </tr>
              </thead>
              <tbody>
                {student.data.concepts.map((concept) => (
                  <tr key={concept.conceptId} className="border-b border-black/10 dark:border-white/10">
                    <td className="p-3">{concept.conceptName}</td>
                    <td className="p-3 font-tech">{(concept.masteryProbability * 100).toFixed(0)}%</td>
                    <td className="p-3 font-tech text-xs uppercase">{concept.status.replace("_", " ")}</td>
                    <td className="p-3 font-tech">{concept.attemptsCount}</td>
                    <td className="p-3 font-tech">
                      {concept.confidenceCalibration > 0.15
                        ? "overconfident"
                        : concept.confidenceCalibration < -0.15
                          ? "underconfident"
                          : "calibrated"}
                    </td>
                  </tr>
                ))}
                {student.data.concepts.length === 0 && (
                  <tr>
                    <td className="p-3 opacity-60" colSpan={5}>No attempts recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </main>
  );
}
