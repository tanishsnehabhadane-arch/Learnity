/**
 * AI provider smoke test: verifies the configured key performs a tiny
 * completion. Usage: npx tsx scripts/ai-smoke.ts  (loads ../../.env)
 */
import "./load-env.ts";
import { config } from "../src/config.ts";
import { aiEnabled, generate } from "../src/services/ai/claude.ts";

if (!aiEnabled()) {
  console.error("No AI provider configured (set GEMINI_API_KEY or ANTHROPIC_API_KEY).");
  process.exit(1);
}

console.log("Provider resolved — attempting tiny completion…");
const reply = await generate({
  system: "Reply with exactly one short sentence.",
  user: "Say hello and name the subject you are tutoring.",
  maxTokens: 60,
});
console.log("AI replied:", reply.trim().slice(0, 200));
process.exit(0);
