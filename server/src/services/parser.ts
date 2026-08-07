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

   pdf.js hands us raw text runs with (x, y) coordinates. Instead of
   trusting reading order (which destroys two/three-column resumes) we
   reconstruct lines, detect column splits from x-gaps, and emit each
   column in reading order — left column first, then right.
   ──────────────────────────────────────────────────────────── */

interface TextRun {
  x: number;
  y: number;
  width: number;
  text: string;
}

function collectRuns(items: unknown[], out: TextRun[] = []): TextRun[] {
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const item = it as { str?: unknown; transform?: unknown; width?: unknown; items?: unknown };
    if (typeof item.str === "string" && item.str.length > 0) {
      const t = Array.isArray(item.transform) ? (item.transform as number[]) : [1, 0, 0, 1, 0, 0];
      out.push({
        x: t[4] ?? 0,
        y: t[5] ?? 0,
        width: typeof item.width === "number" ? item.width : item.str.length * 4,
        text: item.str,
      });
    }
    if (Array.isArray(item.items)) collectRuns(item.items, out);
  }
  return out;
}

const LINE_BUCKET = 3; // vertical tolerance (pdf units) to treat runs as one line

function layoutPage(runs: TextRun[]): string {
  if (runs.length === 0) return "";
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

  // Group runs into visual lines by vertical position.
  const lines = new Map<number, TextRun[]>();
  for (const r of runs) {
    const key = Math.round(r.y / LINE_BUCKET);
    const arr = lines.get(key) ?? [];
    arr.push(r);
    lines.set(key, arr);
  }

  interface Segment {
    x: number;
    xEnd: number;
    text: string;
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
        } else {
          segments.push({ x: r.x, xEnd: r.x + r.width, text: r.text });
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
    return row.map((l) => l.segments.map((s) => s.text).join("")).filter(Boolean).join("\n");
  }

  // Multi-column: assign every segment to the nearest column, then emit
  // each column top-to-bottom, columns separated by a blank line.
  const centroids = clusters.map((c) => c.reduce((a, b) => a + b, 0) / c.length);
  const cols: Array<TextRun & { lineY: number }>[] = centroids.map(() => []);
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
      cols[best]!.push({ x: seg.x, y: l.y, width: seg.xEnd - seg.x, text: seg.text, lineY: l.y });
    }
  }

  const blocks = cols.map((col) => {
    const byLine = new Map<number, string[]>();
    for (const r of [...col].sort((a, b) => byTop(a.lineY, b.lineY) || a.x - b.x)) {
      const k = Math.round(r.lineY / LINE_BUCKET);
      const arr = byLine.get(k) ?? [];
      arr.push(r.text);
      byLine.set(k, arr);
    }
    return [...byLine.entries()]
      .sort((a, b) => byTop(a[0], b[0]))
      .map(([, arr]) => arr.join(""))
      .join("\n");
  });
  return blocks.filter(Boolean).join("\n\n");
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const loadingTask = getDocument({
    data,
    useWorkerFetch: false,
    standardFontDataUrl: join(pdfjsRoot, "standard_fonts/") + "/",
  });
  const doc = await loadingTask.promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const runs = collectRuns(content.items);
      pages.push(layoutPage(runs));
    }
    return pages.join("\n\n");
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
  { id: "summary", re: /^(professional\s*)?(summary|profile|objective|about\s*me?|overview)$/i },
  { id: "experience", re: /^(work|professional|employment|relevant|career)?\s*(experience|history|background)?$/i },
  { id: "projects", re: /^(selected|personal|featured)?\s*(projects?|project\s*work|open\s*source)$/i },
  { id: "education", re: /^(education|academic\s*background|academic\s*history|training)$/i },
  { id: "skills", re: /^(skills|technical\s*skills|core\s*competencies|competencies|technologies|tech\s*stack|toolkit)$/i },
  { id: "certificates", re: /^(certifications?|certificates?|licenses?|credentials?)$/i },
  { id: "awards", re: /^(awards?|honors?|recognitions?|accomplishments|prizes?|distinctions)$/i },
  { id: "achievements", re: /^(achievements?|key\s*achievements|highlights)$/i },
  { id: "publications", re: /^(publications?|papers?|research|presentations?|writings?|talks?)$/i },
  { id: "languages", re: /^languages?$/i },
  { id: "volunteer", re: /^(volunteer(ing)?|community|leadership|nonprofit)$/i },
  { id: "socialLinks", re: /^(social\s*(links|profiles)?|links|find\s*me|connect|profiles?)$/i },
  { id: "contact", re: /^(contact|details|personal\s*(details|info)|get\s*in\s*touch)$/i },
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

/** Extract raw text from a resume buffer. */
export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf" || mimeType === "application/x-pdf" || buffer.slice(0, 4).toString() === "%PDF") {
    try {
      const text = await extractPdfText(buffer);
      if (!text || text.trim().length === 0) {
        throw new UnreadableResumeError("PDF appears to be image-only or password-protected — no text could be extracted.", "NO_TEXT");
      }
      return text;
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
      return text;
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

function parseEducation(block: string): EducationEntry[] {
  if (!block) return [];
  const chunks = block.split(/\n\s*\n/).filter(Boolean);
  return chunks.slice(0, 6).map((chunk, idx) => {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const dates = parseDates(lines.join(" "));
    return {
      id: uid(),
      institution: lines[0] ?? "",
      degree: lines[1] ?? "",
      field: lines[2],
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

function parseNameAndTitle(headerBlock: string): { name: string; professionalTitle: string } {
  const lines = headerBlock.split("\n").map((l) => l.trim()).filter(Boolean);
  const name = lines[0] ?? "";
  const title = lines[1] ?? "";
  return { name, professionalTitle: title.length > 70 ? "" : title };
}

/** Recover the summary paragraph between the contact header and the first section. */
function recoverSummary(headerBlock: string): string {
  const para = headerBlock
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !CONTACT_LINE_RE.test(l) && l.length > 0);
  const long = para.find((l) => l.length > 60);
  if (long) return long;
  return para.slice(2).join(" ");
}

export function structureResume(text: string): { structured: ResumeStructured; missing: string[]; confidence: number } {
  const lines = text.split(/\r?\n/);
  let headerEnd = 0;
  for (let i = 0; i < Math.min(lines.length, 50); i++) {
    if (detectSection(lines[i] ?? "")) {
      headerEnd = i;
      break;
    }
  }
  const headerBlock = lines.slice(0, headerEnd || Math.min(lines.length, 8)).join("\n");
  const sections = splitSections(text);

  const headerContact = parseContactBlock(headerBlock);
  const sectionContact = sections.contact ? parseContactBlock(sections.contact) : null;
  const contact = {
    email: headerContact.email || sectionContact?.email || "",
    phone: headerContact.phone || sectionContact?.phone,
    location: headerContact.location || sectionContact?.location,
    website: headerContact.website || sectionContact?.website,
  };

  const { name, professionalTitle } = parseNameAndTitle(headerBlock);
  const socialLinks = extractSocialLinks(`${headerBlock}\n${sections.contact ?? ""}\n${sections.socialLinks ?? ""}`);

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
    recoverSummary(headerBlock) ||
    lines.slice(headerEnd).join(" ").slice(0, 320);

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
