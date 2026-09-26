/**
 * Singleton Prisma client.
 * STUB note: row-level access control is enforced in routes (student scoping)
 * until Postgres RLS policies are added in the security pass.
 */
import { PrismaClient } from "../generated/prisma/index.js";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: process.env["NODE_ENV"] === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  globalThis.prisma = prisma;
}
