import PDFDocument from "pdfkit";
import { extractText, structureResume } from "./src/services/parser.js";

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

const pdf = await new Promise<Buffer>((resolve, reject) => {
  const doc = new PDFDocument({ size: "LETTER", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  doc.on("end", () => resolve(Buffer.concat(chunks)));
  doc.on("error", reject);
  PDF_TEXT.forEach((line, i) => doc.fontSize(11).text(line, 50, 50 + i * 16));
  doc.end();
});

const text = await extractText(pdf, "application/pdf");
console.log("=== EXTRACTED TEXT ===");
console.log(JSON.stringify(text, null, 2));
const { structured } = structureResume(text);
console.log("EXPERIENCE COUNT:", structured.experience.length);
console.log(JSON.stringify(structured.experience.map((e) => e.role), null, 2));
