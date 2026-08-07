import { Router } from "express";
import { ok } from "../../lib/http.js";
import { getStore } from "../../db/index.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

/** GET /analytics/overview — visitor + publishing activity for a user. */
router.get("/overview", requireAuth, async (req, res, next) => {
  try {
    const store = await getStore();
    const [publishedCount, publishes] = await Promise.all([
      store.countEvents(req.auth!.id, "publish"),
      store.countEvents(req.auth!.id, "pipeline_completed"),
    ]);
    const portfolios = await store.listPortfoliosByUser(req.auth!.id);
    ok(res, {
      overview: {
        publishedPortfolios: portfolios.filter((p) => p.status === "published").length,
        totalPortfolios: portfolios.length,
        publishes,
        views: publishedCount,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
