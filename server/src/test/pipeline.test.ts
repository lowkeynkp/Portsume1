import { describe, it, expect } from "vitest";
import PDFDocument from "pdfkit";
import { orchestrator } from "../pipeline/orchestrator.js";
import { getStore } from "../db/index.js";
import { sleep } from "../lib/ids.js";

/** Build a valid single-page PDF from plain text lines using pdfkit. */
async function makeTextPdf(textLines: string[]): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    textLines.forEach((line, i) => doc.fontSize(11).text(line, 50, 50 + i * 16));
    doc.end();
  });
}

const PDF_TEXT = [
  "JORDAN ALMEIDA",
  "Full-Stack Engineer",
  "jordan@example.dev · (212) 555-0144 · Brooklyn, NY",
  "github.com/jordanalmeida · linkedin.com/in/jordanalmeida",
  "Engineer with 6 years shipping web products.",
  "EXPERIENCE",
  "Senior Software Engineer",
  "Northstar Labs — 2022 — Present",
  "- Led migration to TypeScript across 4 services",
  "- Cut p95 latency 42% with edge caching",
  "Software Engineer",
  "Bright Studio — 2019 — 2022",
  "- Built realtime dashboard serving 90k DAU",
  "PROJECTS",
  "Relay — Realtime sync engine",
  "WebSocket sync layer for collaborative apps.",
  "TypeScript, Node, Redis",
  "EDUCATION",
  "NYU",
  "BS Computer Science — 2015 — 2019",
  "SKILLS",
  "Engineering: TypeScript, Node.js, React, GraphQL",
];

describe("transformation pipeline (end-to-end)", () => {
  it("turns a PDF resume into a published portfolio", async () => {
    const store = await getStore();
    const user = await store.createUser({
      id: "user-pipeline-test",
      email: "pipeline@test.dev",
      name: "Jordan Almeida",
      provider: "email",
    });

    const pdf = await makeTextPdf(PDF_TEXT);
    const job = await orchestrator.start(user.id, {
      name: "jordan-resume.pdf",
      buffer: pdf,
      mimeType: "application/pdf",
      size: pdf.length,
    });

    // Poll until the job settles (completes or fails).
    let current = job;
    for (let i = 0; i < 60; i++) {
      current = (await store.findJobById(job.id))!;
      if (current.status === "completed" || current.status === "failed") break;
      await sleep(100);
    }

    expect(current.status).toBe("completed");
    expect(current.progress).toBe(100);

    const portfolios = await store.listPortfoliosByUser(user.id);
    expect(portfolios.length).toBe(1);
    const portfolio = portfolios[0]!;
    expect(portfolio.status).toBe("published");
    expect(portfolio.content.experience.length).toBeGreaterThanOrEqual(2);
    expect(portfolio.content.contact.email).toContain("@");
    expect(portfolio.publishedUrl).toContain("jordan-almeida");

    const parsed = await store.findParsedResumeByFileId(current.fileId);
    expect(parsed?.structured.projects.length).toBeGreaterThanOrEqual(1);
  }, 30_000);
});
