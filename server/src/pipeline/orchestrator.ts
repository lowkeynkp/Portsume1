import type { PipelineJob, PipelineStage, JobStageUpdate } from "@portsume/shared";
import type { Store } from "../db/store.js";
import { getStore } from "../db/index.js";
import { getStorage } from "../services/storage.js";
import { enhanceResume, sanitizeText } from "../services/ai.js";
import { extractText, structureResume } from "../services/parser.js";
import { generatePortfolio } from "../services/portfolioGenerator.js";
import { config } from "../config/index.js";
import { logger } from "../lib/logger.js";
import { errors } from "../lib/errors.js";
import { uid, sleep } from "../lib/ids.js";

const log = logger.child("pipeline");

export type FileLike = { name: string; buffer: Buffer; mimeType: string; size: number };

const STAGE_ORDER: PipelineStage[] = [
  "uploaded",
  "validating",
  "storing",
  "parsing",
  "normalizing",
  "enhancing",
  "generating",
  "publishing",
  "completed",
];

function blankStages(): JobStageUpdate[] {
  return [
    { stage: "validating", status: "pending", progress: 0, detail: "Checks file type, size and integrity" },
    { stage: "storing", status: "pending", progress: 0, detail: "Encrypting at rest in private storage" },
    { stage: "parsing", status: "pending", progress: 0, detail: "Extracting structured content" },
    { stage: "normalizing", status: "pending", progress: 0, detail: "Recovering broken sections" },
    { stage: "enhancing", status: "pending", progress: 0, detail: "AI copywriting & SEO" },
    { stage: "generating", status: "pending", progress: 0, detail: "Building theme-independent portfolio" },
    { stage: "publishing", status: "pending", progress: 0, detail: "Assigning your public URL" },
  ];
}

function totalFor(job: PipelineJob): number {
  if (job.status === "completed") return 100;
  const done = job.stages.filter((s) => s.status === "done").length;
  const running = job.stages.find((s) => s.status === "running");
  const base = (done / job.stages.length) * 100;
  const partial = running ? (running.progress / 100) * (100 / job.stages.length) : 0;
  return Math.min(99, Math.round(base + partial));
}

export class PipelineOrchestrator {
  private queue: string[] = [];
  private processing = new Set<string>();
  private storePromise: Promise<Store>;

  constructor() {
    this.storePromise = getStore();
  }

  private async persist(job: PipelineJob): Promise<void> {
    const store = await this.storePromise;
    job.progress = totalFor(job);
    await store.saveJob(job);
  }

  private markStage(job: PipelineJob, stage: string, patch: Partial<JobStageUpdate>): void {
    const s = job.stages.find((x) => x.stage === stage);
    if (s) Object.assign(s, patch);
  }

