import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import mammoth from "mammoth";
import type {
  ResumeStructured,
  TimelineEntry,
  ProjectEntry,
  EducationEntry,
  AwardEntry,
  PublicationEntry,
  SocialLink,
} from "@portsume/shared";
import { logger } from "../lib/logger.js";
import { uid } from "../lib/ids.js";

const log = logger.child("parsing");

// pdf.js needs its bundled standard fonts only to re-render; for text
// extraction they're unnecessary, but supplying the path silences warnings.
const pdfjsRoot = dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json"));

/* ────────────────────────────────────────────────────────────
   Layout-aware PDF text extraction.

   pdf.js hands us raw text runs with (x, y) coordinates and the font
   matrix. Instead of trusting reading order (which destroys two/three-
   column resumes) we reconstruct lines, detect column splits from
   x-gaps, and emit each column in reading order. Along the way we keep
   per-line layout metadata (position, font size, page) so downstream
   classifiers can weigh visual hierarchy — e.g. a large, isolated,
   prominent line is much likelier to be the person's name.
   ──────────────────────────────────────────────────────────── */

interface TextRun {
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontName?: string;
  text: string;
}

/** Layout metadata for one emitted text line. `null` entries mark blank
 *  separator lines that exist in the text but carry no glyphs. */
export interface LineLayout {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontName?: string;
  page: number;
}

export interface ExtractedText {
  text: string;
  layout?: (LineLayout | null)[];
}

function collectRuns(items: unknown[], out: TextRun[] = []): TextRun[] {
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const item = it as { str?: unknown; transform?: unknown; width?: unknown; fontName?: unknown; items?: unknown };
    if (typeof item.str === "string" && item.str.length > 0) {
      const t = Array.isArray(item.transform) ? (item.transform as number[]) : [1, 0, 0, 1, 0, 0];
      out.push({
        x: t[4] ?? 0,
        y: t[5] ?? 0,
        width: typeof item.width === "number" ? item.width : item.str.length * 4,
        fontSize: Math.max(Math.abs(t[0] ?? 0), Math.abs(t[3] ?? 0)) || 0,
        fontName: typeof item.fontName === "string" ? item.fontName : undefined,
        text: item.str,
      });
    }
    if (Array.isArray(item.items)) collectRuns(item.items, out);
  }
  return out;
}

const LINE_BUCKET = 3; // vertical tolerance (pdf units) to treat runs as one line

interface Segment {
  x: number;
  xEnd: number;
  fontSize: number;
  fontName?: string;
  text: string;
}

/** Turn raw text runs into aligned text + layout lines. The returned
 *  `lines` array is index-aligned with `text.split("\n")` (blank
 *  separators appear as `null`). */
