import { Router } from "express";
import multer from "multer";
import type { Request, Response } from "express";
import { z } from "zod";
import { ok } from "../../lib/http.js";
import { errors } from "../../lib/errors.js";
import { orchestrator } from "../../pipeline/orchestrator.js";
import { requireAuth } from "../../middleware/auth.js";
import { uploadLimiter } from "../../middleware/rateLimit.js";
import { config } from "../../config/index.js";
import { getStore } from "../../db/index.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxUploadBytes } });

/**
 * POST /uploads/resume — accept a resume, kick off the transformation
 * pipeline, and return the job handle immediately. Processing is async;
 * poll GET /uploads/jobs/:id for progress.
 */
router.post(
  "/resume",
  requireAuth,
  uploadLimiter,
  upload.single("file"),
  async (req: Request, res: Response, next) => {
    try {
      const file = req.file;
      if (!file) throw errors.badRequest("No file uploaded. Send it as multipart field `file`.");
      const userId = req.auth!.id;
      const job = await orchestrator.start(userId, {
        name: file.originalname,
        buffer: file.buffer,
        mimeType: file.mimetype,
        size: file.size,
      });
      ok(res, { job }, 202);
    } catch (e) {
      next(e);
    }
  },
);

/** GET /uploads/jobs/:id — pipeline progress for a given job. */
router.get("/jobs/:id", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) throw errors.badRequest("Missing job id");
    const job = await orchestrator.get(id);
    if (!job) throw errors.notFound("Job not found");
    if (job.userId !== req.auth!.id) throw errors.forbidden();
    ok(res, { job });
  } catch (e) {
    next(e);
  }
});

/** GET /uploads/jobs — recent pipeline jobs for the current user. */
router.get("/jobs", requireAuth, async (req, res, next) => {
  try {
    const store = await getStore();
    const limit = z.coerce.number().int().min(1).max(50).default(10).parse(req.query.limit ?? "10");
    const jobs = await store.listJobsByUser(req.auth!.id, limit);
    ok(res, { jobs });
  } catch (e) {
    next(e);
  }
});

/** GET /uploads/files — uploaded resume files for the current user. */
router.get("/files", requireAuth, async (req, res, next) => {
  try {
    const store = await getStore();
    const files = await store.listFilesByUser(req.auth!.id);
    ok(res, { files });
  } catch (e) {
    next(e);
  }
});

export default router;
