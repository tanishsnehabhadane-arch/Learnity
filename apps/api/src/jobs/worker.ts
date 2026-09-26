/**
 * Background worker entry: registers processors for all queues and schedules
 * the nightly BKT recalibration. Run standalone: `node dist/jobs/worker.js`
 * (docker-compose `worker` service runs exactly this).
 */
import { Worker } from "bullmq";
import { QUEUE_NAMES, createQueues, type RecomputePathJob, type CalibrationJob, type EmbedJob } from "./queues.ts";
import { getRedis, closeRedis } from "../lib/redis.ts";
import { logger } from "../lib/logger.ts";
import { handleRecomputePath } from "./recompute-path.ts";
import { handleRecalibrate } from "./recalibrate.ts";

const queues = createQueues();
const connection = getRedis();

const workers = [
  new Worker<RecomputePathJob>(
    QUEUE_NAMES.recomputePath,
    (job) => handleRecomputePath(job),
    { connection, concurrency: 4 },
  ),
  new Worker<EmbedJob>(QUEUE_NAMES.embed, async () => {
    // STUB: pgvector embedding pipeline lands with the tutor-context phase.
    logger.debug("embed job acknowledged (stub)");
  }),
  new Worker<CalibrationJob>(QUEUE_NAMES.recalibrate, (job) => handleRecalibrate(job), {
    connection,
    concurrency: 1,
  }),
];

const NIGHTLY_MS = 24 * 60 * 60 * 1000;

async function scheduleNightlyRecalibration(): Promise<void> {
  // Simple interval scheduler; swap for BullMQ repeatable jobs in production.
  await queues[QUEUE_NAMES.recalibrate].add("nightly", { scope: "all" }, { delay: NIGHTLY_MS });
  setInterval(
    () => {
      void queues[QUEUE_NAMES.recalibrate]
        .add("nightly", { scope: "all" })
        .catch((err) => logger.error({ err }, "failed to enqueue nightly recalibration"));
    },
    NIGHTLY_MS,
  );
}

void scheduleNightlyRecalibration();

for (const worker of workers) {
  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, queue: worker.name, err: err.message }, "job failed");
  });
}

logger.info({ queues: workers.map((w) => w.name) }, "worker started");

async function shutdown(): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
  await closeRedis();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
