/**
 * Diagnostic assessment endpoints — Computerized Adaptive Testing with the
 * 2PL IRT model. Termination is explicit (SE threshold or item cap), never a
 * fixed question count. On completion, kicks off the first path recompute.
 */
import type { FastifyPluginAsync } from "fastify";
import { config } from "../config.ts";
import { estimateThetaMLE, standardError, type ResponseRecord } from "../engines/irt.ts";
import { selectNextItem, shouldTerminate, type CatItem } from "../engines/cat.ts";
import { requireAuth } from "../lib/auth.ts";
import { Errors } from "../lib/errors.ts";
import { prisma } from "../services/prisma.ts";
import { ingestAttempt } from "../services/attempt-ingestion.ts";
import { enqueue, QUEUE_NAMES } from "../jobs/queues.ts";
import { diagnosticStartSchema, diagnosticAnswerSchema, sessionIdParams } from "./schemas.ts";

/** Shape returned to the frontend (never leaks answerKey). */
export interface PresentedItem {
  questionId: string;
  conceptId: string;
  type: string;
  body: string;
  choices: unknown;
  difficulty: number; // display 1-10
}

export function presentItem(question: {
  id: string;
  conceptId: string;
  type: string;
  body: string;
  payload: unknown;
  difficulty: number;
}): PresentedItem {
  return {
    questionId: question.id,
    conceptId: question.conceptId,
    type: question.type,
    body: question.body,
    choices: (question.payload as { choices?: unknown })?.choices ?? null,
    difficulty: Math.round(((Math.min(3, Math.max(-3, question.difficulty)) + 3) / 6) * 9) + 1,
  };
}

export const diagnosticRoutes: FastifyPluginAsync = async (app) => {
  app.post("/diagnostic/start", { preHandler: requireAuth("student") }, async (request) => {
    const body = diagnosticStartSchema.parse(request.body);
    const studentId = request.user!.sub;

    // Mid-range start: b ≈ 0 per subject (spec)
    const candidates = await prisma.question.findMany({
      where: { concept: { topic: { subjectId: body.subjectId } } },
      orderBy: [{ difficulty: "asc" }],
    });
    if (candidates.length === 0) throw Errors.notFound("no items for subject");

    const closest = candidates.reduce((best, q) =>
      Math.abs(q.difficulty) < Math.abs(best.difficulty) ? q : best,
    );

    const session = await prisma.quizSession.create({
      data: {
        studentId,
        mode: "diagnostic",
        startingDifficulty: closest.difficulty,
      },
    });

    return {
      sessionId: session.id,
      firstItem: presentItem(closest),
      calibrationInfo: {
        message: "Calibrating your level — question count adapts to your responses.",
        maxItems: config.cat.maxItems,
      },
    };
  });

  app.post<{ Params: z.infer<typeof sessionIdParams> }>("/diagnostic/:sessionId/answer", {
    preHandler: requireAuth("student"),
  }, async (request) => {
    const { sessionId } = sessionIdParams.parse(request.params);
    const body = diagnosticAnswerSchema.parse(request.body);
    const studentId = request.user!.sub;

    const session = await prisma.quizSession.findFirst({ where: { id: sessionId, studentId } });
    if (!session) throw Errors.notFound("session");
    if (session.endedAt) throw Errors.conflict("session already completed");

    // Grade + ingest (updates BKT/IRT, records attempt)
    const result = await ingestAttempt(studentId, session, body);

    // Recompute CAT state from this session's attempts
    const attempts = await prisma.attempt.findMany({
      where: { quizSessionId: sessionId },
      include: { question: { select: { difficulty: true, discrimination: true, id: true } } },
      orderBy: { createdAt: "asc" },
    });
    const responses: ResponseRecord[] = attempts.map((a) => ({
      isCorrect: a.isCorrect,
      a: a.question.discrimination,
      b: a.question.difficulty,
    }));
    const { theta, se } = estimateThetaMLE(responses);
    const excluded = new Set(attempts.map((a) => a.question.id));

    // Termination: SE < threshold OR maxItems — explicit, not fixed-length
    const subjectId = (
      await prisma.question.findUnique({
        where: { id: body.questionId },
        select: { concept: { select: { topic: { select: { subjectId: true } } } } },
      })
    )?.concept.topic.subjectId;

    if (subjectId === undefined) throw Errors.notFound("question");

    const allItems = await prisma.question.findMany({
      where: { concept: { topic: { subjectId } } },
      select: { id: true, difficulty: true, discrimination: true, conceptId: true },
    });
    const candidates: CatItem[] = allItems.map((q) => ({
      id: q.id,
      a: q.discrimination,
      b: q.difficulty,
      conceptId: q.conceptId,
    }));

    const done = shouldTerminate(se, attempts.length, config.cat);
    if (done) {
      const endedSession = await prisma.quizSession.update({
        where: { id: sessionId },
        data: { endedAt: new Date(), endingDifficulty: theta },
      });
      await enqueue(QUEUE_NAMES.recomputePath, "post-diagnostic", {
        studentId,
        triggeredByAttemptIds: attempts.slice(-5).map((a) => a.id),
      });
      return {
        nextItem: null,
        completed: true,
        calibration: { theta, se, itemsAdministered: attempts.length },
        lastAttempt: result,
        sessionId: endedSession.id,
      };
    }

    const decision = selectNextItem(candidates, { theta, itemsAdministered: attempts.length }, {
      ...config.cat,
      excludedItemIds: excluded,
    });

    if (decision.nextItem === null) {
      await prisma.quizSession.update({ where: { id: sessionId }, data: { endedAt: new Date() } });
      return { nextItem: null, completed: true, calibration: { theta, se, itemsAdministered: attempts.length }, lastAttempt: result };
    }

    const nextQuestion = await prisma.question.findUnique({ where: { id: decision.nextItem.id } });
    if (!nextQuestion) throw Errors.notFound("next question");

    return {
      nextItem: presentItem(nextQuestion),
      completed: false,
      calibration: { theta, se, itemsAdministered: attempts.length },
      lastAttempt: result,
    };
  });
};

import type { z } from "zod";
