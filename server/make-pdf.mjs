import PDFDocument from "pdfkit";
const lines = [
  "SAM CARTER",
  "Product Designer",
  "sam.carter@hello.dev · (415) 555-0199 · Portland, OR",
  "behance.net/samcarter · linkedin.com/in/samcarter · dribbble.com/samcarter",
  "I design calm, human software products that people love to use.",
  "EXPERIENCE",
  "Senior Product Designer",
  "Halo Studio — 2021 — Present",
  "- Led end-to-end redesign of checkout, lifting conversion 18%",
  "- Built a component library adopted by 4 product teams",
  "Product Designer",
  "Fern & Co — 2018 — 2021",
  "- Shipped 30+ features across web and mobile",
  "AWARDS",
  "AIGA Design Award — 2022",
  "Adobe Design Achievement Award — 2020",
  "PUBLICATIONS",
  "Designing for Trust — UX Collective — 2023 — https://uxdesign.cc/designing-for-trust",
  "PROJECTS",
  "Lumen — Brand system",
  "A design system for AI-powered products.",
  "Figma, Tokens, React",
  "Sketchbook — Case study",
  "A mobile sketching app with realtime sync.",
  "Swift, Firebase",
  "EDUCATION",
  "Rhode Island School of Design",
  "BFA Industrial Design — 2014 — 2018",
  "SKILLS",
  "Design: Figma, Sketch, Prototyping, Wireframing",
  "Research: Usability Testing, Interviews, A/B Testing",
];
const pdf = await new Promise((resolve) => {
  const doc = new PDFDocument({ size: "LETTER", margin: 50 });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  doc.on("end", () => resolve(Buffer.concat(chunks)));
  lines.forEach((l, i) => doc.fontSize(11).text(l, 50, 50 + i * 16));
  doc.end();
});
import { writeFileSync } from "node:fs";
writeFileSync("/tmp/sam-carter.pdf", pdf);
console.log("wrote /tmp/sam-carter.pdf", pdf.length, "bytes");
