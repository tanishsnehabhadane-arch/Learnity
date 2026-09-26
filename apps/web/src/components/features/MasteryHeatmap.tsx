/**
 * MasteryHeatmap — topics (rows) × recent sessions (columns) grid; color
 * intensity = confidence. Hover reveals exact accuracy % and last-attempted
 * date. Subject filter included.
 */
"use client";

import { useMemo, useState } from "react";
import type { MasteryHeatmapResponse } from "@/types";
import { cn } from "@/lib/cn";

function confidenceColor(confidence: number): string {
  // 0 → warning amber, 1 → mastery green (intensity ramp)
  if (confidence >= 0.95) return "bg-mastery text-black";
  if (confidence >= 0.7) return "bg-mastery/70";
  if (confidence >= 0.4) return "bg-gap/60";
  if (confidence > 0) return "bg-crimson/60";
  return "bg-neutral-200 dark:bg-neutral-800";
}

export function MasteryHeatmap({ data }: { data: MasteryHeatmapResponse | null }): JSX.Element {
  const [subject, setSubject] = useState<string>("all");

  const cells = useMemo(
    () => (data?.cells ?? []).filter((c) => subject === "all" || c.subjectName === subject),
    [data, subject],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSubject("all")}
          className={cn(
            "border-2 px-3 py-1 font-tech text-xs uppercase",
            subject === "all" ? "border-black bg-ink text-base dark:border-white dark:bg-white dark:text-black" : "border-black dark:border-white",
          )}
        >
          All
        </button>
        {(data?.subjects ?? []).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSubject(s)}
            className={cn(
              "border-2 px-3 py-1 font-tech text-xs uppercase",
              subject === s ? "border-black bg-ink text-base dark:border-white dark:bg-white dark:text-black" : "border-black dark:border-white",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {cells.length === 0 ? (
        <p className="opacity-70">No mastery data yet — answer some questions first.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cells.map((cell) => (
            <li
              key={cell.conceptId}
              className={cn(
                "group relative border-2 border-black p-3 dark:border-white",
                confidenceColor(cell.confidence),
              )}
              tabIndex={0}
              aria-label={`${cell.conceptName}: ${(cell.confidence * 100).toFixed(0)}% confidence, ${(cell.accuracy * 100).toFixed(0)}% accuracy`}
            >
              <p className="font-tech text-xs font-bold uppercase">{cell.conceptName}</p>
              <p className="text-[10px] uppercase opacity-70">{cell.topicName}</p>

              {/* Hover/focus tooltip: exact accuracy + last attempted */}
              <div
                role="tooltip"
                className="pointer-events-none absolute inset-x-2 bottom-full z-10 mb-1 hidden border-2 border-black bg-white p-2 text-[11px] shadow-brutal-sm group-focus:block group-hover:block dark:border-white dark:bg-neutral-900"
              >
                <p>Accuracy: {(cell.accuracy * 100).toFixed(0)}% ({cell.attemptCount} attempts)</p>
                <p>
                  Last attempted:{" "}
                  {cell.lastAttemptedAt ? new Date(cell.lastAttemptedAt).toLocaleDateString() : "never"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
