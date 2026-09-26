/**
 * Concept routes — gap status + prerequisite chain for the frontend's
 * learning-path tree and gap surfacing UI.
 * GET /api/concepts/:id/gaps → this student's actionable gaps (DAG-resolved).
 */
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { detectGaps, type ConceptGraphNode } from "../engines/gap-detection.ts";
import { requireAuth } from "../lib/auth.ts";
import { Errors } from "../lib/errors.ts";
import { prisma } from "../services/prisma.ts";

const idParams = z.object({ id: z.string().min(1) });

export const conceptRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: z.infer<typeof idParams> }>("/:id/gaps", {
    preHandler: requireAuth(),
  }, async (request) => {
    const { id: studentId } = idParams.parse(request.params);
    if (request.user?.role === "student" && request.user.sub !== studentId) throw Errors.forbidden();

    const states = await prisma.learnerConceptState.findMany({
      where: { studentId },
      include: { concept: { include: { prerequisites: { select: { id: true } } } } },
    });

    const graph = new Map<string, ConceptGraphNode>();
    for (const s of states) {
      graph.set(s.conceptId, {
        id: s.conceptId,
        prerequisiteIds: s.concept.prerequisites.map((p) => p.id),
        masteryProbability: s.masteryProbability,
        attemptsCount: s.attemptsCount,
        status: s.status,
      });
    }

    const gaps = detectGaps(graph);
    const conceptNames = new Map(states.map((s) => [s.conceptId, s.concept.name]));

    return {
      gaps: gaps.map((g) => ({
        ...g,
        conceptName: conceptNames.get(g.conceptId) ?? g.conceptId,
        observedOnName: conceptNames.get(g.observedOn) ?? g.observedOn,
      })),
    };
  });
};
