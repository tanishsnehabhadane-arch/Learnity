/**
 * Structured logger (pino). PII-minimal per the security spec:
 * never log emails, names, or free-text student input.
 */
import pino from "pino";

const redactPaths = ["req.headers.authorization", "email", "name", "password", "body.text"];

export const logger = pino({
  level: process.env["LOG_LEVEL"] ?? "info",
  redact: redactPaths,
  base: { service: "learnity-api" },
});
