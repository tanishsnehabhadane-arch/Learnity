/**
 * Analytics endpoints: mastery heatmap (topic × confidence grid data) and
 * per-concept attempt history for drill-downs.
 */
import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../lib/auth.ts";
import { Errors } from "../lib/errors.ts";
import { getMasteryHeatmap, getConceptHistory } from "../services/analytics.ts";
import { studentIdParams, conceptIdParams } from "./schemas.ts";
import type { z } from "zod";

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.get<{
    Params: z.infer<typeof studentIdParams>;
    Querystring: { subject?: string; sinceDays?: string };
  }>("/:studentId/mastery-heatmap", { preHandler: requireAuth() }, async (request) => {
    const { studentId } = studentIdParams.parse(request.params);
    if (request.user?.role === "student" && request.user.sub !== studentId) throw Errors.forbidden();

    const sinceDays = request.query.sinceDays ? Number(request.query.sinceDays) : undefined;
    return getMasteryHeatmap(studentId, {
      subject: request.query.subject,
      sinceDays: Number.isFinite(sinceDays) ? sinceDays : undefined,
    });
  });

  app.get<{ Params: z.infer<typeof studentIdParams> & z.infer<typeof conceptIdParams> }>(
    "/:studentId/concept/:conceptId/history",
    { preHandler: requireAuth() },
    async (request) => {
      const { studentId } = studentIdParams.parse(request.params);
      const { conceptId } = conceptIdParams.parse(request.params);
      if (request.user?.role === "student" && request.user.sub !== studentId) throw Errors.forbidden();
      return { history: await getConceptHistory(studentId, conceptId) };
    },
  );
};
