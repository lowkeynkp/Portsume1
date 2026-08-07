import { Router } from "express";
import { ok } from "../../lib/http.js";
import { getStore } from "../../db/index.js";

const router = Router();

/** GET /themes — the theme catalog consumed by the editor + renderer. */
router.get("/", async (_req, res, next) => {
  try {
    const store = await getStore();
    const themes = await store.listThemes();
    ok(res, { themes });
  } catch (e) {
    next(e);
  }
});

export default router;
