/**
 * LearningPathTree — node graph of prerequisite chains (custom SVG, no heavy
 * graph dep). Locked: greyed + padlock; mastered: green + check; in-progress:
 * pulsing blue ring. Tap opens a side-sheet with rationale, est. time, start CTA.
 */
"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Check, Lock, Play } from "lucide-react";
import type { LearningPathResponse } from "@/types";
import { SPRING_INTERACTIVE } from "@/lib/animations";

type NodeState = "locked" | "mastered" | "in_progress" | "available";

interface TreeNode {
  conceptId: string;
  name: string;
  state: NodeState;
  rationale: string;
  missingPrereq: string | null;
}

export function LearningPathTree({ path }: { path: LearningPathResponse | null }): JSX.Element {
  const [selected, setSelected] = useState<TreeNode | null>(null);

  const nodes = useMemo<TreeNode[]>(() => {
    if (!path) return [];
    const items = path.items;
    return items.map((item, index) => {
      const prereq = index > 0 ? items[index - 1] : undefined;
      const prereqDone = prereq === undefined || prereq.kind !== "gap_remediation";
      const state: NodeState =
        prereq === undefined
          ? "available"
          : prereqDone
            ? "available"
            : "locked";
      return {
        conceptId: item.conceptId,
        name: item.conceptName,
        state,
        rationale: item.rationale,
        missingPrereq: state === "locked" && prereq ? prereq.conceptName : null,
      };
    });
  }, [path]);

  const COL_W = 190;
  const ROW_H = 96;

  return (
    <div className="relative">
      {nodes.length === 0 && (
        <p className="opacity-70">No learning path yet — complete your diagnostic to generate one.</p>
      )}

      <svg
        viewBox={`0 0 ${COL_W} ${nodes.length * ROW_H}`}
        className="h-auto w-full max-w-3xl"
        role="img"
        aria-label="Learning path graph"
      >
        {nodes.map((node, i) => {
          const y = i * ROW_H + ROW_H / 2;
          const nextY = (i + 1) * ROW_H + ROW_H / 2;
          return (
            <g key={node.conceptId}>
              {i < nodes.length - 1 && (
                <line x1={COL_W / 2} y1={y + 28} x2={COL_W / 2} y2={nextY - 28} stroke="currentColor" strokeWidth={2} />
              )}
              <g
                className="cursor-pointer"
                onClick={() => setSelected(node)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelected(node)}
                aria-label={`${node.name} — ${node.state}`}
              >
                <circle
                  cx={COL_W / 2}
                  cy={y}
                  r={24}
                  className={
                    node.state === "mastered"
                      ? "fill-mastery"
                      : node.state === "locked"
                        ? "fill-neutral-300 dark:fill-neutral-700"
                        : "fill-electric"
                  }
                />
                {node.state === "in_progress" && (
                  <circle cx={COL_W / 2} cy={y} r={30} className="animate-pulse fill-none stroke-electric" strokeWidth={3} />
                )}
                <text x={COL_W / 2} y={y + 4} textAnchor="middle" className="fill-white text-[10px] font-bold">
                  {node.state === "mastered" ? "✓" : node.state === "locked" ? "🔒" : i + 1}
                </text>
                <text x={COL_W / 2 + 34} y={y + 4} className="fill-current text-[13px] font-medium">
                  {node.name}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      <AnimatePresence>
        {selected && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={SPRING_INTERACTIVE}
            className="fixed inset-y-0 right-0 z-[80] w-[min(420px,100vw)] overflow-y-auto border-l-2 border-black bg-white p-6 shadow-floating dark:border-white dark:bg-neutral-900"
            role="dialog"
            aria-label={`${selected.name} details`}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="font-tech text-xs uppercase underline"
              aria-label="Close details"
            >
              Close
            </button>
            <h3 className="mt-4 font-display text-3xl font-black uppercase">{selected.name}</h3>
            <p className="mt-3 text-sm opacity-80">{selected.rationale}</p>

            <dl className="mt-6 space-y-2 font-tech text-xs uppercase tracking-wider">
              <div className="flex justify-between border-b-2 border-black pb-1 dark:border-white">
                <dt>Est. time</dt>
                <dd>25 min</dd>
              </div>
              <div className="flex justify-between border-b-2 border-black pb-1 dark:border-white">
                <dt>Status</dt>
                <dd>{selected.state.replace("_", " ")}</dd>
              </div>
              {selected.missingPrereq && (
                <div className="flex justify-between border-b-2 border-black pb-1 text-crimson dark:border-white">
                  <dt>Missing prereq</dt>
                  <dd>{selected.missingPrereq}</dd>
                </div>
              )}
            </dl>

            <div className="mt-8">
              {selected.state === "locked" ? (
                <span className="inline-flex items-center gap-2 border-2 border-black px-4 py-2 font-tech text-sm uppercase opacity-50 dark:border-white">
                  <Lock className="h-4 w-4" aria-hidden /> Locked
                </span>
              ) : (
                <Link
                  href="/quiz"
                  className="inline-flex items-center gap-2 border-2 border-black bg-crimson px-4 py-2 font-tech text-sm font-bold uppercase text-white shadow-brutal dark:border-white"
                >
                  <Play className="h-4 w-4" aria-hidden /> Start
                </Link>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MasteredCheck(): JSX.Element {
  return <Check className="h-4 w-4" aria-hidden />;
}
