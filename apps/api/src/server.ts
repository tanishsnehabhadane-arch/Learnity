/**
 * Fastify HTTP server + Socket.IO (tutor streaming).
 * Route prefix: /api — matches the spec's API surface.
 */
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import { ZodError } from "zod";
import { config } from "./config.ts";
import { logger } from "./lib/logger.ts";
import { AppError } from "./lib/errors.ts";
import { authRoutes } from "./routes/auth.ts";
import { studentRoutes } from "./routes/students.ts";
import { diagnosticRoutes } from "./routes/assessments.ts";
import { quizRoutes } from "./routes/quiz.ts";
import { aiRoutes } from "./routes/ai.ts";
import { reviewRoutes } from "./routes/review.ts";
import { analyticsRoutes } from "./routes/analytics.ts";
import { educatorRoutes } from "./routes/educator.ts";
import { conceptRoutes } from "./routes/concepts.ts";
import { attachTutorNamespace } from "./services/ai/tutor-socket.ts";

export async function buildServer() {
  const app = Fastify({
    loggerInstance: logger,
    trustProxy: true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: config.corsOrigin, credentials: true });
  await app.register(cookie);

  app.get("/api/health", async () => ({ status: "ok", service: "learnity-api" }));

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(studentRoutes, { prefix: "/api/students" });
  await app.register(diagnosticRoutes, { prefix: "/api/assessments" });
  await app.register(quizRoutes, { prefix: "/api/quiz" });
  await app.register(aiRoutes, { prefix: "/api/ai" });
  await app.register(reviewRoutes, { prefix: "/api/review" });
  await app.register(analyticsRoutes, { prefix: "/api/analytics" });
  await app.register(educatorRoutes, { prefix: "/api/educator" });
  await app.register(conceptRoutes, { prefix: "/api/concepts" });

  // Central error handler: AppError → status, ZodError → 422, else 500 (logged)
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ error: error.code, message: error.message });
    }
    if (error instanceof ZodError) {
      return reply.code(422).send({ error: "validation_error", issues: error.flatten().fieldErrors });
    }
    logger.error({ err: error }, "unhandled error");
    return reply.code(500).send({ error: "internal_error" });
  });

  return app;
}

async function main(): Promise<void> {
  const app = await buildServer();
  const io = attachTutorNamespace(app.server);

  io.on("connection", () => logger.info("tutor socket connected"));

  await app.listen({ port: config.port, host: "0.0.0.0" });
  logger.info({ port: config.port }, "learnity-api listening");
}

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

void main();