function layoutPage(runs: TextRun[], pageIndex: number): { text: string; lines: (LineLayout | null)[] } {
  if (runs.length === 0) return { text: "", lines: [] };
  const pageWidth = Math.max(...runs.map((r) => r.x + r.width), 500);
  const gapThreshold = Math.max(30, pageWidth * 0.09);

  // Some producers (pdfkit, many report writers) render with a y-flip so PDF
  // y decreases as you move down the page. Detect the vertical direction from
  // the encoded run order and sort accordingly.
  let downward = 0;
  let upward = 0;
  for (let i = 1; i < runs.length; i++) {
    const dy = (runs[i]?.y ?? 0) - (runs[i - 1]?.y ?? 0);
    if (Math.abs(dy) > 2) {
      if (dy > 0) downward++;
      else upward++;
    }
  }
  const sortAsc = downward >= upward;
  const byTop = (a: number, b: number) => (sortAsc ? a - b : b - a);
  // Normalize stored y so it always increases DOWN the page (rows are sorted
  // top-to-bottom regardless). Downstream classifiers compare y directly.
  const normY = (y: number) => (sortAsc ? y : -y);

  // Group runs into visual lines by vertical position.
  const lines = new Map<number, TextRun[]>();
  for (const r of runs) {
    const key = Math.round(r.y / LINE_BUCKET);
    const arr = lines.get(key) ?? [];
    arr.push(r);
    lines.set(key, arr);
  }

  const row: Array<{ y: number; segments: Segment[] }> = [...lines.entries()]
    .sort((a, b) => byTop(a[0], b[0]))
    .map(([y, arr]) => {
      const sorted = [...arr].sort((a, b) => a.x - b.x);
      const segments: Segment[] = [];
      for (const r of sorted) {
        const last = segments[segments.length - 1];
        if (last && r.x - last.xEnd < gapThreshold) {
          last.text += r.text;
          last.xEnd = r.x + r.width;
          last.fontSize = Math.max(last.fontSize, r.fontSize);
          if (!last.fontName && r.fontName) last.fontName = r.fontName;
        } else {
          segments.push({ x: r.x, xEnd: r.x + r.width, text: r.text, fontSize: r.fontSize, fontName: r.fontName });
        }
      }
      return { y, segments };
    });

  // Detect column clusters from segment x-positions.
  const xs = row.flatMap((l) => l.segments.map((s) => s.x)).sort((a, b) => a - b);
  const clusters: number[][] = [];
  for (const x of xs) {
    const last = clusters[clusters.length - 1];
    if (last && x - last[last.length - 1]! < pageWidth * 0.12) last.push(x);
    else clusters.push([x]);
  }

  const isMultiColumn = clusters.length >= 2 && clusters[clusters.length - 1]![0]! > pageWidth * 0.4;

  if (!isMultiColumn) {
    // Single column: concatenate each visual line.
    const out: (LineLayout | null)[] = [];
    for (const l of row) {
      const segs = l.segments;
      const text = segs.map((s) => s.text).join("");
      if (!text.trim()) {
        out.push(null);
        continue;
      }
      out.push({
        text,
        x: Math.min(...segs.map((s) => s.x)),
        y: normY(l.y),
        fontSize: Math.max(...segs.map((s) => s.fontSize)),
        fontName: segs.find((s) => s.fontName)?.fontName,
        page: pageIndex,
      });
    }
    return { text: out.map((e) => (e ? e.text : "")).join("\n"), lines: out };
  }

  // Multi-column: assign every segment to the nearest column, then emit
  // each column top-to-bottom, columns separated by a blank line.
  const centroids = clusters.map((c) => c.reduce((a, b) => a + b, 0) / c.length);
  interface ColRun {
    x: number;
    lineY: number;
    text: string;
    fontSize: number;
    fontName?: string;
  }
  const cols: ColRun[][] = centroids.map(() => []);
  for (const l of row) {
    for (const seg of l.segments) {
      let best = 0;
      let bestD = Infinity;
      centroids.forEach((c, i) => {
        const d = Math.abs(c - seg.x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      cols[best]!.push({ x: seg.x, lineY: l.y, text: seg.text, fontSize: seg.fontSize, fontName: seg.fontName });
    }
  }

  const columnLines = cols.map((col) => {
    const byLine = new Map<number, Array<{ x: number; text: string; fontSize: number; fontName?: string }>>();
    for (const r of [...col].sort((a, b) => byTop(a.lineY, b.lineY) || a.x - b.x)) {
      const k = Math.round(r.lineY / LINE_BUCKET);
      const arr = byLine.get(k) ?? [];
      arr.push({ x: r.x, text: r.text, fontSize: r.fontSize, fontName: r.fontName });
      byLine.set(k, arr);
    }
    return [...byLine.entries()]
      .sort((a, b) => byTop(a[0], b[0]))
      .map(([k, arr]) => ({
        text: arr.map((s) => s.text).join(""),
        x: Math.min(...arr.map((s) => s.x)),
        y: normY(k * LINE_BUCKET),
        fontSize: Math.max(...arr.map((s) => s.fontSize)),
        fontName: arr.find((s) => s.fontName)?.fontName,
      }));
  }).filter((block) => block.length > 0);

  const out: (LineLayout | null)[] = [];
  for (let i = 0; i < columnLines.length; i++) {
    if (out.length > 0) out.push(null);
    for (const e of columnLines[i]!) out.push({ ...e, page: pageIndex });
  }
  return { text: out.map((e) => (e ? e.text : "")).join("\n"), lines: out };
}

async function extractPdfText(buffer: Buffer): Promise<ExtractedText> {
  const data = new Uint8Array(buffer);
  const loadingTask = getDocument({
    data,
    useWorkerFetch: false,
    standardFontDataUrl: join(pdfjsRoot, "standard_fonts/") + "/",
  });
  const doc = await loadingTask.promise;
  try {
    const textLines: string[] = [];
    const allLines: (LineLayout | null)[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const runs = collectRuns(content.items);
      const { text, lines } = layoutPage(runs, i);
      if (textLines.length > 0) {
        textLines.push("");
        allLines.push(null);
      }
      const pageTextLines = text.split("\n");
      for (let j = 0; j < pageTextLines.length; j++) {
        textLines.push(pageTextLines[j] ?? "");
        allLines.push(lines[j] ?? null);
      }
    }
    return { text: textLines.join("\n"), layout: allLines };
  } finally {
    await loadingTask.destroy();
  }
}

export class UnreadableResumeError extends Error {
  constructor(message: string, readonly reason: string) {
    super(message);
  }
}

/* ────────────────────────────────────────────────────────────
   Section detection — keyword anchored to a header line, so it
   works with ALL-CAPS, Title Case, and "—" separated headings and
   never depends on a rigid layout or exact wording.
   ──────────────────────────────────────────────────────────── */

type SectionId =
  | keyof ResumeStructured
  | "summary"
  | "certificates"
  | "achievements"
  | "awards"
  | "publications"
  | "languages"
  | "volunteer"
  | "socialLinks"
  | "contact";

const SECTION_KEYWORDS: Array<{ id: SectionId; re: RegExp }> = [
  {
    id: "summary",
    re: /^(professional\s*)?(summary|profile|about\s*me?|objective|overview|summary\s*of\s*qualifications|qualifications\s*(summary|highlights)|career\s*(summary|objective)|personal\s*profile|professional\s*profile|highlights?\s*of\s*qualifications)$/i,
  },
  {
    id: "experience",
    re: /^(work|professional|employment|relevant|career|job|intern(?:ship)?s?)?\s*(experience|history|background|experience\s+history)?s?$/i,
  },
  {
    id: "projects",
    re: /^(selected|personal|featured|academic|side|open\s+sourced?)?\s*(projects?|project\s*(work|experience)?|open\s+source|side\s+projects?|code\s+projects?|portfolio)$/i,
  },
  {
    id: "education",
    re: /^(education|academic\s+background|academic\s+history|educational\s+background|education\s*(?:&|and)\s*trainings?|academics|training)$/i,
  },
  {
    id: "skills",
    re: /^(skills?|technical\s+skills?|core\s+competenc(?:ies|y)|competenc(?:ies|y)|technolog(?:ies|y)|tech\s+stack|toolkit|skills\s*&\s*technologies|technical\s+skills?\s*&\s*tools|tools\s*&\s*technologies|areas?\s*of\s*expertise|expertise|key\s+skills|core\s+strengths)$/i,
  },
  {
    id: "certificates",
    re: /^(certifications?|certificates?|licenses?\s*(?:&\s*certifications?)?|credentials?|courses?\s*(?:&\s*certifications?)?)$/i,
  },
  {
    id: "awards",
    re: /^(awards?|honors?\s*(?:&\s*awards?)?|recognitions?|accomplishments|prizes?|distinctions|scholarships?)$/i,
  },
  { id: "achievements", re: /^(achievements?|key\s+achievements|highlights|notable\s+achievements)$/i },
  {
    id: "publications",
    re: /^(publications?|papers?|research|research\s+experience|presentations?|writings?|talks?|speaking\s+engagements?|articles?)$/i,
  },
  { id: "languages", re: /^(languages?\s*(?:&\s*technologies)?|spoken\s+languages?|language\s+proficiency)$/i },
  {
    id: "volunteer",
    re: /^(volunteer(ing)?|volunteer\s+experience|community|leadership|leadership\s+experience|positions\s*of\s*responsibility|extracurricular(?:s|activities)?|co-curricular|responsibilities)$/i,
  },
  { id: "socialLinks", re: /^(social\s*(links|profiles)?|links|find\s*me|connect|profiles?)$/i },
  { id: "contact", re: /^(contact|contact\s+info(?:rmation)?|details|personal\s*(details|information|info)|get\s*in\s*touch|reach\s*me|say\s*hello)$/i },
];

/** Recognize a resume section header line, or null. */
function detectSection(line: string): SectionId | null {
  const t = line.trim().replace(/[-–—:·|•]\s*$/, "");
  if (!t || t.length > 52) return null;
  for (const { id, re } of SECTION_KEYWORDS) {
    if (re.test(t)) return id;
  }
  // Fallback: a standalone all-caps word that looks like a section header.
  if (/^[A-Z][A-Z\s&/-]{1,}$/.test(t)) {
    const lower = t.toLowerCase();
    for (const { id, re } of SECTION_KEYWORDS) {
      if (re.test(lower)) return id;
    }
  }
  return null;
}

const SKILL_GROUP_HINTS: Array<{ category: string; match: RegExp }> = [
  { category: "Languages", match: /\b(programming\s*languages|languages)\b/i },
  { category: "Frameworks & Libraries", match: /\b(frameworks|libraries|technologies|tech\s*stack)\b/i },
  { category: "Tools & Platforms", match: /\b(tools|platforms|cloud|devops)\b/i },
  { category: "Design & Creative", match: /\b(design|creative|prototyping)\b/i },
  { category: "Soft Skills", match: /\b(soft\s*skills|interpersonal|leadership|communication)\b/i },
];

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const URL_RE = /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+(?:\/[^\s,;)]*)?)/g;
const CONTACT_LINE_RE =
  /@|https?:\/\/|www\.|(linkedin|github|behance|dribbble|twitter|medium|dev\.to)\.com|\d{3}[\s.-]\d{3}[\s.-]\d{4}|^[A-Z][a-zA-Z\s.]*,\s*[A-Z]{2}(\s+\d{5})?$|·|—|\|/;

/** True when a line looks like contact/identity metadata rather than prose. */
function isContactLike(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (EMAIL_RE.test(t) || PHONE_RE.test(t) || /https?:\/\/|www\.|\.com\b|\.net\b|\.org\b|\.io\b|\.dev\b/i.test(t)) return true;
  if (/^[A-Z][A-Za-z.\s'-]+,\s*[A-Z]{2}(\s+\d{5})?\s*$/.test(t)) return true;
  if (/[·|]/.test(t)) {
    const segs = t.split(/[·|]/).map((s) => s.trim()).filter(Boolean);
    return segs.some(
      (s) =>
        EMAIL_RE.test(s) ||
        PHONE_RE.test(s) ||
        /https?:\/\/|www\.|\.com\b|\.net\b|\.io\b|\.dev\b|@/i.test(s) ||
        /^[A-Z][A-Za-z.\s'-]+,\s*[A-Z]{2}$/.test(s),
    );
  }
  return false;
}

/* ────────────────────────────────────────────────────────────
   Identity detection (name + professional title).

   The person's name is never simply "the first line": PDF extraction
   doesn't preserve visual hierarchy, and resumes place the name in many
   different spots. We generate candidates from the header region and
   score each one with multiple, independent signals:

     • Position near the top of the document
     • Visual hierarchy (largest / most prominent font when available)
     • Adjacency to contact information
     • Name-like linguistic shape (short, capitalized, no role words)
     • Isolation (blank lines around it)
     • Not a section heading, contact line, date or URL
   ──────────────────────────────────────────────────────────── */

/** Common role / sector words that signal a professional title, not a name. */
const ROLE_WORDS = new Set([
  "engineer", "developer", "designer", "manager", "director", "consultant", "analyst", "scientist",
  "specialist", "architect", "lead", "officer", "head", "founder", "co-founder", "intern", "associate",
  "coordinator", "administrator", "strategist", "writer", "editor", "researcher", "instructor",
  "professor", "accountant", "lawyer", "attorney", "nurse", "physician", "therapist", "technician",
  "photographer", "producer", "artist", "marketer", "recruiter", "teacher", "lecturer", "technologist",
  "solutions", "adviser", "advisor", "executive", "president", "ceo", "cto", "cfo", "coo", "vp", "owner",
  "contractor", "freelancer", "graduate", "undergraduate", "scholar", "fellow", "intern",
  "software", "product", "program", "project", "operations", "marketing", "sales", "finance",
  "account", "customer", "support", "quality", "assurance", "devops", "full-stack", "fullstack",
  "front-end", "frontend", "back-end", "backend", "mobile", "web", "ux", "ui", "graphic", "visual",
  "creative", "content", "technical", "engineering", "research", "data", "cloud", "machine", "learning",
  "artificial", "intelligence", "security", "design", "growth", "business", "strategy", "human",
  "resources", "professional", "freelance", "independent", "consulting", "principal", "senior",
  "junior", "staff", "chief", "leadership", "manager", "engineer",
]);

/** Structural filler / heading / date words — never part of a person's name. */
const STRUCTURAL_WORDS = new Set([
  "resume", "résumé", "curriculum", "vitae", "cv", "profile", "portfolio", "objective", "summary",
  "overview", "experience", "education", "skills", "projects", "contact", "references",
  "certifications", "achievements", "awards", "publications", "languages", "volunteer", "leadership",
  "activities", "extracurricular", "internships", "training", "qualifications", "about", "me", "work",
  "employment", "history", "background", "details", "information", "info", "the", "and", "of", "for",
  "with", "in", "at", "on", "by", "to", "a", "an", "or", "as", "is", "are", "was", "were", "be",
  "been", "this", "that", "these", "those", "my", "your", "our", "their", "his", "her", "its",
  "present", "current", "ongoing", "now", "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december", "jan", "feb", "mar", "apr",
  "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec", "bachelor", "master", "doctor", "phd",
  "diploma", "degree", "certificate", "associate", "b.s", "b.a", "m.s", "m.a", "mba", "bsc", "msc",
  "btech", "b.e", "m.e", "llb", "llm", "b.f.a", "m.f.a",
  "corporation", "corp", "inc", "llc", "ltd", "gmbh", "limited", "company",
  "technologies", "labs", "studio", "co", "llp", "plc",
]);

/** Common city / country name fragments — guards against picking a
 *  location line (e.g. "San Francisco, CA") as the person's name. */
const GEO_WORDS = new Set([
  "san", "francisco", "los", "angeles", "new", "york", "washington", "seattle", "portland", "boston",
  "chicago", "miami", "austin", "denver", "houston", "dallas", "phoenix", "atlanta", "philadelphia",
  "baltimore", "cleveland", "cincinnati", "pittsburgh", "indianapolis", "milwaukee", "minneapolis",
  "kansas", "city", "memphis", "nashville", "orlando", "tampa", "louisville", "charlotte", "raleigh",
  "salt", "lake", "santa", "monica", "anaheim", "san", "diego", "sacramento", "oakland", "brooklyn",
  "queens", "manhattan", "bronx", "staten", "island", "jersey", "toronto", "vancouver", "montreal",
  "ottawa", "calgary", "edmonton", "winnipeg", "london", "paris", "berlin", "munich", "hamburg",
  "cologne", "frankfurt", "madrid", "barcelona", "rome", "milan", "naples", "turín", "turin",
  "amsterdam", "rotterdam", "brussels", "vienna", "zurich", "geneva", "basel", "stockholm", "oslo",
  "copenhagen", "helsinki", "dublin", "warsaw", "prague", "budapest", "bucharest", "lisbon",
  "tokyo", "osaka", "kyoto", "beijing", "shanghai", "shenzhen", "hong", "kong", "singapore",
  "sydney", "melbourne", "brisbane", "perth", "auckland", "wellington", "dubai", "mumbai", "delhi",
  "bengaluru", "hyderabad", "chennai", "kolkata", "pune", "united", "states", "america", "canada",
  "india", "australia", "england", "scotland", "wales", "ireland", "germany", "france", "italy",
  "spain", "portugal", "netherlands", "belgium", "switzerland", "austria", "sweden", "norway",
  "denmark", "poland", "czech", "japan", "china", "south", "korea", "brazil", "mexico", "argentina",
  "chile", "colombia", "peru", "africa", "egypt", "nigeria", "kenya", "uk", "usa", "uae", "eu",
]);

/** Degree / honorific tokens that never belong in a name. */
const DEGREE_TOKEN_RE =
  /^(?:b\.?a\.?|b\.?s\.?|b\.?sc\.?|b\.?e\.?|b\.?tech\.?|b\.?f\.?a\.?|b\.?b\.?a\.?|b\.?com\.?|b\.?des\.?|b\.?eng\.?|m\.?a\.?|m\.?s\.?|m\.?sc\.?|m\.?tech\.?|m\.?e\.?|m\.?f\.?a\.?|m\.?b\.?a\.?|m\.?c\.?a\.?|m\.?p\.?h\.?|m\.?p\.?a\.?|m\.?des\.?|m\.?eng\.?|ph\.?d\.?|edd|dds|dmd|j\.?d\.?|ll\.?b\.?|ll\.?m\.?|dr|prof|professor|sir|mr|mrs|ms|miss)$/i;

/** Strip trailing "resume"/"cv" decorations, e.g. "JANE DOE | RESUME". */
function stripResumeSuffix(line: string): string {
  return line
    .replace(/\s*[-–—|·/:]\s*(?:curriculum\s*vitae|c\.?v\.?|r[eé]sum[eé]|resume)\s*$/i, "")
    .replace(/\s*\((?:curriculum\s*vitae|c\.?v\.?|r[eé]sum[eé]|resume)\)\s*$/i, "")
    .replace(/\s*[-–—|·/:]\s*(?:curriculum\s*vitae|c\.?v\.?|r[eé]sum[eé]|resume)\b.*$/i, "")
    .trim();
}

/** Does this phrase have the shape of a person's name? */
function looksLikeNamePhrase(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (t.length < 2 || t.length > 40) return false;
  if (EMAIL_RE.test(t) || PHONE_RE.test(t) || /https?:\/\/|www\.|@/.test(t)) return false;
  const tokens = t.split(/\s+/).filter(Boolean);
  if (tokens.length < 1 || tokens.length > 4) return false;
  for (const tok of tokens) {
    const lower = tok.toLowerCase();
    if (DEGREE_TOKEN_RE.test(tok)) return false;
    if (ROLE_WORDS.has(lower)) return false;
    if (!/^[A-Z][A-Za-z.'’-]*$/.test(tok) && !/^[A-Z]{1,2}\.$/.test(tok) && !/^[A-Z]{2,}$/.test(tok)) return false;
  }
  if (tokens.length === 1 && tokens[0]!.length <= 2) return false;
  if (tokens.every((tok) => GEO_WORDS.has(tok.toLowerCase()))) return false;
  return true;
}

/** Split a header line into name-like candidates (handles "Name | Title |
 *  email@…" combined lines, "Name, Ph.D.", location combos, etc.). */
function candidateSegments(line: string): string[] {
  const stripped = stripResumeSuffix(line);
  if (!stripped) return [];
  // A pure "City, ST" location line never yields a name.
  if (/^[A-Z][A-Za-z.\s'-]+,\s*[A-Z]{2}(\s+\d{5})?\s*$/.test(stripped)) return [];
  const segs = stripped.split(/[|·–—,]/).map((s) => s.replace(/^\s*[-•▪‣*·◦\d.)]+\s*/, "").trim()).filter(Boolean);
  if (segs.length <= 1) return looksLikeNamePhrase(stripped) ? [stripped] : [];
  const out: string[] = [];
  for (const s of segs) {
    if (looksLikeNamePhrase(s)) out.push(s);
  }
  return [...new Set(out)];
}

function isTitleLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  if (ROLE_WORDS.has(lower) || [...ROLE_WORDS].some((w) => lower.includes(w))) return true;
  if (/^(senior|lead|head|chief|principal|junior|staff|freelance|independent|self[- ]employed)\b/i.test(t)) return true;
  return false;
}

/** Does this line plausibly read as a professional title? */
function looksLikeTitle(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 70) return false;
  if (isContactLike(t)) return false;
  if (detectSection(t)) return false;
  const tokens = t.split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || tokens.length > 6) return false;
  if (isTitleLine(t)) return true;
  // Generic short Title Case nominal phrase (e.g. "Creative Technologist").
  if (/^[A-Z][a-z]+(?:[ &][A-Z][a-z]+){0,4}$/.test(t)) return true;
  return false;
}

interface NameCandidate {
  line: string;
  index: number;
  isPrefix: boolean;
  positionBonus: number;
}

const NAME_SCORE_FLOOR = 40;

function scoreNameCandidate(
  cand: NameCandidate,
  allLines: string[],
  layoutMap: Map<number, LineLayout | null | undefined>,
): number {
  const { line, index, positionBonus } = cand;
  const tokens = line.split(/\s+/).filter(Boolean);
  const lowerTokens = tokens.map((t) => t.toLowerCase());
  const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line);
  let score = 0;

  // Length — names are short.
  if (line.length <= 2 || line.length > 40) score -= 30;
  else score += 5;

  // Token count — a name is typically 2-4 words.
  if (tokens.length >= 2 && tokens.length <= 4) score += 20;
  else if (tokens.length === 1) score += 6;
  else score -= 20;

  // Word shape — capitalized words read as names; lowercase prose does not.
  let nameLike = 0;
  let lowerCount = 0;
  for (const t of tokens) {
    if (/^[A-Z][a-z]+(?:['’-][A-Za-z]+)?$/.test(t) || /^[A-Z]{2,}$/.test(t) || /^[A-Z]\.$/.test(t)) nameLike++;
    else if (/^[a-z]/.test(t)) lowerCount++;
  }
  if (nameLike === tokens.length) score += 25;
  else if (nameLike >= Math.max(1, tokens.length - 1)) score += 15;
  score -= lowerCount * 8;

  if (isAllCaps) score += 8;

  // Role / structural words — a title or heading is not a name.
  let bad = 0;
  for (const t of lowerTokens) {
    if (ROLE_WORDS.has(t) || STRUCTURAL_WORDS.has(t)) bad++;
  }
  if (bad === tokens.length) score -= 60;
  else if (bad > 0) score -= 15 * bad;

  // Geographic phrases (e.g. "New York") are never names.
  if (lowerTokens.length >= 1 && lowerTokens.every((t) => GEO_WORDS.has(t))) score -= 100;

  // Sentences / dates / things with numbers are not names.
  if (line.endsWith(".") && line.length > 25) score -= 25;
  if (/\d/.test(line)) score -= 20;
  if (tokens.length > 6) score -= 15;

  // Adjacency to contact info strongly suggests the identity header.
  if (isContactLike(allLines[index] ?? "")) score += 20;
  else {
    for (let d = 1; d <= 3; d++) {
      const up = allLines[index - d];
      const down = allLines[index + d];
      if ((up && isContactLike(up)) || (down && isContactLike(down))) {
        score += 20;
        break;
      }
    }
  }

  // Position — closer to the top of the document is mildly better. Uses the
  // vertical rank when layout is available (multi-column resumes may emit the
  // name late in reading order even though it sits near the top).
  score += positionBonus;

  // Isolation — a standalone line is more likely to be the name.
  const prevBlank = index === 0 || !(allLines[index - 1] ?? "").trim();
  const nextBlank = index === allLines.length - 1 || !(allLines[index + 1] ?? "").trim();
  if (prevBlank && nextBlank) score += 8;

  // Visual hierarchy — the largest font in the header is a strong signal.
  const lay = layoutMap.get(index);
  if (lay && lay.fontSize > 0) {
    const sizes = [...layoutMap.values()]
      .filter((l): l is LineLayout => !!l && l.fontSize > 0)
      .map((l) => l.fontSize);
    if (sizes.length >= 2) {
      const maxSize = Math.max(...sizes);
      if (lay.fontSize === maxSize) score += 25;
      const sorted = [...sizes].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
      if (median > 0 && lay.fontSize > median * 1.25) score += 12;
    }
  }

  // A name recovered from the front of a combined "Name | contact" line.
  if (cand.isPrefix) score += 10;

  return score;
}

function findProfessionalTitle(allLines: string[], nameIndex: number): { title: string; index: number } {
  if (nameIndex < 0) return { title: "", index: -1 };
  for (let i = nameIndex + 1; i < Math.min(allLines.length, nameIndex + 6); i++) {
    const raw = (allLines[i] ?? "").trim();
    if (!raw) continue;
    if (isContactLike(raw)) {
      for (const seg of raw.split(/[|·–—,]/).map((s) => s.trim()).filter(Boolean)) {
        // Require 2+ tokens inside a contact line so city names ("Austin")
        // or other single-word fragments are never mistaken for a title.
        if (seg.split(/\s+/).filter(Boolean).length >= 2 && looksLikeTitle(seg)) {
          return { title: seg, index: i };
        }
      }
      continue;
    }
    if (looksLikeTitle(raw)) return { title: raw, index: i };
    break;
  }
  return { title: "", index: -1 };
}

/** Rank candidate lines by vertical position (page, then y) so names at the
 *  physical top of the page win even when emitted late by column extraction. */
function positionBonuses(
  candidateIndices: number[],
  layoutMap: Map<number, LineLayout | null | undefined>,
): Map<number, number> {
  const map = new Map<number, number>();
  const hasLayout = candidateIndices.some((i) => layoutMap.get(i));
  if (!hasLayout) {
    for (const i of candidateIndices) map.set(i, Math.max(0, 12 - i));
    return map;
  }
  const sorted = [...candidateIndices].sort((a, b) => {
    const la = layoutMap.get(a);
    const lb = layoutMap.get(b);
    if (!la && !lb) return a - b;
    if (!la) return 1;
    if (!lb) return -1;
    if (la.page !== lb.page) return la.page - lb.page;
    return la.y - lb.y;
  });
  for (let rank = 0; rank < sorted.length; rank++) {
    map.set(sorted[rank]!, Math.max(0, 14 - rank));
  }
  return map;
}

function extractIdentity(
  allLines: string[],
  candidateIndices: number[],
  layoutMap: Map<number, LineLayout | null | undefined>,
): { name: string; professionalTitle: string; nameIndex: number; titleIndex: number } {
  const bonuses = positionBonuses(candidateIndices, layoutMap);
  const candidates: NameCandidate[] = [];
  for (const i of candidateIndices) {
    const raw = (allLines[i] ?? "").trim();
    if (!raw) continue;
    if (detectSection(raw)) continue;
    const stripped = stripResumeSuffix(raw);
    for (const seg of candidateSegments(raw)) {
      candidates.push({ line: seg, index: i, isPrefix: seg !== stripped, positionBonus: bonuses.get(i) ?? 0 });
    }
  }

  let best: NameCandidate | null = null;
  let bestScore = -Infinity;
  for (const c of candidates) {
    const score = scoreNameCandidate(c, allLines, layoutMap);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  if (!best || bestScore < NAME_SCORE_FLOOR) return { name: "", professionalTitle: "", nameIndex: -1, titleIndex: -1 };

  const nameIndex = best.index;
  let titleRes = findProfessionalTitle(allLines, nameIndex);
  let title = titleRes.title;
  let titleIndex = titleRes.index;

  // The title may live on the same line as the name ("Name | Title").
  if (!title && nameIndex >= 0) {
    for (const seg of (allLines[nameIndex] ?? "").split(/[|·–—,]/).map((s) => s.trim()).filter(Boolean)) {
      if (seg !== best.line && looksLikeTitle(seg)) {
        title = seg;
        titleIndex = nameIndex;
        break;
      }
    }
  }

  return { name: best.line, professionalTitle: title, nameIndex, titleIndex };
}

/** Extract raw text from a resume buffer. */
export async function extractText(buffer: Buffer, mimeType: string): Promise<ExtractedText> {
  if (mimeType === "application/pdf" || mimeType === "application/x-pdf" || buffer.slice(0, 4).toString() === "%PDF") {
    try {
      const extracted = await extractPdfText(buffer);
      if (!extracted.text || extracted.text.trim().length === 0) {
        throw new UnreadableResumeError("PDF appears to be image-only or password-protected — no text could be extracted.", "NO_TEXT");
      }
      return extracted;
    } catch (e) {
      if (e instanceof UnreadableResumeError) throw e;
      throw new UnreadableResumeError("PDF could not be parsed (corrupted, encrypted or unsupported).", "UNPARSEABLE_PDF");
    }
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword" ||
    buffer.slice(0, 2).toString("hex") === "504b" // PK zip magic
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;
      if (!text || text.trim().length === 0) {
        throw new UnreadableResumeError("DOCX appears to be empty or image-only.", "NO_TEXT");
      }
      return { text };
    } catch (e) {
      if (e instanceof UnreadableResumeError) throw e;
      throw new UnreadableResumeError("DOCX could not be parsed (corrupted or encrypted).", "UNPARSEABLE_DOCX");
    }
  }
  throw new UnreadableResumeError("Unsupported file type — upload a PDF or DOCX resume.", "UNSUPPORTED_TYPE");
}

interface SectionBounds {
  id: SectionId;
  start: number;
  end: number;
}

/** Split resume text into logical sections by detecting headers. */
export function splitSections(text: string): Record<string, string> {
  const lines = text.split(/\r?\n/);
  const bounds: SectionBounds[] = [];

  for (let i = 0; i < lines.length; i++) {
    const id = detectSection(lines[i] ?? "");
    if (id) bounds.push({ id, start: i, end: lines.length });
  }

  // Close bounds sequentially.
  for (let i = 0; i < bounds.length; i++) {
    const cur = bounds[i]!;
    const next = bounds[i + 1];
    if (next) bounds[i] = { ...cur, end: next.start };
  }

  const out: Record<string, string> = {};
  for (const b of bounds) {
    out[b.id] = lines.slice(b.start + 1, b.end).filter((l) => l.trim()).join("\n");
  }
  return out;
}

function parseDates(raw: string): { start?: string; end?: string; current?: boolean } {
  if (!raw) return {};
  const current = /present|current|now|ongoing/i.test(raw);
  const months = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec",
  ];
  const matches = raw.match(/((?:[A-Z][a-z]{2,}|[A-Za-z]{3,})[\s.-]*\d{4})/g) ?? [];
  const years = raw.match(/\b(20\d{2}|19\d{2})\b/g) ?? [];
  let start: string | undefined;
  let end: string | undefined;

  if (matches.length >= 2) {
    start = matches[0];
    end = current ? undefined : matches[1];
  } else if (years.length >= 2) {
    start = years[0];
    end = current ? undefined : years[1];
  } else if (years.length === 1) {
    if (current || months.length >= 1) start = years[0];
    else end = years[0];
  }
  return { start, end, current: current || undefined };
}

function splitBullets(block: string): string[] {
  return block
    .split("\n")
    .map((b) => b.replace(/^\s*[-•▪‣*·◦\d.)]+\s*/, "").trim())
    .filter(Boolean);
}

function parseTimeline(block: string): TimelineEntry[] {
  if (!block) return [];
  const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const isBullet = (l: string) => /^[-•▪‣*·◦\d.)]/.test(l);
  const hasYear = (l: string) => /\b(20\d{2}|19\d{2})\b/.test(l);
  const hasSeparator = (l: string) => /[-–—|·]| at /i.test(l);
  const isMeta = (l: string) => hasYear(l) && hasSeparator(l);

  // An entry is [role header] → [meta: company + dates] → bullets.
  // A new entry starts on a non-bullet line when it follows bullets, or when
  // it is a bare role header immediately followed by a dated meta line.
  const entries: string[][] = [];
  let cur: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const prev = lines[i - 1] ?? "";
    const next = lines[i + 1] ?? "";

    if (cur.length > 0) {
      const afterBullets = !isBullet(line) && isBullet(prev);
      const bareHeader = !isBullet(line) && !isMeta(line) && hasYear(next) && !isBullet(prev);
      if (afterBullets || bareHeader) {
        entries.push(cur);
        cur = [];
      }
    }
    cur.push(line);
  }
  if (cur.length > 0) entries.push(cur);

  return entries.slice(0, 20).map((entryLines, idx) => {
    const header = entryLines[0] ?? "";
    const meta = entryLines.find(isMeta) ?? entryLines.find(hasYear) ?? entryLines[1] ?? "";
    const dates = parseDates(meta);

    // Company sits on the meta line before the date, e.g. "Studio Nord — 2021 — Present"
    const dateStripped = meta
      .replace(/[-–—]?\s*(?:\(|\[)?\s*(?:[A-Z][a-z]{2,}|[A-Za-z]{3,})[\s.-]*\d{4}.*$/i, "")
      .trim();
    const company = dateStripped.split(/[-–—|·]\s*|\s+at\s+/i).filter(Boolean)[0] ?? "";
    const locationMatch = (entryLines[1] ?? "").match(/^([A-Z][a-zA-Z\s]+),?\s+[A-Z]{2}/);

    const rest = entryLines.slice(1).filter((l) => l !== meta);
    const bullets = rest.filter(isBullet).map((b) => b.replace(/^[-•▪‣*·◦\d.)]+\s*/, "").trim());
    const description = (bullets.length ? bullets.join(". ") : rest.join(" ")).slice(0, 600);

    return {
      id: uid(),
      role: header,
      company: company || locationMatch?.[1] || "",
      location: locationMatch?.[1],
      start: dates.start,
      end: dates.end,
      current: dates.current,
      description,
      highlights: bullets.slice(0, 5),
      sortOrder: idx,
    };
  });
}

function parseProjects(block: string): ProjectEntry[] {
  if (!block) return [];
  const chunks = block.split(/\n\s*\n/).filter(Boolean);
  return chunks.slice(0, 12).map((chunk, idx) => {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const titleLine = lines[0] ?? "";
    const [title, ...maybeTech] = titleLine.split(/[|•·-]/).map((s) => s.trim());
    const urls = chunk.match(URL_RE) ?? [];
    const url = urls.find((u) => /github\.com|live|demo/i.test(u)) ?? urls[0];
    const bullets = splitBullets(lines.slice(1).join("\n"));
    const techHints = bullets.flatMap((b) => b.match(/\b[A-Z][A-Za-z+#.]{2,}\b/g) ?? []);
    return {
      id: uid(),
      title: title || "Untitled project",
      subtitle: lines[1]?.startsWith("20") || /^\d{4}$/.test(lines[1] ?? "") ? undefined : lines[1],
      description: bullets[0] ?? lines.slice(1, 3).join(" "),
      url,
      techStack: (maybeTech.length ? maybeTech : techHints).slice(0, 8),
      highlights: bullets.slice(1, 4),
      sortOrder: idx,
    };
  });
}

const DEGREE_PATTERN =
  /\b(?:b\.?\s*(?:s|a|sc|tech|eng|com|fa|ba|des|arch)\.?|m\.?\s*(?:s|a|sc|tech|eng|com|fa|ba|des|arch|ph|pa)\.?|m\.?\s*f\.?\s*a\.?|m\.?\s*c\.?\s*a\.?|ph\.?\s*d\.?|edd|dds|dmd|j\.?\s*d\.?|ll\.?\s*b\.?|ll\.?\s*m\.?|bachelor(?:'s)?|master(?:'s)?|masters?|doctor(?:ate)?|diploma|associate(?:'s)?|honou?rs|licentiate|graduate|undergraduate|hnd|hsc|ssc)\b/i;

function parseEducation(block: string): EducationEntry[] {
  if (!block) return [];
  const chunks = block.split(/\n\s*\n/).filter(Boolean);
  return chunks.slice(0, 6).map((chunk, idx) => {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const dates = parseDates(lines.join(" "));

    const degreeLines: string[] = [];
    const institutionLines: string[] = [];
    for (const [i, line] of lines.entries()) {
      if (i > 2) break;
      if (DEGREE_PATTERN.test(line)) degreeLines.push(line);
      else institutionLines.push(line);
    }

    let institution = "";
    let degree = "";
    if (degreeLines.length > 0) {
      degree = degreeLines[0]!.replace(/\s*[-–—|·]\s*(?:\(?[A-Za-z]{3,}[\s.-]*)?\d{4}.*$/i, "").trim();
      institution = institutionLines[0] ?? "";
      if (!institution && degreeLines.length > 1) institution = degreeLines[1]!.replace(/\s*[-–—|·]\s*\d{4}.*$/i, "").trim();
    } else {
      institution = lines[0] ?? "";
      degree = lines[1] ?? "";
    }

    const field =
      lines
        .filter((l, i) => i > 0 && i <= 2 && !DEGREE_PATTERN.test(l) && l !== institution && l !== degree)
        .find((l) => l.length <= 60) ?? lines[2];

    return {
      id: uid(),
      institution,
      degree,
      field,
      start: dates.start,
      end: dates.end,
      description: lines.slice(3).join(" "),
      sortOrder: idx,
    };
  });
}

function parseSkills(block: string): ResumeStructured["skills"] {
  if (!block) return [];
  // Try "Category: item, item" groupings.
  const grouped: ResumeStructured["skills"] = [];
  for (const line of block.split("\n")) {
    const m = line.match(/^([A-Z][A-Za-z &/]+)[:]\s*(.+)$/);
    if (m) {
      const category = m[1] ?? "";
      const items = m[2] ?? "";
      if (category && items) {
        grouped.push({ id: uid(), category: category.trim(), skills: items.split(/[,\/·|]+/).map((s) => s.trim()).filter(Boolean) });
      }
    }
  }
  if (grouped.length > 0) return grouped;
  const flat = splitBullets(block).flatMap((b) => b.split(/[,\/]+/)).map((s) => s.trim()).filter(Boolean);
  return flat.length ? [{ id: uid(), category: "Skills", skills: flat.slice(0, 30) }] : [];
}

function parseAwards(block: string): AwardEntry[] {
  if (!block) return [];
  return splitBullets(block).slice(0, 10).map((line) => {
    const parts = line.split(/[-–—|·]\s*|\b(?:at|from)\s+/i).map((s) => s.trim()).filter(Boolean);
    const year = line.match(/\b(20\d{2}|19\d{2})\b/)?.[0];
    return {
      id: uid(),
      title: parts[0] ?? line,
      issuer: parts[1] && parts[1] !== year ? parts[1] : undefined,
      year,
      description: parts.slice(2).join(" ") || undefined,
    };
  });
}

function parsePublications(block: string): PublicationEntry[] {
  if (!block) return [];
  const chunks = block.split(/\n\s*\n/).filter(Boolean);
  const lines = chunks.length > 1 ? chunks : splitBullets(block);
  return lines.slice(0, 10).map((chunk) => {
    const single = chunk.split("\n")[0] ?? chunk;
    const urls = chunk.match(URL_RE) ?? [];
    const urlSet = new Set(urls);
    const parts = single.split(/[-–—|·]\s*|\b(?:at|from|in)\s+/i).map((s) => s.trim()).filter(Boolean);
    const year = parts.find((p) => /\b(20\d{2}|19\d{2})\b/.test(p))?.match(/\b(20\d{2}|19\d{2})\b/)?.[0];
    const title = (parts[0] ?? single).replace(/\s*\(.*?\)\s*$/, "").trim();
    // Venue: a part that is not the title, a year, or a URL. Also accept
    // the parenthetical "Title (Venue, Year)" style.
    const parenthetical = single.match(/\((.*?)\)/)?.[1];
    let venue: string | undefined;
    if (parenthetical && !urlSet.has(parenthetical)) {
      venue = parenthetical.replace(/\s*,\s*\d{4}\s*$/, "").trim();
    } else {
      const rest = parts.slice(1).filter((p) => !urlSet.has(p) && !/\b(20\d{2}|19\d{2})\b/.test(p));
      venue = rest[0];
    }
    return {
      id: uid(),
      title,
      venue: venue && venue !== year ? venue : undefined,
      year,
      url: urls[0],
      description: chunk.split("\n").slice(1).join(" ").trim() || undefined,
    };
  });
}

function extractSocialLinks(text: string): SocialLink[] {
  const found = new Map<string, string>();
  const urls = text.match(URL_RE) ?? [];
  for (const u of urls) {
    const m = /(linkedin\.com|github\.com|behance\.net|dribbble\.com|twitter\.com|x\.com|medium\.com|dev\.to|stackoverflow\.com|codepen\.io|instagram\.com|youtube\.com|facebook\.com)/i.exec(u);
    if (m) {
      const platform = m[1]!.split(".")[0]!.toLowerCase();
      if (!found.has(platform)) found.set(platform, u.replace(/\.$/, ""));
    }
  }
  return [...found.entries()].map(([platform, url]) => ({ id: uid(), platform, url }));
}

function parseContactBlock(block: string): Pick<ResumeStructured, "email" | "phone" | "location" | "website"> & { urls: string[] } {
  const email = block.match(EMAIL_RE)?.[0];
  const phone = block.match(PHONE_RE)?.[0];
  const urls = block.match(URL_RE) ?? [];
  const website = urls.find((u) => /linkedin|github|behance|dribbble|twitter|medium|dev\.to|stackoverflow/i.test(u) === false);
  const locationMatch =
    block.match(/([A-Z][A-Za-z.\s'-]+),\s*[A-Z]{2}\s+\d{5}(?![\w])/) ??
    block.match(/([A-Z][A-Za-z.\s'-]+),\s*[A-Z]{2}(?![\w])/);
  const location = locationMatch?.[1]?.trim();
  return { email: email ?? "", phone, location, website, urls };
}

/** Align layout metadata to (possibly sanitized) text lines by index. */
function alignLayout(textLines: string[], layout: (LineLayout | null)[]): Map<number, LineLayout | null> {
  const map = new Map<number, LineLayout | null>();
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  if (layout.length >= textLines.length) {
    for (let i = 0; i < textLines.length; i++) map.set(i, layout[i] ?? null);
    return map;
  }
  let li = 0;
  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i] ?? "";
    if (!line.trim()) {
      map.set(i, null);
      continue;
    }
    while (li < layout.length && !layout[li]?.text.trim()) li++;
    if (li >= layout.length) {
      map.set(i, null);
      continue;
    }
    if (norm(layout[li]!.text) === norm(line)) {
      map.set(i, layout[li]!);
      li++;
      continue;
    }
    let found = false;
    for (let k = 1; k <= 3 && li + k < layout.length; k++) {
      if (norm(layout[li + k]?.text ?? "") === norm(line)) {
        map.set(i, layout[li + k]!);
        li = li + k + 1;
        found = true;
        break;
      }
    }
    if (!found) map.set(i, null);
  }
  return map;
}

/** Recover the summary paragraph from the header region (excluding the
 *  name, title and contact lines). */
function recoverSummary(headerLines: string[], excluded: Set<number>): string {
  const parts: string[] = [];
  for (let i = 0; i < headerLines.length; i++) {
    const line = (headerLines[i] ?? "").trim();
    if (!line || excluded.has(i) || isContactLike(line)) continue;
    parts.push(line);
  }
  const long = parts.find((p) => p.length > 60);
  if (long) return long;
  const joined = parts.join(" ");
  return joined.length > 60 ? joined : "";
}

const MAX_HEADER_SCAN = 60;

export function structureResume(
  text: string,
  layout?: (LineLayout | null)[],
): { structured: ResumeStructured; missing: string[]; confidence: number } {
  const lines = text.split(/\r?\n/);
  const layoutMap = alignLayout(lines, layout ?? []);

  // Locate the header region: everything before the first section heading.
  let headerEnd = 0;
  let sawSection = false;
  for (let i = 0; i < Math.min(lines.length, MAX_HEADER_SCAN); i++) {
    if (detectSection(lines[i] ?? "")) {
      headerEnd = i;
      sawSection = true;
      break;
    }
  }
  if (!sawSection) headerEnd = Math.min(lines.length, MAX_HEADER_SCAN);
  const headerRegion = sawSection && headerEnd === 0 ? [] : lines.slice(0, headerEnd);

  // Candidate pool for the name: the header region, plus (for multi-column
  // PDFs) any lines on the same page that sit vertically ABOVE the first
  // section heading — column extraction can emit the name late in reading
  // order even though it physically sits near the top.
  const candidateIndices: number[] = [];
  for (let i = 0; i < headerRegion.length; i++) candidateIndices.push(i);
  if (layoutMap.size > 0 && headerEnd < lines.length) {
    const refLayout = layoutMap.get(headerEnd);
    if (refLayout) {
      for (let i = 0; i < Math.min(lines.length, MAX_HEADER_SCAN); i++) {
        if (candidateIndices.includes(i)) continue;
        const lay = layoutMap.get(i);
        if (lay && lay.page === refLayout.page && lay.y < refLayout.y) candidateIndices.push(i);
      }
    }
  }

  const { name, professionalTitle, nameIndex, titleIndex } = extractIdentity(lines, candidateIndices, layoutMap);
  const sections = splitSections(text);

  const contactLines = headerRegion.filter((l) => isContactLike(l.trim())).join("\n");
  const headerContact = parseContactBlock(contactLines || headerRegion.join("\n"));
  const sectionContact = sections.contact ? parseContactBlock(sections.contact) : null;
  const contact = {
    email: headerContact.email || sectionContact?.email || "",
    phone: headerContact.phone || sectionContact?.phone,
    location: headerContact.location || sectionContact?.location,
    website: headerContact.website || sectionContact?.website,
  };

  const socialLinks = extractSocialLinks(`${headerRegion.join("\n")}\n${sections.contact ?? ""}\n${sections.socialLinks ?? ""}`);

  const certificates = splitBullets(sections.certificates ?? "").slice(0, 10).map((c) => ({
    id: uid(),
    name: c.replace(/\s*[-–—(]\s*(20\d{2}|19\d{2})\s*.*$/, ""),
    issuer: c.match(/[-–—|·]\s*([A-Za-z .&]+)$/)?.[1],
    year: c.match(/\b(20\d{2}|19\d{2})\b/)?.[0],
  }));
  const achievements = splitBullets(sections.achievements ?? "").slice(0, 8);
  const awards = parseAwards(sections.awards ?? "");
  const publications = parsePublications(sections.publications ?? "");
  const languages = splitBullets(sections.languages ?? "").slice(0, 8);
  const volunteer = parseTimeline(sections.volunteer ?? "");

  const experience = parseTimeline(sections.experience ?? "");
  const projects = parseProjects(sections.projects ?? "");
  const skills = parseSkills(sections.skills ?? "");
  const education = parseEducation(sections.education ?? "");

  const summary =
    (sections.summary ?? "").trim() ||
    recoverSummary(headerRegion, new Set([nameIndex, titleIndex]));

  const structured: ResumeStructured = {
    name,
    professionalTitle,
    email: contact.email,
    phone: contact.phone,
    location: contact.location,
    website: contact.website,
    summary: summary.replace(/\s+/g, " ").trim().slice(0, 800),
    experience,
    projects,
    education,
    skills,
    certificates,
    achievements,
    awards,
    publications,
    languages,
    socialLinks,
    volunteer,
  };

  const missing: string[] = [];
  if (!structured.name.trim()) missing.push("Full name");
  if (!structured.email.trim()) missing.push("Email");
  if (structured.experience.length === 0) missing.push("Work experience");
  if (structured.skills.length === 0) missing.push("Skills");
  if (structured.projects.length === 0) missing.push("Projects");
  if (structured.education.length === 0) missing.push("Education");
  if (!structured.summary.trim()) missing.push("Summary");

  const signals = {
    hasName: Boolean(structured.name),
    hasEmail: Boolean(structured.email),
    hasExperience: structured.experience.length > 0,
    hasSections: Object.keys(sections).length > 0,
  };
  const confidence = Math.round(
    ((signals.hasName ? 30 : 0) + (signals.hasEmail ? 20 : 0) + (signals.hasExperience ? 25 : 0) + (signals.hasSections ? 25 : 0)),
  );

  log.info("resume structured", { sections: Object.keys(sections).length, missing: missing.length, confidence });
  return { structured, missing, confidence };
}
