import type {
  AuthUser,
  ParsedResume,
  Portfolio,
  PortfolioContent,
  PortfolioSEO,
  PipelineJob,
  ResumeStructured,
  Theme,
  UploadedFileMeta,
} from "@portsume/shared";
import { THEMES } from "../modules/themes/themeCatalog.js";
import { slugify } from "../lib/ids.js";
import type { CreatePortfolioInput, CreateUserInput, Store } from "./store.js";

interface VersionEntry {
  number: number;
  content: PortfolioContent;
  createdAt: string;
}

interface ParsedResumeRow {
  resume: ParsedResume;
  structured: ResumeStructured;
}

class MemoryDb implements Store {
  private users = new Map<string, AuthUser>();
  private emailIndex = new Map<string, string>();
  private files = new Map<string, UploadedFileMeta>();
  private parsed = new Map<string, ParsedResumeRow>();
  private portfolios = new Map<string, Portfolio>();
  private versions = new Map<string, VersionEntry[]>();
  private jobs = new Map<string, PipelineJob>();
  private events: Array<{ userId: string; type: string; payload: Record<string, unknown> }> = [];
  private eventCounts = new Map<string, number>();

  async createUser(input: CreateUserInput): Promise<AuthUser> {
    const user: AuthUser = {
      id: input.id,
      email: input.email,
      name: input.name,
      avatarUrl: input.avatarUrl,
      provider: input.provider,
      createdAt: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    this.emailIndex.set(user.email.toLowerCase(), user.id);
    return user;
  }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const id = this.emailIndex.get(email.toLowerCase());
    return id ? (this.users.get(id) ?? null) : null;
  }

  async findUserById(id: string): Promise<AuthUser | null> {
    return this.users.get(id) ?? null;
  }

  async updateUser(id: string, patch: Partial<Pick<AuthUser, "name" | "avatarUrl">>): Promise<AuthUser | null> {
    const user = this.users.get(id);
    if (!user) return null;
    const next = { ...user, ...patch };
    this.users.set(id, next);
    return next;
  }

  async createFile(meta: UploadedFileMeta): Promise<UploadedFileMeta> {
    this.files.set(meta.id, meta);
    return meta;
  }

  async findFileById(id: string): Promise<UploadedFileMeta | null> {
    return this.files.get(id) ?? null;
  }

  async listFilesByUser(userId: string): Promise<UploadedFileMeta[]> {
    return [...this.files.values()].filter((f) => f.userId === userId);
  }

  async saveParsedResume(r: ParsedResume): Promise<ParsedResume> {
    this.parsed.set(r.fileId, { resume: r, structured: r.structured });
    return r;
  }

  async findParsedResumeByFileId(fileId: string): Promise<ParsedResume | null> {
    return this.parsed.get(fileId)?.resume ?? null;
  }

  async createPortfolio(input: CreatePortfolioInput): Promise<Portfolio> {
    const portfolio: Portfolio = {
      id: input.id,
      userId: input.userId,
      slug: input.slug,
      title: input.title,
      status: "draft",
      themeId: input.themeId,
      content: input.content,
      seo: input.seo,
      accent: input.accent,
      versions: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.portfolios.set(portfolio.id, portfolio);
    return portfolio;
  }

  async findPortfolioById(id: string): Promise<Portfolio | null> {
    return this.portfolios.get(id) ?? null;
  }

  async findPortfolioBySlug(slug: string): Promise<Portfolio | null> {
    return [...this.portfolios.values()].find((p) => p.slug === slug) ?? null;
  }

  async listPortfoliosByUser(userId: string): Promise<Portfolio[]> {
    return [...this.portfolios.values()]
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async listAllPortfolios(): Promise<Portfolio[]> {
    return [...this.portfolios.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async updatePortfolio(id: string, patch: Partial<Portfolio>): Promise<Portfolio | null> {
    const existing = this.portfolios.get(id);
    if (!existing) return null;
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) clean[key] = value;
    }
    const next = { ...existing, ...clean, updatedAt: new Date().toISOString() };
    this.portfolios.set(id, next);
    return next;
  }

  async addPortfolioVersion(portfolioId: string, versionNumber: number, content: PortfolioContent): Promise<void> {
    const list = this.versions.get(portfolioId) ?? [];
    list.push({ number: versionNumber, content, createdAt: new Date().toISOString() });
    this.versions.set(portfolioId, list);
  }

  async ensureSlugUnique(base: string, excludePortfolioId?: string): Promise<string> {
    const slug = slugify(base) || "portfolio";
    let candidate = slug;
    let i = 2;
    while ([...this.portfolios.values()].some((p) => p.slug === candidate && p.id !== excludePortfolioId)) {
      candidate = `${slug}-${i++}`;
    }
    return candidate;
  }

  async saveJob(job: PipelineJob): Promise<void> {
    this.jobs.set(job.id, job);
  }

  async findJobById(id: string): Promise<PipelineJob | null> {
    return this.jobs.get(id) ?? null;
  }

  async listJobsByUser(userId: string, limit = 20): Promise<PipelineJob[]> {
    return [...this.jobs.values()]
      .filter((j) => j.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async recordEvent(event: { userId: string; type: string; payload: Record<string, unknown> }): Promise<void> {
    this.events.push(event);
    const key = `${event.userId}:${event.type}`;
    this.eventCounts.set(key, (this.eventCounts.get(key) ?? 0) + 1);
  }

  async countEvents(userId: string, type: string): Promise<number> {
    return this.eventCounts.get(`${userId}:${type}`) ?? 0;
  }

  async listThemes(): Promise<Theme[]> {
    return THEMES;
  }
}

export const memoryStore: Store = new MemoryDb();
