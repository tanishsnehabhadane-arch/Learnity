/**
 * Auth utilities: argon2-style password hashing (bcrypt-scrypt hybrid via node crypto
 * until argon2 native dep is added) + JWT access/refresh token minting & verification.
 *
 * STUB: hashPassword/verifyPassword use scrypt from node:crypto — swap for argon2id
 * in the security pass without changing call sites.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config.ts";

export interface JwtClaims {
  sub: string;
  role: "student" | "educator";
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export const JWT_DECORATOR = "jwt";
export const AUTH_SCHEME = "Bearer";

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtClaims;
  }
}

export function signAccessToken(claims: JwtClaims): string {
  // Wire to @fastify/jwt in the auth phase; kept as a pure function for testability.
  return `${JWT_DECORATOR}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}`;
}

export function signRefreshToken(claims: JwtClaims): string {
  return `refresh.${Buffer.from(JSON.stringify({ ...claims, iat: Date.now() })).toString("base64url")}`;
}

export function verifyAccessToken(token: string): JwtClaims | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as JwtClaims;
  } catch {
    return null;
  }
}

/** Fastify preHandler enforcing authentication + optional role. */
export function requireAuth(role?: JwtClaims["role"]) {
  return async function authPreHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const header = request.headers.authorization;
    if (!header?.startsWith(`${AUTH_SCHEME} `)) {
      await reply.code(401).send({ error: "unauthorized" });
      return;
    }
    const claims = verifyAccessToken(header.slice(AUTH_SCHEME.length + 1));
    if (!claims || (role && claims.role !== role)) {
      await reply.code(403).send({ error: "forbidden" });
      return;
    }
    request.user = claims;
  };
}

export const ACCESS_COOKIE = "learnity_refresh";
export const refreshCookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  maxAge: config.jwt.refreshTtlSeconds,
} as const;
