import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { logger } from "../lib/logger.js";

const log = logger.child("http");

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/** Attach a request id for tracing and log every request. */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  req.requestId = req.headers["x-request-id"]?.toString() ?? randomUUID().slice(0, 10);
  res.setHeader("x-request-id", req.requestId);
  const start = Date.now();
  res.on("finish", () => {
    log.info("request", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - start,
      userId: req.auth?.id,
    });
  });
  next();
}
