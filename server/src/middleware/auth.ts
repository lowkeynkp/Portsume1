import type { NextFunction, Request, Response } from "express";
import { verifySession, type SessionClaims } from "../lib/session.js";
import { errors } from "../lib/errors.js";
import { getStore } from "../db/index.js";
import type { AuthUser } from "@portsume/shared";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthUser;
      claims?: SessionClaims;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  const cookie = req.headers.cookie;
  const m = cookie?.match(/(?:^|;\s*)portsume_session=([^;]+)/);
  if (m?.[1]) return decodeURIComponent(m[1]);
  return null;
}

/** Require a valid session for protected routes. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      next(errors.unauthorized("Missing session token"));
      return;
    }
    const claims = verifySession(token);
    if (!claims) {
      next(errors.unauthorized("Session expired or invalid"));
      return;
    }
    const store = await getStore();
    const user = await store.findUserById(claims.sub);
    if (!user) {
      next(errors.unauthorized("Account not found"));
      return;
    }
    req.auth = user;
    req.claims = claims;
    next();
  } catch (e) {
    next(e);
  }
}

/** Optional auth: attaches user when a valid token exists, never rejects. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (token) {
      const claims = verifySession(token);
      if (claims) {
        const store = await getStore();
        const user = await store.findUserById(claims.sub);
        if (user) req.auth = user;
      }
    }
    next();
  } catch {
    next();
  }
}
