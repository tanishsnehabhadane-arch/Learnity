/**
 * BullMQ queue registry — typed job payloads for background work.
 */
import { Queue } from "bullmq";
import { getRedis } from "../lib/redis.ts";
import { logger } from "../lib/logger.ts";

export interface RecomputePathJob {
  studentId: string;
  /** Attempt ids that triggered this recompute (for tracing). */
  triggeredByAttemptIds: string[];
}

export interface EmbedJob {
  /** Content id (concept explanation, question, forum post) to embed. */
  entityId: string;
  kind: "explanation" | "question" | "post";
  text: string;
}

export interface CalibrationJob {
  /** "nightly" or a targeted concept id. */
  scope: "all" | string;
}

export const QUEUE_NAMES = {
  recomputePath: "recompute-path",
  embed: "embed-content",
  recalibrate: "recalibrate-bkt",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2_000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

export function createQueues(): Record<QueueName, Queue> {
  const connection = getRedis();
  return {
    [QUEUE_NAMES.recomputePath]: new Queue<RecomputePathJob>(QUEUE_NAMES.recomputePath, {
      connection,
      defaultJobOptions,
    }),
    [QUEUE_NAMES.embed]: new Queue<EmbedJob>(QUEUE_NAMES.embed, { connection, defaultJobOptions }),
    [QUEUE_NAMES.recalibrate]: new Queue<CalibrationJob>(QUEUE_NAMES.recalibrate, {
      connection,
      defaultJobOptions,
    }),
  };
}

/** Lazily-created shared queue registry for route code. */
let registry: Record<QueueName, Queue> | null = null;

export function queues(): Record<QueueName, Queue> {
  registry ??= createQueues();
  return registry;
}

/**
 * Enqueue with graceful degradation: when Redis is unreachable (bare dev
 * setup), recompute-path jobs execute inline instead of via BullMQ so the
 * adaptive loop still closes; other queues are skipped with a warning.
 */
export async function enqueue(
  name: QueueName,
  jobName: string,
  data: RecomputePathJob | EmbedJob | CalibrationJob,
): Promise<boolean> {
  const { redisHealthy } = await import("../lib/redis.ts");
  if (await redisHealthy()) {
    await (queues()[name] as Queue<unknown>).add(jobName, data as unknown);
    return true;
  }
  if (name === QUEUE_NAMES.recomputePath) {
    const { handleRecomputePath } = await import("./recompute-path.ts");
    logger.warn({ job: jobName }, "redis unavailable — running path recompute inline (degraded dev mode)");
    await handleRecomputePath({ data: data as RecomputePathJob });
    return true;
  }
  logger.warn({ queue: name, job: jobName }, "redis unavailable — job skipped (degraded dev mode)");
  return false;
}
