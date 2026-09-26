/**
 * Zod request schemas — validation is part of the API contract.
 */
import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const diagnosticStartSchema = z.object({
  subjectId: z.string().min(1),
});

export const diagnosticAnswerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().max(2_000).optional(),
  responseTimeMs: z.number().int().min(0).max(3_600_000),
  confidenceRating: z.number().int().min(1).max(5).optional(),
});

export const quizStartSchema = z.object({
  conceptIds: z.array(z.string().min(1)).min(1).max(20).optional(),
});

export const quizAnswerSchema = diagnosticAnswerSchema;

export const reviewRateSchema = z.object({
  rating: z.enum(["again", "hard", "good", "easy"]),
});

export const explainSchema = z.object({
  conceptId: z.string().min(1),
});

export const practiceQuestionSchema = z.object({
  conceptId: z.string().min(1),
  difficulty: z.number().int().min(1).max(10),
});

export const scheduleSessionSchema = z.object({
  conceptId: z.string().min(1),
  scheduledFor: z.string().datetime(),
});

export const sessionIdParams = z.object({ sessionId: z.string().min(1) });
export const itemIdParams = z.object({ itemId: z.string().min(1) });
export const studentIdParams = z.object({ studentId: z.string().min(1) });
export const conceptIdParams = z.object({ conceptId: z.string().min(1) });
export const threadIdParams = z.object({ threadId: z.string().min(1) });
export const cohortIdParams = z.object({ cohortId: z.string().min(1) });
