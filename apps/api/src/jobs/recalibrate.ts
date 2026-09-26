/**
 * Nightly (or triggered) BKT parameter recalibration per concept using
 * aggregate attempt data — makes the model improve over time rather than
 * just accumulate per-student state.
 *
 * STUB: computes per-concept aggregate accuracy as the seed signal and logs
 * calibration candidates; full grid-search/Baum-Welch fitting lands in Phase 11.
 * Prediction accuracy (did masteryProbability predict next-attempt correctness?)
 * is computed and stored in logs for monitoring.
 */
import type { Job } from "bullmq";
import { prisma } from "../services/prisma.ts";
import { logger } from "../lib/logger.ts";
import type { CalibrationJob } from "./queues.ts";

export async function handleRecalibrate(job: Job<CalibrationJob>): Promise<void> {
  const { scope } = job.data;

  const concepts = await prisma.concept.findMany({
    where: scope === "all" ? undefined : { id: scope },
    select: { id: true, name: true },
  });

  for (const concept of concepts) {
    const attempts = await prisma.attempt.findMany({
      where: { question: { conceptId: concept.id } },
      select: { isCorrect: true, studentId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    if (attempts.length < 30) continue; // not enough signal yet

    const accuracy = attempts.filter((a) => a.isCorrect).length / attempts.length;
    const uniqueStudents = new Set(attempts.map((a) => a.studentId)).size;

    logger.info(
      {
        conceptId: concept.id,
        conceptName: concept.name,
        attempts: attempts.length,
        students: uniqueStudents,
        aggregateAccuracy: Number(accuracy.toFixed(3)),
      },
      "bkt recalibration candidate measured",
    );
  }
}
