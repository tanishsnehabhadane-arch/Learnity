/**
 * Path-rationale generation (explainability requirement).
 * Cache-first; template fallback keeps the path explainable when the cache
 * is cold or the AI provider is unavailable.
 */
import { difficultyBand } from "../../engines/irt.ts";
import { aiEnabled, generate } from "./claude.ts";
import { cachedOrGenerate } from "./cache.ts";

export interface RationaleInput {
  conceptId: string;
  conceptName: string;
  masteryProbability: number;
  attemptsCount: number;
  isGap: boolean;
  daysSinceLastAttempt: number | null;
  prerequisiteNames: string[];
}

export async function generateRationale(input: RationaleInput): Promise<string> {
  const signature = input.isGap ? "gap-remediation" : "advancement";
  const band = input.isGap ? "medium" : "easy";

  const { content } = await cachedOrGenerate<string>(
    "rationale",
    input.conceptId,
    band,
    signature,
    async () => {
      if (!aiEnabled()) return templateRationale(input);
      try {
        return await generate({
          system:
            "You write 1-2 sentence explanations for an adaptive learning platform, addressed to the student, explaining WHY the next concept was recommended. Be specific, warm, and jargon-free. No preamble.",
          user: [
            `Concept: ${input.conceptName}`,
            `Mastery probability: ${input.masteryProbability.toFixed(2)}`,
            `Attempts: ${input.attemptsCount}`,
            `Is a detected knowledge gap: ${String(input.isGap)}`,
            `Days since last attempt: ${input.daysSinceLastAttempt ?? "never"}`,
            `Prerequisites: ${input.prerequisiteNames.join(", ") || "none"}`,
          ].join("\n"),
          maxTokens: 120,
        });
      } catch {
        return templateRationale(input);
      }
    },
  );
  return content;
}

function templateRationale(input: RationaleInput): string {
  if (input.isGap) {
    return `Recent attempts suggest ${input.conceptName} needs reinforcement — mastering it unblocks the next steps in your path.`;
  }
  if (input.attemptsCount === 0) {
    return `${input.conceptName} is next: your prerequisite foundations are solid.`;
  }
  return `Time to revisit ${input.conceptName} — it has been a while and you were progressing well.`;
}

export { difficultyBand };
