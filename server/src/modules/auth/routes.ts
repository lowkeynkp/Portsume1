import { Router } from "express";
import { z } from "zod";
import type { AuthUser } from "@portsume/shared";
import { getStore } from "../../db/index.js";
import { ok } from "../../lib/http.js";
import { errors } from "../../lib/errors.js";
import { issueSession } from "../../lib/session.js";
import { uid } from "../../lib/ids.js";
import { authLimiter } from "../../middleware/rateLimit.js";
import { requireAuth } from "../../middleware/auth.js";
import { config, isSupabaseMode } from "../../config/index.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80).optional(),
  avatarUrl: z.string().url().optional(),
  provider: z.enum(["google", "github", "email"]).default("email"),
});

async function upsertUser(input: { email: string; name?: string; avatarUrl?: string; provider: AuthUser["provider"] }) {
  const store = await getStore();
  const existing = await store.findUserByEmail(input.email);
  if (existing) return existing;
  return store.createUser({
    id: uid(),
    email: input.email,
    name: input.name ?? input.email.split("@")[0] ?? "Friend",
    avatarUrl: input.avatarUrl,
    provider: input.provider,
  });
}

/**
 * POST /auth/session — exchange an OAuth provider credential (or demo login)
 * for a signed Portsume session. In Supabase mode the client would use the
 * Supabase client SDK directly; this endpoint keeps auth provider-agnostic.
 */
router.post("/session", authLimiter, async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await upsertUser(body);
    const token = issueSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    });
    ok(res, { token, user }, 201);
  } catch (e) {
    next(e);
  }
});

/** GET /auth/me — current session user. */
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    ok(res, { user: req.auth });
  } catch (e) {
    next(e);
  }
});

/** POST /auth/demo — one-click demo account for local exploration. */
router.post("/demo", authLimiter, async (req, res, next) => {
  try {
    const email = `demo+${uid().slice(0, 6)}@portsume.app`;
    const user = await upsertUser({ email, name: "Alex Rivera", provider: "email" });
    const token = issueSession({ sub: user.id, email: user.email, name: user.name, provider: user.provider });
    ok(res, { token, user }, 201);
  } catch (e) {
    next(e);
  }
});

router.get("/health", (_req, res) => {
  ok(res, { status: "ok", store: isSupabaseMode ? "supabase" : "memory", ai: config.openai.apiKey ? "openai" : "editorial" });
});

export default router;
