/**
 * AI-generation cache — identical gaps across students must not re-trigger LLM calls.
 * Key: sha256(kind, conceptId, difficultyBand, misconceptionSignature).
 */
import { createHash } from "node:crypto";
import { prisma } from "../prisma.ts";

export type AiContentKind = "explanation" | "practice_question" | "rationale";

export function buildCacheKey(
  kind: AiContentKind,
  conceptId: string,
  difficultyBand: string,
  misconceptionSignature: string,
): string {
  return createHash("sha256")
    .update(`${kind}|${conceptId}|${difficultyBand}|${misconceptionSignature}`)
    .digest("hex");
}

export async function getCached<T>(cacheKey: string): Promise<T | null> {
  const hit = await prisma.aIContentCache.findUnique({ where: { cacheKey } });
  if (!hit) return null;
  // Fire-and-forget hit counter for cache-efficiency monitoring
  void prisma.aIContentCache
    .update({ where: { id: hit.id }, data: { hits: { increment: 1 } } })
    .catch(() => undefined);
  return hit.content as T;
}

export async function putCached(
  cacheKey: string,
  kind: AiContentKind,
  content: unknown,
  meta: { conceptId?: string; difficultyBand?: string; misconceptionSignature?: string },
): Promise<void> {
  await prisma.aIContentCache.upsert({
    where: { cacheKey },
    create: {
      cacheKey,
      kind,
      content: content as object,
      conceptId: meta.conceptId ?? null,
      difficultyBand: meta.difficultyBand ?? null,
      misconceptionSignature: meta.misconceptionSignature ?? null,
    },
    update: { content: content as object },
  });
}

/**
 * Cached-or-generate helper. `signature` should capture the *shape* of the
 * misconception (e.g. "sign-error-distribution") so similar gaps share entries.
 */
export async function cachedOrGenerate<T>(
  kind: AiContentKind,
  conceptId: string,
  difficultyBand: string,
  signature: string,
  generate: () => Promise<T>,
): Promise<{ content: T; cached: boolean }> {
  const key = buildCacheKey(kind, conceptId, difficultyBand, signature);
  const hit = await getCached<T>(key);
  if (hit !== null) return { content: hit, cached: true };
  const content = await generate();
  await putCached(key, kind, content, {
    conceptId,
    difficultyBand,
    misconceptionSignature: signature,
  });
  return { content, cached: false };
}
