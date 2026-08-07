import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AuthUser,
  ParsedResume,
  Portfolio,
  PipelineJob,
  Theme,
  UploadedFileMeta,
} from "@portsume/shared";
import { config } from "../config/index.js";
import { logger } from "../lib/logger.js";
import { slugify } from "../lib/ids.js";
import { THEMES } from "../modules/themes/themeCatalog.js";
import type { CreatePortfolioInput, CreateUserInput, Store } from "./store.js";

const log = logger.child("db.supabase");

type Rows = Record<string, unknown>;

function toAuthUser(row: Rows): AuthUser {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name ?? row.email),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    provider: (row.provider as AuthUser["provider"]) ?? "email",
    createdAt: String(row.created_at),
  };
}

function toFile(row: Rows): UploadedFileMeta {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    size: Number(row.size),
    mimeType: String(row.mime_type),
    storagePath: String(row.storage_path),
    sha256: String(row.sha256),
    uploadedAt: String(row.uploaded_at),
  };
}

function toPortfolio(row: Rows): Portfolio {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    slug: String(row.slug),
    title: String(row.title),
    status: row.status === "published" ? "published" : "draft",
    themeId: row.theme_id as Portfolio["themeId"],
    content: row.content as Portfolio["content"],
    seo: row.seo as Portfolio["seo"],
    accent: String(row.accent),
    versions: Number(row.versions),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    publishedUrl: row.published_url ? String(row.published_url) : undefined,
  };
}

export class SupabaseStore implements Store {
  private readonly admin: SupabaseClient;

