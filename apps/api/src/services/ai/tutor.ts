/**
 * AI tutor chat service — every turn receives the student's live learner
 * context (path position, recent attempts, detected gaps), not just history.
 * STUB: echoes a deterministic reply when AI is disabled.
 */
import { prisma } from "../prisma.ts";
import { aiEnabled, buildTutorUserMessage, generateStream } from "./claude.ts";

export interface TutorTurn {
  studentId: string;
  message: string;
}

export async function buildLearnerContext(studentId: string): Promise<string> {
  const [states, recentAttempts] = await Promise.all([
    prisma.learnerConceptState.findMany({
      where: { studentId, status: { in: ["gap_detected", "in_progress"] } },
      include: { concept: { select: { name: true } } },
      take: 8,
      orderBy: { lastAttemptAt: "desc" },
    }),
    prisma.attempt.findMany({
      where: { studentId },
      include: { question: { select: { conceptId: true, body: true } } },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const gaps = states
    .filter((s) => s.status === "gap_detected")
    .map((s) => `${s.concept.name} (mastery ${(s.masteryProbability * 100).toFixed(0)}%)`);
  const inProgress = states
    .filter((s) => s.status === "in_progress")
    .map((s) => s.concept.name);

  return [
    `Active concepts: ${inProgress.join(", ") || "none"}`,
    `Detected gaps: ${gaps.join(", ") || "none"}`,
    `Last ${recentAttempts.length} attempts: ${
      recentAttempts
        .map((a) => `${a.isCorrect ? "correct" : "incorrect"} (${a.responseTimeMs}ms)`)
        .join(", ") || "none"
    }`,
  ].join("\n");
}

export async function* streamTutorReply(turn: TutorTurn): AsyncGenerator<string> {
  const context = await buildLearnerContext(turn.studentId);

  if (!aiEnabled()) {
    yield `[tutor-stub] I received: "${turn.message.slice(0, 80)}". `;
    yield "AI provider is not configured — set ANTHROPIC_API_KEY to enable real tutoring. ";
    yield `For reference, your current context:\n${context}`;
    return;
  }

  const userMessage = buildTutorUserMessage(turn.message, context);
  yield* generateStream({
    system:
      "You are Learnity's AI tutor. Use the student's learning context (gaps, progress, recent attempts) to tailor every answer. Render math in LaTeX. Keep answers focused and encouraging.",
    user: userMessage,
    maxTokens: 1_200,
  });
}
