import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errors = {
  badRequest: (message: string, details?: unknown) => new AppError(400, "BAD_REQUEST", message, details),
  unauthorized: (message = "Authentication required") => new AppError(401, "UNAUTHORIZED", message),
  forbidden: (message = "You do not have permission to do that") => new AppError(403, "FORBIDDEN", message),
  notFound: (message = "Resource not found") => new AppError(404, "NOT_FOUND", message),
  conflict: (message: string) => new AppError(409, "CONFLICT", message),
  tooLarge: (message = "Payload too large") => new AppError(413, "PAYLOAD_TOO_LARGE", message),
  tooMany: (message = "Too many requests, slow down") => new AppError(429, "RATE_LIMITED", message),
  unprocessable: (message: string, details?: unknown) => new AppError(422, "UNPROCESSABLE", message, details),
  internal: (message = "Something went wrong") => new AppError(500, "INTERNAL", message),
} as const;

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Request validation failed", details: err.flatten() },
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({ ok: false, error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  // Supabase (and other SDKs) reject with plain objects carrying message/code/
  // hint rather than Error instances — read those before giving up, or the
  // only diagnostic that reaches the client is "Unknown error".
  const asRecord = typeof err === "object" && err !== null ? (err as Record<string, unknown>) : null;
  const message =
    err instanceof Error
      ? err.message
      : typeof asRecord?.message === "string"
        ? asRecord.message
        : "Unknown error";
  const detail = asRecord
    ? { code: asRecord.code, details: asRecord.details, hint: asRecord.hint }
    : undefined;

  console.error("Unhandled error:", { message, ...detail, raw: err });
  res.status(500).json({ ok: false, error: { code: "INTERNAL", message } });
}
