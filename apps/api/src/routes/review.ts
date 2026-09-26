/**
 * Spaced-repetition review endpoints (SM-2 scheduler) + planner session stubs.
 */
import type { FastifyPluginAsync } from "fastify";
import { schedule } from "../engines/sm2.ts";
import { requireAuth } from "../lib/auth.ts";
import { Errors } from "../lib/errors.ts";
import { prisma } from "../services/prisma.ts";
import { reviewRateSchema, itemIdParams, scheduleSessionSchema } from "./schemas.ts";
import type { z } from "zod";

export const reviewRoutes: FastifyPluginAsync = async (app) => {
  app.get("/due", { preHandler: requireAuth("student") }, async (request) => {
    const studentId = request.user!.sub;
    const items = await prisma.reviewItem.findMany({
      where: { studentId, dueAt: { lte: new Date() } },
      include: { concept: { select: { id: true, name: true, topic: { select: { name: true } } } } },
      orderBy: { dueAt: "asc" },
      take: 50,
    });
    return {
      dueCount: items.length,
      items: items.map((i) => ({
        id: i.id,
        conceptId: i.concept.id,
        conceptName: i.concept.name,
        topicName: i.concept.topic.name,
        interval: i.interval,
        easeFactor: i.easeFactor,
        repetitions: i.repetitions,
        dueAt: i.dueAt.toISOString(),
      })),
    };
  });

  app.post<{ Params: z.infer<typeof itemIdParams> }>("/:itemId/rate", {
    preHandler: requireAuth("student"),
  }, async (request) => {
    const { itemId } = itemIdParams.parse(request.params);
    const body = reviewRateSchema.parse(request.body);
    const studentId = request.user!.sub;

    const item = await prisma.reviewItem.findFirst({ where: { id: itemId, studentId } });
    if (!item) throw Errors.notFound("review item");

    const next = schedule(
      { easeFactor: item.easeFactor, interval: item.interval, repetitions: item.repetitions },
      body.rating,
    );

    const updated = await prisma.reviewItem.update({
      where: { id: item.id },
      data: {
        easeFactor: next.easeFactor,
        interval: next.interval,
        repetitions: next.repetitions,
        dueAt: next.dueAt,
        lastRated: body.rating,
      },
    });

    return {
      id: updated.id,
      interval: updated.interval,
      easeFactor: updated.easeFactor,
      dueAt: updated.dueAt.toISOString(),
    };
  });

  app.post("/sessions", { preHandler: requireAuth("student") }, async (request) => {
    const body = scheduleSessionSchema.parse(request.body);
    const studentId = request.user!.sub;
    // STUB: StudySession model + calendar UI land in the planner phase;
    // for now a scheduled session materializes as a review item due at that time.
    const review = await prisma.reviewItem.create({
      data: {
        studentId,
        conceptId: body.conceptId,
        dueAt: new Date(body.scheduledFor),
      },
    });
    return { id: review.id, dueAt: review.dueAt.toISOString() };
  });
};
