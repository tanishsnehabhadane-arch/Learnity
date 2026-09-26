/**
 * AI endpoints — explanations and practice-question generation with aggressive
 * caching, plus per-student token-bucket rate limiting to control LLM cost.
 * Student free-text is treated as untrusted data (prompt-injection defense).
 */
import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../lib/auth.ts";
import { Errors } from "../lib/errors.ts";
import { prisma } from "../services/prisma.ts";
import { aiEnabled, generate } from "../services/ai/claude.ts";
import { cachedOrGenerate } from "../services/ai/cache.ts";
import { difficultyBand } from "../engines/irt.ts";
import { explainSchema, practiceQuestionSchema } from "./schemas.ts";

/**
 * Redis token bucket: refills at refillPerMinute. Degrades open (allow) when
 * Redis is unavailable so AI endpoints stay usable in bare dev setups.
 */
async function consumeToken(studentId: string, capacity: number, refillPerMinute: number): Promise<boolean> {
  const { getRedis, redisHealthy } = await import("../lib/redis.ts");
  if (!(await redisHealthy())) return true;
  const redis = getRedis();
  const key = `ratelimit:ai:${studentId}`;
  const now = Date.now();
  const state = await redis.hmget(key, "tokens", "ts");
  const tokens = Math.min(capacity, Number(state[0] ?? capacity));
  const last = Number(state[1] ?? now);
  const refilled = Math.min(capacity, tokens + ((now - last) / 60_000) * refillPerMinute);
  if (refilled < 1) {
    await redis.hmset(key, { tokens: refilled, ts: now });
    return false;
  }
  await redis.hmset(key, { tokens: refilled - 1, ts: now });
  await redis.pexpire(key, 3_600_000);
  return true;
}

/** STUB: misconception signature from recent incorrect attempts (n-gram of wrong answer shapes). */
function misconceptionSignature(misconceptions: string[]): string {
  return misconceptions.length > 0 ? `sig-${misconceptions.length}` : "none";
}

export const aiRoutes: FastifyPluginAsync = async (app) => {
  app.post("/explain", { preHandler: requireAuth("student") }, async (request) => {
    const body = explainSchema.parse(request.body);
    const studentId = request.user!.sub;

    if (!(await consumeToken(studentId, 20, 10))) throw Errors.rateLimited();

    const concept = await prisma.concept.findUnique({
      where: { id: body.conceptId },
      include: { topic: { include: { subject: true } } },
    });
    if (!concept) throw Errors.notFound("concept");

    const state = await prisma.learnerConceptState.findUnique({
      where: { studentId_conceptId: { studentId, conceptId: body.conceptId } },
    });

    const recentWrong = await prisma.attempt.findMany({
      where: { studentId, question: { conceptId: body.conceptId }, isCorrect: false },
      include: { question: { select: { body: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    const signature = misconceptionSignature(recentWrong.map((a) => a.question.body.slice(0, 32)));
    const theta = state?.abilityEstimate ?? 0;

    const { content, cached } = await cachedOrGenerate<{ explanation: string }>(
      "explanation",
      body.conceptId,
      difficultyBand(theta),
      signature,
      async () => {
        if (!aiEnabled()) {
          return {
            explanation: `[stub] Explanation for "${concept.name}". Set ANTHROPIC_API_KEY to enable AI-generated explanations tailored to mastery ${(state?.masteryProbability ?? 0).toFixed(2)}.`,
          };
        }
        const text = await generate({
          system:
            "You explain academic concepts to students. Tailor depth to the student's mastery level. Use LaTeX for math. Max 200 words. No preamble.",
          user: [
            `Concept: ${concept.name} (${concept.topic.name}, ${concept.topic.subject.name})`,
            `Student mastery probability: ${(state?.masteryProbability ?? 0).toFixed(2)}`,
            `Recent incorrect attempts on similar items:`,
            ...recentWrong.map((a, i) => `${i + 1}. ${a.question.body.slice(0, 120)}`),
          ].join("\n"),
          maxTokens: 500,
        });
        return { explanation: text };
      },
    );

    return { ...content, cached, conceptId: body.conceptId };
  });

  app.post("/practice-question", { preHandler: requireAuth("student") }, async (request) => {
    const body = practiceQuestionSchema.parse(request.body);
    const studentId = request.user!.sub;

    if (!(await consumeToken(studentId, 20, 10))) throw Errors.rateLimited();

    const concept = await prisma.concept.findUnique({ where: { id: body.conceptId } });
    if (!concept) throw Errors.notFound("concept");

    const band = difficultyBand((body.difficulty - 1) / 9 * 6 - 3);
    const { content, cached } = await cachedOrGenerate<{ question: unknown }>(
      "practice_question",
      body.conceptId,
      band,
      "generic",
      async () => {
        if (!aiEnabled()) {
          return {
            question: {
              stub: true,
              body: `[stub] AI practice question for ${concept.name} at difficulty ${body.difficulty}/10.`,
            },
          };
        }
        const text = await generate({
          system:
            'You generate a single practice question. Respond with JSON only: {"body": string, "choices": string[4], "answerKey": string, "explanation": string}. Exactly one correct answer, no factual errors.',
          user: `Concept: ${concept.name}\nTarget difficulty: ${body.difficulty}/10 (5 = average)`,
          maxTokens: 700,
        });
        try {
          return { question: JSON.parse(text) as unknown };
        } catch {
          return { question: { stub: true, raw: text } };
        }
      },
    );

    return { ...content, cached, difficultyBand: band };
  });
};
