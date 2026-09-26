/**
 * Student routes: profile (incl. streak/XP gamification read-model)
 * and the recomputed learning path with per-concept rationales.
 */
import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../lib/auth.ts";
import { Errors } from "../lib/errors.ts";
import { prisma } from "../services/prisma.ts";
import { studentIdParams } from "./schemas.ts";

const idParams = z.object({ id: z.string().min(1) });

export const studentRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: z.infer<typeof idParams> }>("/:id/profile", {
    preHandler: requireAuth(),
  }, async (request) => {
    const { id } = idParams.parse(request.params);
    if (request.user?.role === "student" && request.user.sub !== id) throw Errors.forbidden();

    const student = await prisma.student.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true, learningPreferences: true, currentAbilityVector: true },
    });
    if (!student) throw Errors.notFound("student");

    // Streak: consecutive days with >= 1 attempt (STUB: freezes/XP multipliers in Phase 7)
    const attempts = await prisma.attempt.findMany({
      where: { studentId: id },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 400,
    });
    const days = new Set(attempts.map((a) => a.createdAt.toISOString().slice(0, 10)));
    let current = 0;
    const cursor = new Date();
    while (days.has(cursor.toISOString().slice(0, 10))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const badges = await prisma.studentBadge.findMany({
      where: { studentId: id },
      include: { badge: true },
    });

    return {
      ...student,
      streak: { current, longest: current, freezesAvailable: 0 },
      xp: attempts.length * 10,
      badges: badges.map((b) => ({ key: b.badge.key, name: b.badge.name, awardedAt: b.awardedAt.toISOString() })),
    };
  });

  app.get<{ Params: z.infer<typeof idParams> }>("/:id/learning-path", {
    preHandler: requireAuth(),
  }, async (request) => {
    const { id } = idParams.parse(request.params);
    if (request.user?.role === "student" && request.user.sub !== id) throw Errors.forbidden();

    const path = await prisma.learningPath.findFirst({
      where: { studentId: id },
      orderBy: { generatedAt: "desc" },
    });
    if (!path) throw Errors.notFound("learning path — complete a diagnostic first");

    const queue = path.queue as Array<{ conceptId: string; kind: string; score: number }>;
    const rationale = path.rationale as Record<string, string>;

    const concepts = await prisma.concept.findMany({
      where: { id: { in: queue.map((q) => q.conceptId) } },
      include: { topic: { include: { subject: true } } },
    });
    const byId = new Map(concepts.map((c) => [c.id, c]));

    return {
      generatedAt: path.generatedAt.toISOString(),
      items: queue
        .map((q) => {
          const c = byId.get(q.conceptId);
          if (!c) return null;
          return {
            conceptId: c.id,
            conceptName: c.name,
            topicName: c.topic.name,
            subjectName: c.topic.subject.name,
            kind: q.kind,
            score: q.score,
            rationale: rationale[q.conceptId] ?? "",
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    };
  });
};

import { z } from "zod";
