import { describe, it, expect } from "vitest";
import { structureResume } from "../services/parser.js";
import { editorialEnhance } from "../services/ai.js";
import { SAMPLE_RESUME_TEXT } from "./fixtures.js";

describe("resume parsing", () => {
  const { structured, confidence, missing } = structureResume(SAMPLE_RESUME_TEXT);

  it("extracts name and title from the header", () => {
    expect(structured.name).toContain("ALEX");
    expect(structured.professionalTitle).toContain("Product");
  });

  it("detects contact details", () => {
    expect(structured.email).toBe("alex.rivera@example.com");
    expect(structured.phone).toMatch(/415/);
  });

  it("parses experience entries with chronology", () => {
    expect(structured.experience.length).toBeGreaterThanOrEqual(2);
    const first = structured.experience[0]!;
    expect(first.role).toContain("Senior");
    expect(first.company).toContain("Studio Nord");
    expect(first.current).toBeTruthy();
  });

  it("parses projects with tech stacks", () => {
    expect(structured.projects.length).toBeGreaterThanOrEqual(1);
    const p = structured.projects[0]!;
    expect(p.title).toContain("Portsume");
    expect(p.techStack.length).toBeGreaterThan(0);
  });

  it("parses skills into groups", () => {
    expect(structured.skills.length).toBeGreaterThanOrEqual(1);
  });

  it("produces a sane confidence score", () => {
    expect(confidence).toBeGreaterThan(50);
  });

  it("flags only genuinely missing sections", () => {
    expect(missing).not.toContain("Full name");
    expect(missing).not.toContain("Email");
  });
});

describe("editorial enhancement", () => {
  const { structured } = structureResume(SAMPLE_RESUME_TEXT);
  const out = editorialEnhance(structured);

  it("generates SEO metadata from real content only", () => {
    expect(out.seo.title).toContain("ALEX");
    expect(out.seo.description.length).toBeLessThanOrEqual(160);
  });

  it("does not fabricate projects", () => {
    const ids = new Set(structured.projects.map((p) => p.id));
    for (const key of Object.keys(out.projectDescriptions)) {
      expect(ids.has(key)).toBe(true);
    }
  });

  it("produces a tagline", () => {
    expect(out.tagline.length).toBeGreaterThan(0);
  });
});

describe("rich section parsing", () => {
  const RICH = `PRIYA SHARMA
  Data Scientist
  priya@stats.dev · (212) 555-0177 · Jersey City, NJ
  github.com/priyasharma

  EXPERIENCE
  Senior Data Scientist
  Northwind — 2021 — Present
  - Lead a 4-person research team
  - Cut model latency 38%

  Data Scientist
  Acme Analytics — 2019 — 2021
  - Built forecasting pipelines

  AWARDS
  Kaggle Grandmaster — 2021
  Best Paper, ML Summit — 2020

  PUBLICATIONS
  Scaling Transformers — Journal of ML — 2023 — https://doi.org/10.0000/scaling
  Attention Is All You Need? (ACL, 2022) — https://arxiv.org/abs/2201.0000

  CERTIFICATIONS
  AWS Certified ML Engineer — Amazon — 2023
  Google TensorFlow Developer — Google — 2022

  SKILLS
  Languages: Python, R, SQL
  Tools: PyTorch, Spark, Airflow
  `;

  const { structured } = structureResume(RICH);

  it("parses multiple awards", () => {
    expect(structured.awards.length).toBeGreaterThanOrEqual(2);
    expect(structured.awards[0]!.title).toContain("Kaggle");
    expect(structured.awards[1]!.year).toBe("2020");
  });

  it("parses publications with venue and year", () => {
    expect(structured.publications.length).toBeGreaterThanOrEqual(2);
    const first = structured.publications[0]!;
    expect(first.title).toContain("Scaling Transformers");
    expect(first.venue).toContain("Journal of ML");
    expect(first.year).toBe("2023");
    expect(first.url).toContain("doi.org");
    const parenthetical = structured.publications[1]!;
    expect(parenthetical.title).toContain("Attention");
    expect(parenthetical.venue).toBe("ACL");
  });

  it("parses plain-line certificates as separate items", () => {
    expect(structured.certificates.length).toBeGreaterThanOrEqual(2);
    expect(structured.certificates[0]!.name).toContain("AWS");
  });

  it("extracts location from a combined contact line", () => {
    expect(structured.location).toContain("Jersey City");
  });

  it("extracts social links from the header", () => {
    expect(structured.socialLinks.some((s) => s.platform === "github")).toBe(true);
  });

  it("keeps URLs intact through extraction", () => {
    const pub = structured.publications[0]!;
    expect(pub.url).toContain("https://doi.org");
  });
});
