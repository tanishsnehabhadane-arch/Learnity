/**
 * Redis client factory — shared by the rate limiter and BullMQ.
 * Dev-resilient: when Redis is unreachable, redisHealthy() reports false and
 * callers degrade gracefully (jobs skipped, rate limit open) instead of 500s.
 */
import { Redis } from "ioredis";
import { env } from "../env.ts";
import { logger } from "./logger.ts";

let client: Redis | null = null;
let lastCheck = 0;
let lastResult = false;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      // Keep reconnecting quietly; redisHealthy() gates all usage.
      retryStrategy: (times) => Math.min(times * 2_000, 30_000),
      enableOfflineQueue: false,
    });
    client.on("error", () => {
      /* handled via redisHealthy() polling — no unhandled error events */
    });
  }
  return client;
}

/** Cached health probe (2s TTL) so hot paths don't ping Redis every call. */
export async function redisHealthy(): Promise<boolean> {
  const now = Date.now();
  if (now - lastCheck < 2_000) return lastResult;
  lastCheck = now;
  try {
    lastResult = (await getRedis().ping()) === "PONG";
  } catch {
    lastResult = false;
  }
  if (!lastResult) logger.debug("redis unreachable — degraded mode");
  return lastResult;
}

export async function closeRedis(): Promise<void> {
  await client?.quit();
  client = null;
}
