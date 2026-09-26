/**
 * Educator routes — cohort-level mastery overview, students flagged with 3+
 * open knowledge gaps, per-student drill-down. Scoped to the educator's cohorts.
 * STUB: CSV export lands with the dashboard UI phase.
 */
import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../lib/auth.ts";
import { Errors } from "../lib/errors.ts";
import { prisma } from "../services/prisma.ts";
import { cohortIdParams, studentIdParams } from "./schemas.ts";
import type { z } from "zod";

export const educatorRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: z.infer<typeof cohortIdParams> }>("/cohort/:cohortId/overview", {
    preHandler: requireAuth("educator"),
  }, async (request) => {
    const { cohortId } = cohortIdParams.parse(request.params);
    await assertCohortAccess(request.user!.sub, cohortId);

    const memberships = await prisma.cohortMembership.findMany({
      where: { cohortId },
      include: { student: { include: { learnerStates: true } } },
    });

    const students = memberships.map(({ student }) => {
      const openGaps = student.learnerStates.filter((s) => s.status === "gap_detected");
      const avgMastery =
        student.learnerStates.length > 0
          ? student.learnerStates.reduce((sum, s) => sum + s.masteryProbability, 0) /
            student.learnerStates.length
          : 0;
      return {
        studentId: student.id,
        name: student.name,
        avgMastery: Number(avgMastery.toFixed(3)),
        openGapCount: openGaps.length,
        flagged: openGaps.length >= 3,
        gapConcepts: openGaps.map((g) => g.conceptId),
      };
    });

    return {
      cohortId,
      studentCount: students.length,
      flaggedCount: students.filter((s) => s.flagged).length,
      students: students.sort((a, b) => b.openGapCount - a.openGapCount),
    };
  });

  app.get<{ Params: z.infer<typeof studentIdParams> }>("/students/:studentId", {
    preHandler: requireAuth("educator"),
  }, async (request) => {
    const { studentId } = studentIdParams.parse(request.params);
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        learnerStates: { include: { concept: { select: { id: true, name: true } } } },
        cohorts: { select: { cohortId: true } },
      },
    });
    if (!student) throw Errors.notFound("student");

    // Educators may only see students in their own cohorts
    const accessible = await prisma.cohortMembership.findMany({
      where: { cohort: { educatorId: request.user!.sub } },
      select: { studentId: true },
    });
    const allowed = new Set(accessible.map((a) => a.studentId));
    if (!allowed.has(studentId)) throw Errors.forbidden();

    return {
      studentId: student.id,
      name: student.name,
      concepts: student.learnerStates.map((s) => ({
        conceptId: s.concept.id,
        conceptName: s.concept.name,
        masteryProbability: s.masteryProbability,
        status: s.status,
        attemptsCount: s.attemptsCount,
        confidenceCalibration: s.confidenceCalibration,
      })),
    };
  });
};

async function assertCohortAccess(educatorId: string, cohortId: string): Promise<void> {
  const cohort = await prisma.cohort.findFirst({ where: { id: cohortId, educatorId } });
  if (!cohort) throw Errors.forbidden();
}
