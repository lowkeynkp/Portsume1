import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import { ok } from "../../lib/http.js";
import { errors } from "../../lib/errors.js";
import { getStore } from "../../db/index.js";
import { requireAuth } from "../../middleware/auth.js";
import { publishPortfolio, unpublishPortfolio } from "../../services/publisher.js";
import { renderPortfolio } from "../../services/renderer.js";
import { seoFromContent } from "../../services/portfolioGenerator.js";
import type { Portfolio, PortfolioContent, ThemeId } from "@portsume/shared";

const router = Router();

const contentPatch = z.object({
  title: z.string().min(1).max(120).optional(),
  themeId: z.enum(["editorial", "developer", "professional", "creative"]).optional(),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  content: z.object({}).passthrough().optional(),
  seo: z.object({}).passthrough().optional(),
});

function paramId(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) throw errors.badRequest(`Missing route parameter "${name}"`);
  return value;
}

async function loadOwned(req: Request, id: string): Promise<Portfolio> {
  const store = await getStore();
  const portfolio = await store.findPortfolioById(id);
  if (!portfolio) throw errors.notFound("Portfolio not found");
  if (portfolio.userId !== req.auth!.id) throw errors.forbidden();
  return portfolio;
}

/** GET /portfolios — list current user's portfolios. */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const store = await getStore();
    const portfolios = await store.listPortfoliosByUser(req.auth!.id);
    ok(res, { portfolios });
  } catch (e) {
    next(e);
  }
});

/** GET /portfolios/:id — fetch a single portfolio. */
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const portfolio = await loadOwned(req, paramId(req, "id"));
    ok(res, { portfolio });
  } catch (e) {
    next(e);
  }
});

/** Deep-merge two JSON objects. Arrays and scalars are replaced wholesale. */
function deepMerge<T>(base: T, incoming: unknown): T {
  if (incoming === undefined || incoming === null) return base;
  if (typeof base !== "object" || base === null || Array.isArray(base)) return incoming as T;
  if (typeof incoming !== "object" || Array.isArray(incoming)) return incoming as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(incoming as Record<string, unknown>)) {
    out[key] = deepMerge(out[key] as never, value);
  }
  return out as T;
}

/** PATCH /portfolios/:id — autosave edits, switch theme, update SEO. */
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const store = await getStore();
    const parsed = contentPatch.parse(req.body);
    const portfolio = await loadOwned(req, paramId(req, "id"));
    const mergedContent = parsed.content ? deepMerge(portfolio.content, parsed.content) : undefined;
    const patch: Partial<Portfolio> = {
      title: parsed.title,
      themeId: parsed.themeId as ThemeId | undefined,
      accent: parsed.accent,
      content: mergedContent,
      // Keep the live page's metadata in sync with content edits.
      seo: parsed.seo ? deepMerge(portfolio.seo, parsed.seo) : mergedContent ? seoFromContent(mergedContent) : undefined,
    };
    const updated = await store.updatePortfolio(portfolio.id, patch);
    if (parsed.content) {
      await store.addPortfolioVersion(portfolio.id, (portfolio.versions ?? 1) + 1, patch.content as unknown as PortfolioContent);
    }
    ok(res, { portfolio: updated });
  } catch (e) {
    next(e);
  }
});

/** POST /portfolios/:id/duplicate — fork a portfolio (multiple portfolios). */
router.post("/:id/duplicate", requireAuth, async (req, res, next) => {
  try {
    const store = await getStore();
    const portfolio = await loadOwned(req, paramId(req, "id"));
    const slug = await store.ensureSlugUnique(`${portfolio.slug}-copy`);
    const copy = await store.createPortfolio({
      id: portfolio.id + "-copy-" + Math.random().toString(36).slice(2, 7),
      userId: portfolio.userId,
      slug,
      title: `${portfolio.title} (copy)`,
      themeId: portfolio.themeId,
      content: portfolio.content,
      seo: portfolio.seo,
      accent: portfolio.accent,
    });
    ok(res, { portfolio: copy }, 201);
  } catch (e) {
    next(e);
  }
});

/** POST /portfolios/:id/publish — one-click publish. */
router.post("/:id/publish", requireAuth, async (req, res, next) => {
  try {
    await loadOwned(req, paramId(req, "id"));
    const result = await publishPortfolio(paramId(req, "id"));
    ok(res, result);
  } catch (e) {
    next(e);
  }
});

/** POST /portfolios/:id/unpublish — take a portfolio offline. */
router.post("/:id/unpublish", requireAuth, async (req, res, next) => {
  try {
    await loadOwned(req, paramId(req, "id"));
    const portfolio = await unpublishPortfolio(paramId(req, "id"));
    ok(res, { portfolio });
  } catch (e) {
    next(e);
  }
});

/** GET /portfolios/:id/preview — HTML preview of the current draft. An
 *  optional `?theme=` override renders the same content in another template
 *  without mutating the portfolio (used by the template picker). */
router.get("/:id/preview", requireAuth, async (req, res, next) => {
  try {
    const portfolio = await loadOwned(req, paramId(req, "id"));
    const override = req.query.theme;
    const renderable =
      typeof override === "string" && ["editorial", "developer", "professional", "creative"].includes(override)
        ? { ...portfolio, themeId: override as ThemeId }
        : portfolio;
    res.type("html").send(renderPortfolio(renderable));
  } catch (e) {
    next(e);
  }
});

export default router;
