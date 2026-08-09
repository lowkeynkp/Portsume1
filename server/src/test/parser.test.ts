import { describe, it, expect } from "vitest";
import PDFDocument from "pdfkit";
import { structureResume, extractText } from "../services/parser.js";
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

describe("resume parsing across diverse layouts", () => {
  it("finds the name when a summary paragraph comes first", () => {
    const { structured, missing } = structureResume(`A multidisciplinary product designer with 8+ years crafting delightful web experiences. I blend editorial typography with playful interaction design, working across brand, product, and creative technology.

ALEX RIVERA
alex.rivera@example.com · (415) 555-0138 · San Francisco, CA
Senior Product Designer

EXPERIENCE
Senior Product Designer
Studio Nord — 2021 — Present
- Lead design for a portfolio platform
- Grew activation 31%

PROJECTS
Portsume — Portfolio builder
- Design system + UX for a resume-to-portfolio tool
TypeScript, React, Figma

EDUCATION
Rhode Island School of Design
BFA Graphic Design — 2013 — 2017
`);
    expect(structured.name).toBe("ALEX RIVERA");
    expect(structured.summary).toContain("multidisciplinary");
    expect(structured.experience.length).toBeGreaterThanOrEqual(1);
    expect(structured.summary).not.toContain("portfolio platform");
    expect(missing).not.toContain("Full name");
  });

  it("recovers the name from a combined 'Name | email | phone' header", () => {
    const { structured } = structureResume(`JANE DOE | jane.doe@example.com | (212) 555-0177
Software Engineer
New York, NY

EXPERIENCE
Software Engineer
Techvista — 2020 — Present
- Built internal tools

EDUCATION
Cornell University
BS Computer Science — 2015 — 2019

SKILLS
Languages: TypeScript, Python
`);
    expect(structured.name).toBe("JANE DOE");
    expect(structured.email).toBe("jane.doe@example.com");
    expect(structured.phone).toMatch(/212/);
    expect(structured.professionalTitle).toContain("Engineer");
    expect(structured.location).toContain("New York");
  });

  it("ignores a photo placeholder and summary before the name", () => {
    const { structured } = structureResume(`[Photo]
A highly motivated full-stack engineer with 6+ years building web products end to end. Led teams across fintech, health, and media, shipping features that moved real metrics.
AMELIA CHEN
amelia.chen@example.com · (737) 555-0144 · Austin, TX
Senior Full-Stack Engineer

EXPERIENCE
Senior Full-Stack Engineer
Orbital — 2019 — Present
- Led migration to a monorepo

PROJECTS
Aurora — Realtime dashboard
TypeScript, React, Node

EDUCATION
UT Austin
BS Computer Engineering — 2014 — 2018
`);
    expect(structured.name).toBe("AMELIA CHEN");
    expect(structured.professionalTitle).toContain("Engineer");
    expect(structured.email).toBe("amelia.chen@example.com");
  });

  it("handles education-first resumes with different section order and no skills", () => {
    const { structured } = structureResume(`MARKO PETROV
ml-petrov@proton.me · Berlin, Germany
Machine Learning Engineer

EDUCATION
Technical University of Munich
M.Sc. Computer Science — 2016 — 2018

EXPERIENCE
ML Engineer
Helix AI — 2019 — Present
- Built model serving infrastructure
- Cut inference cost 32%

PROJECTS
BERT Classifier — HuggingFace
Fine-tuned transformer models for sentiment classification.
Python, PyTorch
`);
    expect(structured.name).toBe("MARKO PETROV");
    expect(structured.education.length).toBeGreaterThanOrEqual(1);
    expect(structured.education[0]!.institution).toContain("Munich");
    expect(structured.education[0]!.degree).toContain("M.Sc.");
    expect(structured.experience[0]!.company).toContain("Helix AI");
    expect(structured.projects.length).toBeGreaterThanOrEqual(1);
    expect(structured.skills.length).toBe(0);
  });

  it("recognizes alternative section headings", () => {
    const { structured } = structureResume(`NINA KAPOOR
Product Marketing Manager
nina.k@example.com · (312) 555-0199 · Chicago, IL

PROFESSIONAL EXPERIENCE
Senior PMM
Brightwave — 2020 — Present
- Led go-to-market for 3 product launches

TECHNICAL SKILLS
Analytics: Amplitude, SQL
Design: Figma, Notion
`);
    expect(structured.name).toBe("NINA KAPOOR");
    expect(structured.experience.length).toBeGreaterThanOrEqual(1);
    expect(structured.experience[0]!.role).toContain("Senior");
    expect(structured.skills.some((g) => g.category.includes("Analytics"))).toBe(true);
    expect(structured.skills.some((g) => g.category.includes("Design"))).toBe(true);
  });

  it("returns empty name for resumes with no identity header", () => {
    const { structured, missing } = structureResume(`SUMMARY
A motivated professional with 5 years of experience delivering measurable results across teams.

EXPERIENCE
Account Manager
Brightwave — 2020 — Present
- Grew key accounts 27%

SKILLS
Sales: Negotiation, CRM
`);
    expect(structured.name).toBe("");
    expect(missing).toContain("Full name");
  });
});

describe("layout-aware PDF parsing", () => {
  async function makePdf(entries: Array<{ text: string; x: number; y: number; size?: number }>): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: "LETTER", margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      for (const e of entries) doc.fontSize(e.size ?? 11).text(e.text, e.x, e.y);
      doc.end();
    });
  }

  it("uses font-size hierarchy to pick the name even when it is not the first line", async () => {
    const pdf = await makePdf([
      { text: "ALPHA OMEGA", x: 50, y: 50, size: 16 },
      { text: "JORDAN ALMEIDA", x: 50, y: 70, size: 24 },
      { text: "jordan@example.dev · (212) 555-0144 · Brooklyn, NY", x: 50, y: 90 },
      { text: "EXPERIENCE", x: 50, y: 120 },
      { text: "Senior Software Engineer", x: 50, y: 140 },
      { text: "Northstar Labs — 2022 — Present", x: 50, y: 160 },
    ]);
    const { text, layout } = await extractText(pdf, "application/pdf");
    const { structured } = structureResume(text, layout);
    expect(structured.name).toContain("JORDAN");
    expect(structured.experience.length).toBeGreaterThanOrEqual(1);
  });

  it("finds the name in the right column of a two-column resume", async () => {
    const pdf = await makePdf([
      { text: "Creative engineer", x: 50, y: 50 },
      { text: "6+ years building web tools.", x: 50, y: 70 },
      { text: "EXPERIENCE", x: 50, y: 120 },
      { text: "Senior Engineer", x: 50, y: 140 },
      { text: "Northstar Labs", x: 50, y: 160 },
      { text: "JORDAN ALMEIDA", x: 350, y: 50, size: 22 },
      { text: "jordan@example.dev · (212) 555-0144", x: 350, y: 80 },
      { text: "Brooklyn, NY", x: 350, y: 100 },
    ]);
    const { text, layout } = await extractText(pdf, "application/pdf");
    const { structured } = structureResume(text, layout);
    expect(structured.name).toContain("JORDAN");
    expect(structured.experience.length).toBeGreaterThanOrEqual(1);
  });
});
