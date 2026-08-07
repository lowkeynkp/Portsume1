import type { Portfolio, PublishedSite } from "@portsume/shared";
import type { Store } from "../db/store.js";
import { getStore } from "../db/index.js";
import { config } from "../config/index.js";
import { logger } from "../lib/logger.js";
import { errors } from "../lib/errors.js";
import { uid } from "../lib/ids.js";

const log = logger.child("publishing");

export interface PublishResult {
  site: PublishedSite;
  portfolio: Portfolio;
  seo: {
    robots: string;
    sitemap: string;
    canonical: string;
  };
}

/**
 * One-click publishing. Reads live portfolio JSON and exposes it at a public
 * URL — it never rebuilds or bakes content. Theme switches apply instantly.
 */
export async function publishPortfolio(portfolioId: string): Promise<PublishResult> {
  const store: Store = await getStore();
  const portfolio = await store.findPortfolioById(portfolioId);
  if (!portfolio) throw errors.notFound("Portfolio not found");
  if (portfolio.status === "draft" && !portfolio.slug) throw errors.badRequest("Portfolio needs a slug to publish");

  const subdomain = portfolio.slug;
  const url = `${config.publicBaseUrl}/p/${subdomain}`;
  const canonical = url;

  const site: PublishedSite = {
    id: uid(),
    portfolioId: portfolio.id,
    subdomain,
    url,
    publishedAt: new Date().toISOString(),
  };

  const updated = await store.updatePortfolio(portfolio.id, {
    status: "published",
    publishedUrl: url,
  });

  log.info("portfolio published", { portfolioId, url });
  return {
    site,
    portfolio: updated ?? portfolio,
    seo: {
      robots: "User-agent: *\nAllow: /p/\nAllow: /\n",
      sitemap: `${config.publicBaseUrl}/sitemap.xml`,
      canonical,
    },
  };
}

export async function unpublishPortfolio(portfolioId: string): Promise<Portfolio> {
  const store: Store = await getStore();
  const portfolio = await store.findPortfolioById(portfolioId);
  if (!portfolio) throw errors.notFound("Portfolio not found");
  const updated = await store.updatePortfolio(portfolio.id, { status: "draft", publishedUrl: undefined });
  log.info("portfolio unpublished", { portfolioId });
  return updated ?? portfolio;
}

export async function publicSiteIndex(): Promise<string> {
  const store: Store = await getStore();
  const published = await store.listAllPortfolios();
  const urls = published
    .filter((p) => p.status === "published" && p.publishedUrl)
    .map((p) => `  <url><loc>${p.publishedUrl}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
