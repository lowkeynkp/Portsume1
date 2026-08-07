import express from "express";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/index.js";
import { errorHandler } from "./lib/errors.js";
import { requestContext } from "./middleware/requestContext.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { ok } from "./lib/http.js";

import authRoutes from "./modules/auth/routes.js";
import uploadRoutes from "./modules/uploads/routes.js";
import portfolioRoutes from "./modules/portfolios/routes.js";
import themeRoutes from "./modules/themes/routes.js";
import analyticsRoutes from "./modules/analytics/routes.js";

import { getStorage } from "./services/storage.js";
import { publicSiteIndex } from "./services/publisher.js";
import { renderPortfolio } from "./services/renderer.js";
import { getStore } from "./db/index.js";
import { errors } from "./lib/errors.js";
import { optionalAuth } from "./middleware/auth.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    }),
  );
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(requestContext);

  app.get("/health", (_req, res) => ok(res, { status: "ok", env: config.env }));
  app.use(apiLimiter);

  app.use("/v1/auth", authRoutes);
  app.use("/v1/uploads", uploadRoutes);
  app.use("/v1/portfolios", portfolioRoutes);
  app.use("/v1/themes", themeRoutes);
  app.use("/v1/analytics", analyticsRoutes);

  // Public portfolio sites — rendered live from JSON at publish time.
  app.get("/p/:slug", optionalAuth, async (req, res, next) => {
    try {
      const store = await getStore();
      const slug = req.params.slug;
      if (!slug) throw errors.badRequest("Missing slug");
      const portfolio = await store.findPortfolioBySlug(slug);
      if (!portfolio || portfolio.status !== "published") throw errors.notFound("Portfolio not found");
      res.type("html").send(renderPortfolio(portfolio));
    } catch (e) {
      next(e);
    }
  });

  // Public, non-versioned surfaces
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send("User-agent: *\nAllow: /p/\nAllow: /\n");
  });
  app.get("/sitemap.xml", async (_req, res, next) => {
    try {
      res.type("application/xml").send(await publicSiteIndex());
    } catch (e) {
      next(e);
    }
  });

  // Resume file downloads (authorized at the route level for the owner).
  app.get("/files/:key", async (req, res, next) => {
    try {
      const storage = await getStorage();
      const buf = await storage.get(req.params.key);
      res.type("application/octet-stream").send(buf);
    } catch (e) {
      next(e);
    }
  });

  // Serve the built client (single-host production: one URL hosts UI + API +
  // public portfolio pages). Falls back to index.html so SPA routes work.
  const clientDist = findClientDist();
  if (clientDist) {
    app.use(express.static(clientDist));
    app.get("*", (req, res, next) => {
      if (/^\/(v1|files|p)\b/.test(req.path) || req.path === "/health" || req.path.startsWith("/robots") || req.path.startsWith("/sitemap")) {
        return next();
      }
      if (req.accepts("html")) return res.sendFile(path.join(clientDist, "index.html"));
      return next();
    });
  }

  app.use((req, res, next) => {
    res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` } });
  });

  app.use(errorHandler);
  return app;
}

/** Locate the built client bundle by walking up from the running module,
 *  which lives at server/src (tsx) or server/dist/src (compiled). */
function findClientDist(): string | undefined {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, "client", "dist");
    if (existsSync(path.join(candidate, "index.html"))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}
