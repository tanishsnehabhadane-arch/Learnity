/**
 * Zod-validated env vars (public). Import `env` — never process.env in components.
 */
import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
  NEXT_PUBLIC_WS_URL: z.string().url().default("http://localhost:4000"),
});

const parsed = EnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env["NEXT_PUBLIC_API_URL"],
  NEXT_PUBLIC_WS_URL: process.env["NEXT_PUBLIC_WS_URL"],
});

export const env = parsed.success
  ? parsed.data
  : { NEXT_PUBLIC_API_URL: "http://localhost:4000", NEXT_PUBLIC_WS_URL: "http://localhost:4000" };
