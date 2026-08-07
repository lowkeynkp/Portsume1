import OpenAI from "openai";
import type { PortfolioSEO, ResumeStructured, SkillGroup } from "@portsume/shared";
import { config } from "../config/index.js";
import { logger } from "../lib/logger.js";
import { uid } from "../lib/ids.js";

const log = logger.child("ai");

export interface EnhanceOutput {
  summary: string;
  bio: string;
  tagline: string;
  projectDescriptions: Record<string, string>;
  skillGroups: SkillGroup[];
  recommendedSections: string[];
  seo: PortfolioSEO;
  improvements: string[];
  warnings: string[];
}

/** Pure editorial polish — used as a fast, deterministic fallback and as a
 *  safety net for fields the model refuses to touch. Never invents facts. */
export function editorialEnhance(structured: ResumeStructured): EnhanceOutput {
  const base = structured.summary.trim() || "A professional who turns complex problems into clear outcomes.";
  const summary = base.replace(/\s+/g, " ").trim();
  const nameFirst = structured.name.trim() || "this portfolio";
  const title = structured.professionalTitle.trim();

  const skillGroups: SkillGroup[] =
    structured.skills.length > 0
      ? structured.skills
      : (() => {
          const words =
            structured.experience
              .flatMap((e) => [...(e.highlights ?? [])])
              .join(" ")
              .match(/\b[A-Z][A-Za-z+#.]{2,}\b/g) ?? [];
          if (words.length === 0) return [];
          const group: SkillGroup = { id: uid(), category: "Skills", skills: [...new Set(words)].slice(0, 24) };
          return [group];
        })();

  const tags = [
    title,
    ...structured.experience.map((e) => e.role),
    ...structured.skills.flatMap((s) => s.skills.slice(0, 3)),
  ]
    .filter(Boolean)
    .slice(0, 6);

  const projectDescriptions: Record<string, string> = {};
  for (const p of structured.projects) {
    if (p.description && p.description.trim().length > 20 && !projectDescriptions[p.id]) {
      projectDescriptions[p.id] = p.description.replace(/\s+/g, " ").trim();
    }
  }

  const seo: PortfolioSEO = {
    title: `${structured.name} — ${title || "Portfolio"}`,
    description: summary.slice(0, 155),
    keywords: [...new Set(tags)],
  };

  return {
    summary,
    bio: summary,
    tagline: title || `${nameFirst} — making things people love`,
    projectDescriptions,
    skillGroups,
    recommendedSections: [
      ...(structured.projects.length === 0 ? [] : ["Projects"]),
      ...(structured.experience.length === 0 ? [] : ["Experience"]),
      ...(structured.skills.length === 0 ? [] : ["Skills"]),
      "About",
      "Contact",
    ],
    seo,
    improvements: ["Normalized whitespace and casing", "Grouped skills by category", "Generated SEO metadata"],
    warnings: structured.projects.length === 0 ? ["No projects detected — consider adding at least one project to strengthen the portfolio."] : [],
  };
}

async function openAiEnhance(structured: ResumeStructured): Promise<EnhanceOutput> {
  const client = new OpenAI({ apiKey: config.openai.apiKey });
  const prompt = `You are a senior copywriter and portfolio strategist working on a user's portfolio website.
Enhance the following resume content. HARD RULES:
- NEVER fabricate experience, employers, projects, skills, dates or credentials. Only polish what exists.
- If a field is empty, leave it empty.
- Keep a warm, confident, human editorial voice. No corporate filler, no buzzwords.
- Return strict JSON.

Resume JSON:
${JSON.stringify(structured, null, 2)}

Return JSON of shape:
{
  "summary": string,
  "bio": string,
  "tagline": string,
  "projectDescriptions": { "<projectId>": string },
  "skillGroups": [{ "id": string, "category": string, "skills": string[] }],
  "recommendedSections": string[],
  "seo": { "title": string, "description": string, "keywords": string[] },
  "improvements": string[],
  "warnings": string[]
}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a precise JSON-producing assistant. Only return valid JSON, no prose." },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message.content ?? "";
  const parsed = JSON.parse(raw) as Partial<EnhanceOutput>;
  const fallback = editorialEnhance(structured);

  return {
    summary: typeof parsed.summary === "string" && parsed.summary ? parsed.summary : fallback.summary,
    bio: typeof parsed.bio === "string" && parsed.bio ? parsed.bio : fallback.bio,
    tagline: typeof parsed.tagline === "string" && parsed.tagline ? parsed.tagline : fallback.tagline,
    projectDescriptions: parsed.projectDescriptions ?? fallback.projectDescriptions,
    skillGroups: Array.isArray(parsed.skillGroups) && parsed.skillGroups.length ? parsed.skillGroups : fallback.skillGroups,
    recommendedSections: Array.isArray(parsed.recommendedSections) ? parsed.recommendedSections : fallback.recommendedSections,
    seo: { ...fallback.seo, ...parsed.seo },
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements : fallback.improvements,
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : fallback.warnings,
  };
}

/** Enhance structured resume content. Uses the model when configured,
 *  otherwise a deterministic editorial fallback. */
export async function enhanceResume(structured: ResumeStructured): Promise<EnhanceOutput> {
  if (config.openai.apiKey) {
    try {
      const out = await openAiEnhance(structured);
      log.info("ai enhancement completed", { provider: "openai" });
      return out;
    } catch (e) {
      log.warn("openai enhancement failed — falling back to editorial engine", { error: String(e) });
    }
  }
  const out = editorialEnhance(structured);
  log.info("ai enhancement completed", { provider: "editorial" });
  return out;
}

/** Sanitize free-form text to block prompt-injection payloads from resume files. */
export function sanitizeText(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\bjavascript\s*:/gi, " ")
    .replace(/\bdata\s*:\s*text\/(html|script)\b/gi, " ")
    .replace(/```/g, " ")
    .replace(/<\s*(script|iframe|object|embed|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, " ")
    .replace(/[<>]/g, (c) => (c === "<" ? "\u02C2" : "\u02C3"))
    .slice(0, 24_000);
}
