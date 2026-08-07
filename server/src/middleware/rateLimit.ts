import rateLimit from "express-rate-limit";
import { errors } from "../lib/errors.js";

/** Per-route rate limits keyed by IP. Tuned for human usage; the parser
 *  endpoints get the tightest windows to blunt abuse. */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(errors.tooMany()),
});

export const uploadLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(errors.tooMany("Upload limit reached for this minute")),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(errors.tooMany("Too many auth attempts, try again later")),
});
