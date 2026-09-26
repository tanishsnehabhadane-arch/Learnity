/**
 * Analytics read-model queries backing the frontend heatmap + drill-downs.
 */
import { prisma } from "./prisma.ts";

export interface HeatmapCell {
  conceptId: string;
  conceptName: string;
  topicName: string;
  subjectName: string;
  /** Average confidence (mastery probability) across the date range. */
  confidence: number;
  /** Exact accuracy 0-1. */
  accuracy: number;
  attemptCount: number;
  lastAttemptedAt: string | null;
}

export interface MasteryHeatmap {
  cells: HeatmapCell[];
  subjects: string[];
}

export async function getMasteryHeatmap(
  studentId: string,
  opts: { subject?: string; sinceDays?: number } = {},
): Promise<MasteryHeatmap> {
  const since = new Date(Date.now() - (opts.sinceDays ?? 30) * 86_400_000);

  const states = await prisma.learnerConceptState.findMany({
    where: {
      studentId,
      concept: opts.subject
        ? { topic: { subject: { name: opts.subject } } }
        : undefined,
    },
    include: {
      concept: { include: { topic: { include: { subject: true } } } },
    },
  });

  const cells: HeatmapCell[] = await Promise.all(
    states.map(async (s) => {
      const attempts = await prisma.attempt.findMany({
        where: { studentId, question: { conceptId: s.conceptId }, createdAt: { gte: since } },
        select: { isCorrect: true },
      });
      const correct = attempts.filter((a) => a.isCorrect).length;
      return {
        conceptId: s.conceptId,
        conceptName: s.concept.name,
        topicName: s.concept.topic.name,
        subjectName: s.concept.topic.subject.name,
        confidence: s.masteryProbability,
        accuracy: attempts.length > 0 ? correct / attempts.length : 0,
        attemptCount: attempts.length,
        lastAttemptedAt: s.lastAttemptAt?.toISOString() ?? null,
      };
    }),
  );

  return {
    cells,
    subjects: [...new Set(cells.map((c) => c.subjectName))].sort(),
  };
}

export interface ConceptHistoryPoint {
  at: string;
  isCorrect: boolean;
  responseTimeMs: number;
  confidenceRating: number | null;
  difficulty: number;
}

export async function getConceptHistory(
  studentId: string,
  conceptId: string,
): Promise<ConceptHistoryPoint[]> {
  const attempts = await prisma.attempt.findMany({
    where: { studentId, question: { conceptId } },
    include: { question: { select: { difficulty: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return attempts.map((a) => ({
    at: a.createdAt.toISOString(),
    isCorrect: a.isCorrect,
    responseTimeMs: a.responseTimeMs,
    confidenceRating: a.confidenceRating,
    difficulty: a.question.difficulty,
  }));
}
