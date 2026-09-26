/**
 * Auth routes — JWT access tokens + rotating refresh cookie.
 * STUB: refresh-token rotation/revocation store (Redis) lands in the security pass.
 */
import type { FastifyPluginAsync } from "fastify";
import { verifyPassword, hashPassword, signAccessToken, signRefreshToken, verifyAccessToken, ACCESS_COOKIE, refreshCookieOptions, type JwtClaims } from "../lib/auth.ts";
import { Errors } from "../lib/errors.ts";
import { prisma } from "../services/prisma.ts";
import { signupSchema, loginSchema, refreshSchema } from "./schemas.ts";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/signup", async (request, reply) => {
    const body = signupSchema.parse(request.body);
    const existing = await prisma.student.findUnique({ where: { email: body.email } });
    if (existing) throw Errors.conflict("An account with this email already exists");

    const student = await prisma.student.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash: hashPassword(body.password),
      },
    });

    const claims: JwtClaims = { sub: student.id, role: "student" };
    return reply.code(201).send({
      accessToken: signAccessToken(claims),
      refreshToken: signRefreshToken(claims),
      student: { id: student.id, email: student.email, name: student.name },
    });
  });

  app.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const student = await prisma.student.findUnique({ where: { email: body.email } });
    if (!student || !verifyPassword(body.password, student.passwordHash)) {
      throw Errors.unauthorized();
    }
    const claims: JwtClaims = { sub: student.id, role: "student" };
    reply.setCookie(ACCESS_COOKIE, signRefreshToken(claims), refreshCookieOptions);
    return {
      accessToken: signAccessToken(claims),
      refreshToken: signRefreshToken(claims),
      student: { id: student.id, email: student.email, name: student.name },
    };
  });

  app.post("/refresh", async (request, reply) => {
    const body = refreshSchema.parse(request.body ?? {});
    const token = body.refreshToken ?? request.cookies[ACCESS_COOKIE];
    if (!token) throw Errors.unauthorized();

    try {
      const claims = verifyAccessToken(token.replace(/^refresh\./, ""));
      if (!claims) throw new Error("bad token");
      const fresh: JwtClaims = { sub: claims.sub, role: claims.role };
      return {
        accessToken: signAccessToken(fresh),
        refreshToken: signRefreshToken(fresh),
      };
    } catch {
      throw Errors.unauthorized();
    }
  });
};

