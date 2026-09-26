/**
 * Recomputes the student's learning path after every learner-model update.
 * Pipeline: load concept graph + learner states → rank eligible concepts
 * (gap severity > recency > curriculum order) → attach cached rationales → persist.
 */
import { config } from "../config.ts";
import { rankConcepts, type PathCandidate } from "../engines/learning-path.ts";
import { isRawGap, type ConceptGraphNode } from "../engines/gap-detection.ts";
import { prisma } from "../services/prisma.ts";
import { generateRationale } from "../services/ai/rationale.ts";
import { logger } from "../lib/logger.ts";
import type { RecomputePathJob } from "./queues.ts";

/** Structural job shape — lets tests and inline fallbacks run without BullMQ. */
export async function handleRecomputePath(job: { data: RecomputePathJob }): Promise<void> {
  const { studentId, triggeredByAttemptIds } = job.data;
  const startedAt = Date.now();

  const concepts = await prisma.concept.findMany({
    include: {
      prerequisites: { select: { id: true } },
      topic: { include: { subject: true } },
    },
  });

  const states = await prisma.learnerConceptState.findMany({ where: { studentId } });
  const stateByConcept = new Map(states.map((s) => [s.conceptId, s]));

  const graph = new Map<string, ConceptGraphNode>();
  const candidates: PathCandidate[] = concepts.map((c) => {
    const state = stateByConcept.get(c.id);
    const node: ConceptGraphNode = {
      id: c.id,
      prerequisiteIds: c.prerequisites.map((p) => p.id),
      masteryProbability: state?.masteryProbability ?? 0,
      attemptsCount: state?.attemptsCount ?? 0,
      status: state?.status ?? "not_started",
    };
    graph.set(c.id, node);
    return {
      ...node,
      curriculumOrder: c.curriculumOrder,
      lastAttemptAt: state?.lastAttemptAt ?? null,
    };
  });

  const ranked = rankConcepts(candidates);

  // Cap the persisted queue to a digestible size; the engine can recompute fully anytime.
  const MAX_QUEUE = 25;
  const rationaleJson: Record<string, string> = {};
  const queue = [];
  for (const item of ranked.slice(0, MAX_QUEUE)) {
    const candidate = candidates.find((c) => c.id === item.conceptId);
    if (!candidate) continue;
    const concept = concepts.find((c) => c.id === item.conceptId);
    if (!concept) continue;
    const rationale = await generateRationale({
      conceptId: item.conceptId,
      conceptName: concept.name,
      masteryProbability: candidate.masteryProbability,
      attemptsCount: candidate.attemptsCount,
      isGap: isRawGap(candidate),
      daysSinceLastAttempt: candidate.lastAttemptAt
        ? Math.floor((Date.now() - candidate.lastAttemptAt.getTime()) / 86_400_000)
        : null,
      prerequisiteNames: [],
    });
    rationaleJson[item.conceptId] = rationale;
    queue.push({ conceptId: item.conceptId, kind: item.kind, score: item.score });
  }

  await prisma.learningPath.create({
    data: {
      studentId,
      queue,
      rationale: rationaleJson,
    },
  });

  logger.info(
    {
      studentId,
      triggeredByAttemptIds,
      queueLength: queue.length,
      durationMs: Date.now() - startedAt,
    },
    "learning path recomputed",
  );
}