  constructor() {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error("SupabaseStore requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }
    this.admin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async createUser(input: CreateUserInput): Promise<AuthUser> {
    const { data, error } = await this.admin
      .from("profiles")
      .insert({
        id: input.id,
        email: input.email,
        name: input.name,
        avatar_url: input.avatarUrl,
        provider: input.provider,
      })
      .select()
      .single();
    if (error) throw error;
    return toAuthUser(data as Rows);
  }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const { data, error } = await this.admin
      .from("profiles")
      .select()
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    return data ? toAuthUser(data as Rows) : null;
  }

  async findUserById(id: string): Promise<AuthUser | null> {
    const { data, error } = await this.admin.from("profiles").select().eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toAuthUser(data as Rows) : null;
  }

  async updateUser(id: string, patch: Partial<Pick<AuthUser, "name" | "avatarUrl">>): Promise<AuthUser | null> {
    const { data, error } = await this.admin
      .from("profiles")
      .update({ name: patch.name, avatar_url: patch.avatarUrl })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data ? toAuthUser(data as Rows) : null;
  }

  async createFile(meta: UploadedFileMeta): Promise<UploadedFileMeta> {
    const { data, error } = await this.admin
      .from("uploaded_files")
      .insert({
        id: meta.id,
        user_id: meta.userId,
        name: meta.name,
        size: meta.size,
        mime_type: meta.mimeType,
        storage_path: meta.storagePath,
        sha256: meta.sha256,
      })
      .select()
      .single();
    if (error) throw error;
    return toFile(data as Rows);
  }

  async findFileById(id: string): Promise<UploadedFileMeta | null> {
    const { data, error } = await this.admin.from("uploaded_files").select().eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toFile(data as Rows) : null;
  }

  async listFilesByUser(userId: string): Promise<UploadedFileMeta[]> {
    const { data, error } = await this.admin
      .from("uploaded_files")
      .select()
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false });
    if (error) throw error;
    return (data as Rows[]).map(toFile);
  }

  async saveParsedResume(r: ParsedResume): Promise<ParsedResume> {
    const { data, error } = await this.admin
      .from("parsed_resumes")
      .upsert(
        {
          file_id: r.fileId,
          user_id: r.userId,
          status: r.status,
          raw_text: r.rawText,
          structured: r.structured,
          confidence: r.confidence,
          detected_missing: r.detectedMissing,
        },
        { onConflict: "file_id" },
      )
      .select()
      .single();
    if (error) throw error;
    return { ...r, id: String((data as Rows).id) };
  }

  async findParsedResumeByFileId(fileId: string): Promise<ParsedResume | null> {
    const { data, error } = await this.admin.from("parsed_resumes").select().eq("file_id", fileId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as Rows;
    return {
      id: String(row.id),
      fileId,
      userId: String(row.user_id),
      status: row.status as ParsedResume["status"],
      rawText: String(row.raw_text),
      structured: row.structured as ParsedResume["structured"],
      confidence: Number(row.confidence),
      detectedMissing: (row.detected_missing as string[]) ?? [],
      parsedAt: String(row.created_at),
    };
  }

  async createPortfolio(input: CreatePortfolioInput): Promise<Portfolio> {
    const { data, error } = await this.admin
      .from("portfolios")
      .insert({
        id: input.id,
        user_id: input.userId,
        slug: input.slug,
        title: input.title,
        status: "draft",
        theme_id: input.themeId,
        content: input.content,
        seo: input.seo,
        accent: input.accent,
        versions: 1,
      })
      .select()
      .single();
    if (error) throw error;
    return toPortfolio(data as Rows);
  }

  async findPortfolioById(id: string): Promise<Portfolio | null> {
    const { data, error } = await this.admin.from("portfolios").select().eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toPortfolio(data as Rows) : null;
  }

  async findPortfolioBySlug(slug: string): Promise<Portfolio | null> {
    const { data, error } = await this.admin.from("portfolios").select().eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data ? toPortfolio(data as Rows) : null;
  }

  async listPortfoliosByUser(userId: string): Promise<Portfolio[]> {
    const { data, error } = await this.admin
      .from("portfolios")
      .select()
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data as Rows[]).map(toPortfolio);
  }

  async listAllPortfolios(): Promise<Portfolio[]> {
    const { data, error } = await this.admin.from("portfolios").select().order("updated_at", { ascending: false });
    if (error) throw error;
    return (data as Rows[]).map(toPortfolio);
  }

  async updatePortfolio(id: string, patch: Partial<Portfolio>): Promise<Portfolio | null> {
    const { data, error } = await this.admin
      .from("portfolios")
      .update({
        slug: patch.slug,
        title: patch.title,
        status: patch.status,
        theme_id: patch.themeId,
        content: patch.content,
        seo: patch.seo,
        accent: patch.accent,
        versions: patch.versions,
        published_url: patch.publishedUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data ? toPortfolio(data as Rows) : null;
  }

  async addPortfolioVersion(portfolioId: string, versionNumber: number, content: Portfolio["content"]): Promise<void> {
    const { error } = await this.admin.from("portfolio_versions").insert({
      portfolio_id: portfolioId,
      version_number: versionNumber,
      content,
    });
    if (error) throw error;
  }

  async ensureSlugUnique(base: string, excludePortfolioId?: string): Promise<string> {
    const slug = slugify(base) || "portfolio";
    let candidate = slug;
    let i = 2;
    for (;;) {
      const { data, error } = await this.admin
        .from("portfolios")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();
      if (error) throw error;
      if (!data || (excludePortfolioId && data.id === excludePortfolioId)) return candidate;
      candidate = `${slug}-${i++}`;
    }
  }

  async saveJob(job: PipelineJob): Promise<void> {
    const { error } = await this.admin.from("pipeline_jobs").upsert(
      {
        id: job.id,
        user_id: job.userId,
        file_id: job.fileId,
        status: job.status,
        current_stage: job.currentStage,
        progress: job.progress,
        stages: job.stages,
        error: job.error,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  async findJobById(id: string): Promise<PipelineJob | null> {
    const { data, error } = await this.admin.from("pipeline_jobs").select().eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as Rows;
    return {
      id: String(row.id),
      userId: String(row.user_id),
      fileId: String(row.file_id),
      status: row.status as PipelineJob["status"],
      currentStage: row.current_stage as PipelineJob["currentStage"],
      progress: Number(row.progress),
      stages: (row.stages as PipelineJob["stages"]) ?? [],
      error: row.error ? String(row.error) : undefined,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  async listJobsByUser(userId: string, limit = 20): Promise<PipelineJob[]> {
    const { data, error } = await this.admin
      .from("pipeline_jobs")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as Rows[]).map((row) => ({
      id: String(row.id),
      userId,
      fileId: String(row.file_id),
      status: row.status as PipelineJob["status"],
      currentStage: row.current_stage as PipelineJob["currentStage"],
      progress: Number(row.progress),
      stages: (row.stages as PipelineJob["stages"]) ?? [],
      error: row.error ? String(row.error) : undefined,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }));
  }

  async recordEvent(event: { userId: string; type: string; payload: Record<string, unknown> }): Promise<void> {
    const { error } = await this.admin.from("analytics_events").insert({
      user_id: event.userId,
      type: event.type,
      payload: event.payload,
    });
    if (error) log.warn("failed to record analytics event", { error });
  }

  async countEvents(userId: string, type: string): Promise<number> {
    const { count, error } = await this.admin
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", type);
    if (error) throw error;
    return count ?? 0;
  }

  async listThemes(): Promise<Theme[]> {
    return THEMES;
  }
}
