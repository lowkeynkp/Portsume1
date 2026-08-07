import type {
  Portfolio,
  PortfolioContent,
  PortfolioSEO,
  ResumeStructured,
  TimelineEntry,
  ProjectEntry,
  SkillGroup,
} from "@portsume/shared";
import type { Store } from "../db/store.js";
import { getStore } from "../db/index.js";
import type { EnhanceOutput } from "../services/ai.js";
import { uid, nanoId } from "../lib/ids.js";
import { titleCase } from "../lib/text.js";
import { DEFAULT_THEME, ACCENT_PALETTE } from "../modules/themes/themeCatalog.js";

export interface GeneratePortfolioInput {
  userId: string;
  fileName: string;
  fileId: string;
  structured: ResumeStructured;
  enhanced: EnhanceOutput;
  storageUrl?: string;
}

const DESIGN_ROLES = /design|creative|artist|brand|illustrator|art director/i;
const ENGINEER_ROLES = /eng|develop|soft|architect|data|scien|full[- ]stack|back[- ]end|front[- ]end|ml|ai/i;
const RESEARCH_ROLES = /resear|professor|academ|scien|data|analyst|phd/i;

function pickAccent(structured: ResumeStructured): string {
  const byRole = `${structured.professionalTitle} ${structured.experience[0]?.role ?? ""}`;
  if (DESIGN_ROLES.test(byRole)) return "#F68D7A";
  if (RESEARCH_ROLES.test(byRole)) return "#8ED8F8";
  if (ENGINEER_ROLES.test(byRole)) return "#157A43";
  return ACCENT_PALETTE[Math.floor(Math.random() * ACCENT_PALETTE.length)] ?? "#F68D7A";
}

function firstSentence(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  const match = t.match(/^[^.!?]*[.!?]/);
  return (match ? match[0] : t.slice(0, 80)).trim();
}

/** Parse "2021" (or "Jan 2021") out of a date string for sorting. */
function yearOf(date?: string): number {
  if (!date) return 0;
  const y = date.match(/\b(20\d{2}|19\d{2})\b/);
  return y ? Number(y[0]) : 0;
}

/** Chronological (most recent first); entries still marked "current" float top. */
function orderTimeline(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => {
    const rank = (e: TimelineEntry) => (e.current ? 1 : 0);
    if (rank(a) !== rank(b)) return rank(b) - rank(a);
    return yearOf(b.start ?? b.end) - yearOf(a.start ?? a.end);
  });
}

/** Rank projects: featured/complete first, then by recency. */
function orderProjects(entries: ProjectEntry[]): { projects: ProjectEntry[]; featured: string[] } {
  const withMeta = entries.map((p) => ({
    p,
    score: (p.url ? 2 : 0) + (p.highlights?.length ? 1 : 0) + (p.techStack.length ? 1 : 0) + (p.description.length > 40 ? 1 : 0),
    recency: yearOf(p.url?.match(/\d{4}/)?.[0] ?? undefined),
  }));
  const sorted = [...withMeta].sort((a, b) => b.score - a.score || a.p.sortOrder - b.p.sortOrder);
  const featured = sorted.filter((x) => x.score >= 3).map((x) => x.p.id);
  return {
    projects: sorted.map((x) => x.p),
    featured: featured.slice(0, 3),
  };
}