  async start(userId: string, file: FileLike): Promise<PipelineJob> {
    const store = await this.storePromise;
    const job: PipelineJob = {
      id: uid(),
      userId,
      fileId: "", // assigned once stored
      status: "queued",
      currentStage: "uploaded",
      progress: 0,
      stages: blankStages(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.persist(job);
    this.queue.push(JSON.stringify({ jobId: job.id, userId, file: { ...file, buffer: file.buffer.toString("base64") } }));
    log.info("job queued", { jobId: job.id, fileName: file.name });
    this.drain();
    return job;
  }

  async get(jobId: string): Promise<PipelineJob | null> {
    const store = await this.storePromise;
    return store.findJobById(jobId);
  }

  private async drain(): Promise<void> {
    if (this.processing.size >= config.pipeline.queueConcurrency) return;
    const raw = this.queue.shift();
    if (!raw) return;
    const item = JSON.parse(raw) as { jobId: string; userId: string; file: { name: string; mimeType: string; size: number; buffer: string } };
    this.processing.add(item.jobId);
    try {
      await this.run(item);
    } catch (e) {
      log.error("pipeline run failed", { jobId: item.jobId, error: String(e) });
      await this.fail(item.jobId, e);
    } finally {
      this.processing.delete(item.jobId);
      this.drain();
    }
  }

  private async fail(jobId: string, e: unknown): Promise<void> {
    const store = await this.storePromise;
    const job = await store.findJobById(jobId);
    if (!job) return;
    job.status = "failed";
    job.currentStage = "failed";
    job.error = e instanceof Error ? e.message : String(e);
    await this.persist(job);
  }

  private async run(item: { jobId: string; userId: string; file: { name: string; mimeType: string; size: number; buffer: string } }): Promise<void> {
    const store = await this.storePromise;
    const storage = await getStorage();
    const { jobId, userId } = item;
    const file = { ...item.file, buffer: Buffer.from(item.file.buffer, "base64") };
    const job = (await store.findJobById(jobId))!;

    job.status = "processing";
    job.currentStage = "validating";
    this.markStage(job, "validating", { status: "running", progress: 10, detail: "Validating document…" });
    await this.persist(job);

    // ── Validate ─────────────────────────────────────────────
    await sleep(300);
    const ALLOWED = new Set(["application/pdf", "application/x-pdf"]);
    const isDocx = /docx/i.test(file.name) || file.mimeType.includes("wordprocessingml");
    if (!ALLOWED.has(file.mimeType) && !isDocx) {
      throw errors.unprocessable(`Unsupported format "${file.mimeType || file.name}". Upload a PDF or DOCX resume.`);
    }
    if (file.size > config.maxUploadBytes) {
      throw errors.tooLarge(`File exceeds the ${Math.round(config.maxUploadBytes / 1024 / 1024)}MB limit.`);
    }
    this.markStage(job, "validating", { status: "done", progress: 100, detail: "File validated" });

    // ── Store ────────────────────────────────────────────────
    job.currentStage = "storing";
    this.markStage(job, "storing", { status: "running", progress: 30, detail: "Storing securely…" });
    await this.persist(job);

    const { sha256 } = await import("../lib/ids.js");
    const ext = isDocx ? "docx" : "pdf";
    const storageKey = `${userId}/${jobId}.${ext}`;
    const stored = await storage.put(storageKey, file.buffer, isDocx ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf");
    const meta = await store.createFile({
      id: uid(),
      userId,
      name: file.name.replace(/[^\w.\-\s]/g, "_"),
      size: file.size,
      mimeType: file.mimeType,
      storagePath: stored.path,
      sha256: sha256(file.buffer),
      uploadedAt: new Date().toISOString(),
    });
    job.fileId = meta.id;
    this.markStage(job, "storing", { status: "done", progress: 100, detail: "Stored in private storage" });

    // ── Parse ────────────────────────────────────────────────
    job.currentStage = "parsing";
    this.markStage(job, "parsing", { status: "running", progress: 20, detail: "Extracting text…" });
    await this.persist(job);

    const extracted = await extractText(file.buffer, file.mimeType);
    await sleep(250);
    const cleanText = sanitizeText(extracted.text);
    this.markStage(job, "parsing", { status: "done", progress: 100, detail: "Text extracted" });

    // ── Normalize ────────────────────────────────────────────
    job.currentStage = "normalizing";
    this.markStage(job, "normalizing", { status: "running", progress: 30, detail: "Detecting sections…" });
    await this.persist(job);

    const { structured, missing, confidence } = structureResume(cleanText, extracted.layout);
    await store.saveParsedResume({
      id: uid(),
      fileId: meta.id,
      userId,
      status: "ready",
      rawText: cleanText.slice(0, 20_000),
      confidence,
      structured,
      detectedMissing: missing,
      parsedAt: new Date().toISOString(),
    });
    this.markStage(job, "normalizing", {
      status: "done",
      progress: 100,
      detail: missing.length ? `Missing: ${missing.slice(0, 3).join(", ")}` : "All key sections recovered",
    });

    // ── Enhance (AI) ─────────────────────────────────────────
    job.currentStage = "enhancing";
    this.markStage(job, "enhancing", { status: "running", progress: 25, detail: "Rewriting & SEO…" });
    await this.persist(job);

    const enhanced = await enhanceResume(structured);
    this.markStage(job, "enhancing", {
      status: "done",
      progress: 100,
      detail: `${enhanced.improvements.length} improvements applied`,
    });

    // ── Generate portfolio ───────────────────────────────────
    job.currentStage = "generating";
    this.markStage(job, "generating", { status: "running", progress: 30, detail: "Composing portfolio JSON…" });
    await this.persist(job);

    const portfolio = await generatePortfolio({
      userId,
      fileName: meta.name,
      fileId: meta.id,
      structured,
      enhanced,
      storageUrl: storage.publicUrl(meta.storagePath) ?? undefined,
    });
    this.markStage(job, "generating", { status: "done", progress: 100, detail: "Portfolio ready" });

    // ── Publish ──────────────────────────────────────────────
    job.currentStage = "publishing";
    this.markStage(job, "publishing", { status: "running", progress: 50, detail: "Assigning public URL…" });
    await this.persist(job);
    await sleep(200);

    const { publishPortfolio } = await import("../services/publisher.js");
    const { site } = await publishPortfolio(portfolio.id);
    await store.recordEvent({ userId, type: "pipeline_completed", payload: { jobId, fileId: meta.id, portfolioId: portfolio.id } });

    this.markStage(job, "publishing", { status: "done", progress: 100, detail: `Live at ${site.url}` });
    job.currentStage = "completed";
    job.status = "completed";
    job.progress = 100;
    await this.persist(job);

    log.info("pipeline completed", { jobId, portfolioId: portfolio.id, url: site.url });
  }
}

export const orchestrator = new PipelineOrchestrator();
