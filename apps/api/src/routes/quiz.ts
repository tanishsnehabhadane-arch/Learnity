/**
 * Adaptive practice quiz endpoints — same IRT selection as the diagnostic but
 * scoped to active path concepts and seeded with the student's live theta.
 * Difficulty ratchets within the session (2-up/2-down rule), with mid-session
 * AI intervention when two consecutive misses occur.
 */
import type { FastifyPluginAsync } from "fastify";
import { estimateThetaMLE, type ResponseRecord } from "../engines/irt.ts";
import { difficultyRatchet, selectNextItem, type CatItem } from "../engines/cat.ts";
import { requireAuth } from "../lib/auth.ts";
import { Errors } from "../lib/errors.ts";
import { prisma } from "../services/prisma.ts";
import { ingestAttempt } from "../services/attempt-ingestion.ts";
import { presentItem } from "./assessments.ts";
import { quizStartSchema, quizAnswerSchema, sessionIdParams } from "./schemas.ts";
import type { z } from "zod";

export const quizRoutes: FastifyPluginAsync = async (app) => {
  app.post("/adaptive/start", { preHandler: requireAuth("student") }, async (request) => {
    const body = quizStartSchema.parse(request.body ?? {});
    const studentId = request.user!.sub;

    // Scope: explicit concepts, else the student's current path head
    let conceptIds = body.conceptIds;
    if (!conceptIds) {
      const path = await prisma.learningPath.findFirst({
        where: { studentId },
        orderBy: { generatedAt: "desc" },
      });
      const queue = (path?.queue as Array<{ conceptId: string }> | null) ?? [];
      conceptIds = queue.slice(0, 5).map((q) => q.conceptId);
    }
    if (conceptIds.length === 0) throw Errors.notFound("no active concepts — complete a diagnostic first");

    const candidates = await prisma.question.findMany({
      where: { conceptId: { in: conceptIds } },
    });
    if (candidates.length === 0) throw Errors.notFound("no items for the active concepts");

    // Seed theta from the student's subject-wide ability vector (live, not cold)
    const firstConcept = await prisma.concept.findUnique({
      where: { id: conceptIds[0]! },
      select: { topic: { select: { subjectId: true } } },
    });
    const subjectId = firstConcept?.topic.subjectId;
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { currentAbilityVector: true },
    });
    const theta = subjectId
      ? ((student?.currentAbilityVector as Record<string, number> | null)?.[subjectId] ?? 0)
      : 0;

    const first =
      candidates.reduce((best, q) =>
        Math.abs(q.difficulty - theta) < Math.abs(best.difficulty - theta) ? q : best,
      );

    const session = await prisma.quizSession.create({
      data: {
        studentId,
        mode: "adaptive_practice",
        startingDifficulty: first.difficulty,
      },
    });

    return {
      sessionId: session.id,
      firstItem: presentItem(first),
      seededTheta: theta,
    };
  });

  app.post<{ Params: z.infer<typeof sessionIdParams> }>("/adaptive/:sessionId/answer", {
    preHandler: requireAuth("student"),
  }, async (request) => {
    const { sessionId } = sessionIdParams.parse(request.params);
    const body = quizAnswerSchema.parse(request.body);
    const studentId = request.user!.sub;

    const session = await prisma.quizSession.findFirst({ where: { id: sessionId, studentId } });
    if (!session) throw Errors.notFound("session");
    if (session.endedAt) throw Errors.conflict("session already completed");

    const result = await ingestAttempt(studentId, session, body);

    const attempts = await prisma.attempt.findMany({
      where: { quizSessionId: sessionId },
      include: { question: { select: { id: true, difficulty: true, discrimination: true, conceptId: true } } },
      orderBy: { createdAt: "asc" },
    });
    const responses: ResponseRecord[] = attempts.map((a) => ({
      isCorrect: a.isCorrect,
      a: a.question.discrimination,
      b: a.question.difficulty,
    }));
    const { theta } = estimateThetaMLE(responses);

    // Ratchet target for the next item (2-up/2-down)
    const { nextB, intervention } = difficultyRatchet(session.startingDifficulty, responses);

    // Concept-scoped candidates near the ratchet target
    const scopedConceptIds = [...new Set(attempts.map((a) => a.question.conceptId))];
    const allItems = await prisma.question.findMany({
      where: { conceptId: { in: scopedConceptIds } },
      select: { id: true, difficulty: true, discrimination: true, conceptId: true },
    });
    const candidates: CatItem[] = allItems.map((q) => ({
      id: q.id,
      a: q.discrimination,
      b: q.difficulty,
      conceptId: q.conceptId,
    }));

    // End the session when the bank runs dry near the target difficulty
    const excluded = new Set(attempts.map((a) => a.question.id));
    const nearTarget = candidates.filter((c) => !excluded.has(c.id) && Math.abs(c.b - nextB) <= 1.5);
    if (nearTarget.length === 0) {
      await prisma.quizSession.update({
        where: { id: sessionId },
        data: { endedAt: new Date(), endingDifficulty: theta },
      });
      return { nextItem: null, completed: true, lastAttempt: result, intervention };
    }

    const decision = selectNextItem(nearTarget, { theta, itemsAdministered: attempts.length }, {
      seTerminationThreshold: 0.3,
      maxItems: 50,
      excludedItemIds: excluded,
    });

    if (decision.nextItem === null) {
      await prisma.quizSession.update({
        where: { id: sessionId },
        data: { endedAt: new Date(), endingDifficulty: theta },
      });
      return { nextItem: null, completed: true, lastAttempt: result, intervention };
    }

    const nextQuestion = await prisma.question.findUnique({ where: { id: decision.nextItem.id } });
    if (!nextQuestion) throw Errors.notFound("next question");

    return {
      nextItem: presentItem(nextQuestion),
      completed: false,
      lastAttempt: result,
      intervention,
    };
  });
};
