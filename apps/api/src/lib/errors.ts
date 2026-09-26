/**
 * Shared API error types mapped to HTTP responses by the error handler in server.ts.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  notFound: (what = "resource") => new AppError(404, "not_found", `${what} not found`),
  unauthorized: () => new AppError(401, "unauthorized", "Authentication required"),
  forbidden: () => new AppError(403, "forbidden", "Not allowed"),
  conflict: (msg: string) => new AppError(409, "conflict", msg),
  validation: (msg: string) => new AppError(422, "validation_error", msg),
  rateLimited: () => new AppError(429, "rate_limited", "Too many AI requests — try again shortly"),
};
