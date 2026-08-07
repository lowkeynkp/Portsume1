/* Seed a demo user with a fully generated, published portfolio.
 * Run from the server workspace:
 *   npm run seed -w server
 * Works in both in-memory and Supabase modes. Safe to re-run (idempotent). */
import { getStore } from "../src/db/index.js";
import { structureResume } from "../src/services/parser.js";
import { editorialEnhance } from "../src/services/ai.js";
import { generatePortfolio } from "../src/services/portfolioGenerator.js";
import { publishPortfolio } from "../src/services/publisher.js";
import { isSupabaseMode } from "../src/config/index.js";
import { uid } from "../src/lib/ids.js";

const DEMO_EMAIL = "demo@portsume.app";

async function main(): Promise<void> {
  const store = await getStore();

  if (!isSupabaseMode) {
    console.log("In-memory mode: seed data lives only in this process and won't appear in a running server.");
    console.log("Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to seed shared data, or use the upload flow instead.");
  }

  let user = await store.findUserByEmail(DEMO_EMAIL);
  if (!user) {
    user = await store.createUser({
      id: uid(),
      email: DEMO_EMAIL,
      name: "Alex Rivera",
      provider: "email",
    });
  }

  const existing = await store.listPortfoliosByUser(user.id);
  if (existing.length > 0) {
    const first = existing.find((p) => p.status === "published") ?? existing[0]!;
    console.log(`Demo portfolio already exists → ${first.publishedUrl ?? `/p/${first.slug}`}`);
    return;
  }

  const resumeText = `ALEX RIVERA
Product Designer & Creative Technologist
alex.rivera@example.com · San Francisco, CA · https://alexrivera.design

A multidisciplinary product designer with 8+ years crafting delightful web
experiences, blending editorial typography with playful interaction design.

EXPERIENCE

Senior Product Designer
Studio Nord — 2021 — Present
• Lead design for a portfolio platform used by 40k creatives
• Shipped a theme engine with 6 editorial layouts

Product Designer
Fable & Co — 2018 — 2021
• Designed the award-winning Fable reading app (Awwwards SOTD)
• Built a motion system adopted across 12 product surfaces

PROJECTS

Portsume — Portfolio generator for resumes — 2024
A tool that turns any resume into a published portfolio website.
TypeScript, React, Node, Supabase

Field Notes — Micro-interaction library — 2023
30+ hand-crafted easings and patterns.
Framer Motion, React

EDUCATION

California College of the Arts
BFA, Graphic Design — 2014 — 2018

SKILLS

Design: Figma, Framer, Prototyping, Design Systems
Engineering: TypeScript, React, Node.js, CSS
Strategy: Design Ops, Research, Storytelling

ACHIEVEMENTS
• Awwwards Site of the Day, 2023

LANGUAGES
English, Spanish, Japanese`;

  const { structured } = structureResume(resumeText);
  const enhanced = editorialEnhance(structured);

  const portfolio = await generatePortfolio({
    userId: user.id,
    fileName: "alex-rivera-resume.pdf",
    fileId: uid(),
    structured,
    enhanced,
  });

  const { site } = await publishPortfolio(portfolio.id);
  console.log(`Seeded → ${user.name} <${user.email}>`);
  console.log(`Published → ${site.url}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