function groupSkills(structured: ResumeStructured, enhanced: SkillGroup[]): SkillGroup[] {
  if (enhanced.length > 0) return enhanced;
  if (structured.skills.length > 0) return structured.skills;
  const words =
    structured.experience.flatMap((e) => [...(e.highlights ?? []), e.role]).join(" ").match(/\b[A-Z][A-Za-z+#.]{2,}\b/g) ?? [];
  return words.length ? [{ id: uid(), category: "Skills", skills: [...new Set(words)].slice(0, 24) }] : [];
}

function buildContent(input: GeneratePortfolioInput): PortfolioContent {
  const { structured, enhanced, fileId, fileName, storageUrl } = input;
  const name = titleCase(structured.name.trim()) || "Your Name";
  const firstName = name.split(" ")[0] ?? "this portfolio";
  const role = structured.professionalTitle.trim();

  const summarySentence = firstSentence(structured.summary || enhanced.summary || "");
  const headline =
    summarySentence.length >= 12 && summarySentence.length <= 72
      ? summarySentence
      : role
        ? `${name} — ${role}`
        : `Hi, I'm ${firstName}`;

  const tagline =
    enhanced.tagline && enhanced.tagline !== role
      ? enhanced.tagline
      : structured.summary.replace(/\s+/g, " ").trim().slice(0, 140) ||
        `A ${role.toLowerCase() || "professional"} who turns complex problems into clear outcomes.`;

  const { projects, featured } = orderProjects(structured.projects);
  const experience = orderTimeline(structured.experience);
  const heroImages = [storageUrl].filter((u): u is string => Boolean(u));

  return {
    landing: {
      headline,
      tagline,
      heroImages,
    },
    about: {
      name,
      role,
      heading: `A little about ${firstName}`,
      bio: enhanced.bio || structured.summary,
      photoUrl: undefined,
    },
    experience,
    projects: projects.map((p) => ({
      ...p,
      description: enhanced.projectDescriptions[p.id] ?? p.description,
    })),
    skills: groupSkills(structured, enhanced.skillGroups),
    education: structured.education,
    certificates: structured.certificates,
    achievements: structured.achievements,
    awards: structured.awards,
    publications: structured.publications,
    languages: structured.languages,
    socialLinks: structured.socialLinks,
    contact: {
      email: structured.email || "",
      location: structured.location,
      phone: structured.phone,
      availableForWork: structured.experience.some((e) => e.current) || true,
    },
    resumeDownload: { fileId, fileName, url: storageUrl },
    featuredProjectIds: featured,
    sections: {
      about: { visible: Boolean(structured.summary || enhanced.bio) },
      projects: { visible: projects.length > 0 },
      experience: { visible: experience.length > 0 },
      skills: { visible: true },
      education: { visible: structured.education.length > 0 },
      certificates: { visible: structured.certificates.length > 0 },
      achievements: { visible: structured.achievements.length > 0 },
      awards: { visible: structured.awards.length > 0 },
      publications: { visible: structured.publications.length > 0 },
      languages: { visible: structured.languages.length > 0 },
      contact: { visible: true },
    },
  };
}

function buildSeo(structured: ResumeStructured, enhanced: EnhanceOutput): PortfolioSEO {
  const name = titleCase(structured.name.trim());
  return {
    title: enhanced.seo.title
      ? enhanced.seo.title.replace(new RegExp(escapeRegex(structured.name.trim())), name)
      : `${name} — ${structured.professionalTitle || "Portfolio"}`,
    description: enhanced.seo.description || structured.summary.slice(0, 155),
    keywords: enhanced.seo.keywords,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Derive SEO metadata from current portfolio content. Used to keep the
 *  live page's <title>/description in sync with the user's latest edits. */
export function seoFromContent(content: PortfolioContent): PortfolioSEO {
  const name = content.about?.name?.trim() || "Portfolio";
  const role = content.about?.role?.trim();
  const headline = content.landing?.headline?.trim() || content.about?.bio?.trim() || "";
  return {
    title: role ? `${name} — ${role}` : name,
    description: headline.slice(0, 155),
    keywords: (content.skills ?? []).flatMap((g) => g.skills ?? []).slice(0, 8),
  };
}

/** Generate a fresh portfolio from parsed + enhanced resume data.
 *  Content is theme-independent: themes render this JSON, never copy it. */
export async function generatePortfolio(input: GeneratePortfolioInput): Promise<Portfolio> {
  const store: Store = await getStore();
  const slug = await store.ensureSlugUnique(input.structured.name || "portfolio");
  const accent = pickAccent(input.structured);

  const portfolio = await store.createPortfolio({
    id: uid(),
    userId: input.userId,
    slug,
    title: input.structured.name || "My Portfolio",
    themeId: DEFAULT_THEME,
    content: buildContent(input),
    seo: buildSeo(input.structured, input.enhanced),
    accent,
  });

  await store.addPortfolioVersion(portfolio.id, 1, portfolio.content);
  return portfolio;
}

export async function createGuestPreview(data: GeneratePortfolioInput): Promise<Portfolio> {
  const store: Store = await getStore();
  const slug = `preview-${nanoId(8)}`;
  const content = buildContent(data);
  const seo = buildSeo(data.structured, data.enhanced);
  return store.createPortfolio({
    id: uid(),
    userId: data.userId,
    slug,
    title: content.landing.headline,
    themeId: DEFAULT_THEME,
    content,
    seo,
    accent: pickAccent(data.structured),
  });
}
