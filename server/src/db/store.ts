import type {
  AuthUser,
  Portfolio,
  PortfolioContent,
  PortfolioSEO,
  ParsedResume,
  PipelineJob,
  ResumeStructured,
  Theme,
  UploadedFileMeta,
} from "@portsume/shared";

export interface CreateUserInput {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: AuthUser["provider"];
}

export interface CreatePortfolioInput {
  id: string;
  userId: string;
  slug: string;
  title: string;
  themeId: Portfolio["themeId"];
  content: PortfolioContent;
  seo: PortfolioSEO;
  accent: string;
}

export interface Store {
  // ── users ────────────────────────────────────────────────
  createUser(input: CreateUserInput): Promise<AuthUser>;
  findUserByEmail(email: string): Promise<AuthUser | null>;
  findUserById(id: string): Promise<AuthUser | null>;
  updateUser(id: string, patch: Partial<Pick<AuthUser, "name" | "avatarUrl">>): Promise<AuthUser | null>;

  // ── files ────────────────────────────────────────────────
  createFile(meta: UploadedFileMeta): Promise<UploadedFileMeta>;
  findFileById(id: string): Promise<UploadedFileMeta | null>;
  listFilesByUser(userId: string): Promise<UploadedFileMeta[]>;

  // ── parsed resumes ───────────────────────────────────────
  saveParsedResume(r: ParsedResume): Promise<ParsedResume>;
  findParsedResumeByFileId(fileId: string): Promise<ParsedResume | null>;

  // ── portfolios ───────────────────────────────────────────
  createPortfolio(input: CreatePortfolioInput): Promise<Portfolio>;
  findPortfolioById(id: string): Promise<Portfolio | null>;
  findPortfolioBySlug(slug: string): Promise<Portfolio | null>;
  listPortfoliosByUser(userId: string): Promise<Portfolio[]>;
  /** All portfolios regardless of owner — used for the public site index. */
  listAllPortfolios(): Promise<Portfolio[]>;
  updatePortfolio(id: string, patch: Partial<Portfolio>): Promise<Portfolio | null>;
  addPortfolioVersion(portfolioId: string, versionNumber: number, content: PortfolioContent): Promise<void>;
  ensureSlugUnique(base: string, excludePortfolioId?: string): Promise<string>;

  // ── jobs ─────────────────────────────────────────────────
  saveJob(job: PipelineJob): Promise<void>;
  findJobById(id: string): Promise<PipelineJob | null>;
  listJobsByUser(userId: string, limit?: number): Promise<PipelineJob[]>;

  // ── analytics ────────────────────────────────────────────
  recordEvent(event: { userId: string; type: string; payload: Record<string, unknown> }): Promise<void>;
  countEvents(userId: string, type: string): Promise<number>;

  // ── themes ───────────────────────────────────────────────
  listThemes(): Promise<Theme[]>;
}

export interface ParsedResumeInput {
  fileId: string;
  rawText: string;
  structured: ResumeStructured;
  confidence: number;
  detectedMissing: string[];
}
