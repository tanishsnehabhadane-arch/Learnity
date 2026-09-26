/**
 * Attempt ingestion — closes the adaptive loop on every answer:
 * 1. Grade the response (mcq/numeric graded server-side; code/short_answer stub).
 * 2. Record the Attempt row.
 * 3. Update LearnerConceptState (BKT) + per-subject ability vector (IRT).
 * 4. Flag gaps (status change) and enqueue learning-path recompute.
 */
import type { QuizSession, Question } from "../generated/prisma/index.js";
import { config } from "../config.ts";
import { updateMastery, confidenceCalibrationDelta, defaultParams } from "../engines/bkt.ts";
import { estimateThetaMLE, type ResponseRecord } from "../engines/irt.ts";
import { prisma } from "./prisma.ts";
import { enqueue, QUEUE_NAMES } from "../jobs/queues.ts";
import { logger } from "../lib/logger.ts";
import { Errors } from "../lib/errors.ts";

export interface AnswerSubmission {
  questionId: string;
  answer?: string;
  responseTimeMs: number;
  confidenceRating?: number;
}

export interface IngestionResult {
  attemptId: string;
  isCorrect: boolean;
  updatedMastery: number;
  status: "not_started" | "in_progress" | "gap_detected" | "mastered";
  gapFlagged: boolean;
}

/** Server-side grading. STUB: code execution grading lands with the playground phase. */
export function gradeAnswer(question: Question, answer: string | undefined): boolean {
  if (answer === undefined || answer === "") return false;
  const expected = question.answerKey.trim().toLowerCase();
  const given = answer.trim().toLowerCase();
  if (question.type === "numeric") {
    return Number.isFinite(Number(given)) && Number(given) === Number(expected);
  }
  return given === expected;
}

export async function ingestAttempt(
  studentId: string,
  session: Pick<QuizSession, "id" | "mode"> | null,
  submission: AnswerSubmission,
): Promise<IngestionResult> {
  const question = await prisma.question.findUnique({
    where: { id: submission.questionId },
    include: { concept: { include: { topic: true } } },
  });
  if (!question) throw Errors.notFound("question");

  const isCorrect = gradeAnswer(question, submission.answer);
  const now = new Date();

  // 1. Record the attempt
  const attempt = await prisma.attempt.create({
    data: {
      studentId,
      questionId: question.id,
      quizSessionId: session?.id ?? null,
      isCorrect,
      responseTimeMs: submission.responseTimeMs,
      confidenceRating: submission.confidenceRating,
      difficultyAtAttempt: question.difficulty,
    },
  });

  // 2. BKT update for this concept
  const params = defaultParams(); // swapped for per-concept calibrated params in Phase 11
  const existingState = await prisma.learnerConceptState.upsert({
    where: { studentId_conceptId: { studentId, conceptId: question.conceptId } },
    create: { studentId, conceptId: question.conceptId },
    update: {},
  });

  const bkt = updateMastery(
    { mastery: existingState?.masteryProbability ?? 0, attemptsCount: existingState?.attemptsCount ?? 0 },
    isCorrect,
    params,
  );

  // Confidence calibration (over/underconfidence signal)
  const calibration =
    submission.confidenceRating !== undefined
      ? confidenceCalibrationDelta(
          existingState?.confidenceCalibration ?? 0,
          existingState?.attemptsCount ?? 0,
          submission.confidenceRating,
          isCorrect,
        )
      : (existingState?.confidenceCalibration ?? 0);

  await prisma.learnerConceptState.update({
    where: { studentId_conceptId: { studentId, conceptId: question.conceptId } },
    data: {
      masteryProbability: bkt.mastery,
      attemptsCount: { increment: 1 },
      lastAttemptAt: now,
      status: bkt.status,
      confidenceCalibration: calibration,
      abilityEstimate: await estimateConceptTheta(studentId, question.conceptId),
    },
  });

  // 3. Per-subject ability vector (theta across all attempts in this subject)
  await updateSubjectAbilityVector(studentId, question.concept.topic.subjectId);

  // 4. Gap flagging + async path recompute (the loop must close)
  const gapFlagged = bkt.status === "gap_detected" && existingState?.status !== "gap_detected";
  await enqueue(QUEUE_NAMES.recomputePath, "recompute", {
    studentId,
    triggeredByAttemptIds: [attempt.id],
  });

  logger.info(
    { studentId, conceptId: question.conceptId, isCorrect, mastery: bkt.mastery.toFixed(3), status: bkt.status },
    "attempt ingested",
  );

  return {
    attemptId: attempt.id,
    isCorrect,
    updatedMastery: bkt.mastery,
    status: bkt.status,
    gapFlagged,
  };
}

/** IRT theta over this student's attempts on one concept (EAP fallback handles extremes). */
async function estimateConceptTheta(studentId: string, conceptId: string): Promise<number> {
  const attempts = await prisma.attempt.findMany({
    where: { studentId, question: { conceptId } },
    include: { question: { select: { difficulty: true, discrimination: true } } },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  const responses: ResponseRecord[] = attempts.map((a) => ({
    isCorrect: a.isCorrect,
    a: a.question.discrimination,
    b: a.question.difficulty,
  }));
  return estimateThetaMLE(responses).theta;
}

/** Recomputes and persists the student's per-subject theta vector. */
async function updateSubjectAbilityVector(studentId: string, subjectId: string): Promise<void> {
  const attempts = await prisma.attempt.findMany({
    where: { studentId, question: { concept: { topic: { subjectId } } } },
    include: { question: { select: { difficulty: true, discrimination: true } } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  const responses: ResponseRecord[] = attempts.map((a) => ({
    isCorrect: a.isCorrect,
    a: a.question.discrimination,
    b: a.question.difficulty,
  }));
  const { theta } = estimateThetaMLE(responses);

  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { currentAbilityVector: true } });
  const vector = (student?.currentAbilityVector as Record<string, number>) ?? {};
  vector[subjectId] = Number(theta.toFixed(4));
  await prisma.student.update({ where: { id: studentId }, data: { currentAbilityVector: vector } });
}

export const GAP_THRESHOLD = config.bkt.gapThreshold;
