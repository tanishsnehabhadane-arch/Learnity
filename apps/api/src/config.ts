/**
 * Central application configuration (non-secret values derive from env.ts).
 */
import { env } from "./env.ts";

export const config = {
  port: env.PORT,
  corsOrigin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtlSeconds: env.JWT_ACCESS_TTL,
    refreshTtlSeconds: env.JWT_REFRESH_TTL,
  },
  ai: {
    /** auto: prefer gemini when GEMINI_API_KEY is set, else anthropic. */
    provider: env.AI_PROVIDER,
    anthropicApiKey: env.ANTHROPIC_API_KEY ?? "",
    model: env.ANTHROPIC_MODEL,
    geminiApiKey: env.GEMINI_API_KEY ?? "",
    geminiModel: env.GEMINI_MODEL,
    /** Token-bucket defaults for AI-generation endpoints (per student). */
    rateLimit: { tokens: 20, refillPerMinute: 10 },
  },
  cat: {
    /** Stop the diagnostic when the standard error of theta drops below this. */
    seTerminationThreshold: 0.3,
    /** Hard cap on diagnostic items per subject. */
    maxItems: 20,
  },
  bkt: {
    /** Seed parameters used when no calibrated data exists for a concept. */
    defaults: { pGuess: 0.2, pSlip: 0.1, pTransit: 0.15 },
    masteryThreshold: 0.95,
    gapThreshold: 0.4,
    minAttemptsForGapFlag: 3,
  },
  path: {
    /** Interleave 1 review item per N new-content items. */
    reviewInterleaveRatio: 4,
  },
} as const;
