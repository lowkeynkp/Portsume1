import type { ThemeId } from "@portsume/shared";

export interface TemplateMeta {
  id: ThemeId;
  name: string;
  tagline: string;
  blurb: string;
  bg: string;
  ink: string;
  accent: string;
  font: string;
}

/** Mirrors the four production templates in server/src/services/renderer/templates. */
export const TEMPLATES: TemplateMeta[] = [
  {
    id: "editorial",
    name: "Editorial",
    tagline: "Magazine-grade",
    blurb: "Warm paper tones, serif display type, numbered sections and pull-quote energy. Built for designers, writers and creative leads.",
    bg: "#FBF6EE",
    ink: "#1C1B19",
    accent: "#D9503F",
    font: "Fraunces, Georgia, serif",
  },
  {
    id: "developer",
    name: "Developer",
    tagline: "Terminal vibe",
    blurb: "A dark, terminal-inspired canvas with monospace headers, status dots and a project-first timeline. Built for engineers and builders.",
    bg: "#0D1117",
    ink: "#E6EDF3",
    accent: "#58A6FF",
    font: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "Clean & classic",
    blurb: "A refined single-column layout with a serif display, calm teal accents and generous whitespace. Ideal for business and academia.",
    bg: "#FFFFFF",
    ink: "#1C2B4B",
    accent: "#4A7E8E",
    font: "'Source Serif 4', Georgia, serif",
  },
  {
    id: "creative",
    name: "Creative",
    tagline: "Bold & playful",
    blurb: "Gradient blobs, hand-drawn accents, tilted cards and vibrant brand color. A portfolio that lets creators show personality.",
    bg: "#FDF3EC",
    ink: "#241F2E",
    accent: "#FF5C8A",
    font: "'Space Grotesk', system-ui, sans-serif",
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "Gallery style",
    blurb: "Oversized display type, a scrolling skills marquee and asymmetric editorial project rows. Built for illustrators, animators and filmmakers.",
    bg: "#FAF7F2",
    ink: "#15110C",
    accent: "#FF4D2E",
    font: "'Unbounded', system-ui, sans-serif",
  },
  {
    id: "executive",
    name: "Executive",
    tagline: "Recruiter-ready",
    blurb: "A clean two-column CV layout with a sidebar rail, stat summary and structured sections. Ideal for engineers and business professionals.",
    bg: "#FFFFFF",
    ink: "#16233B",
    accent: "#0F5E7E",
    font: "'Lora', Georgia, serif",
  },
  {
    id: "magazine",
    name: "Magazine",
    tagline: "Cover story",
    blurb: "A magazine-inspired spread with a masthead, lead story and issue-style numbering. Premium art direction for image-led portfolios.",
    bg: "#FAF6EF",
    ink: "#16130E",
    accent: "#B3210E",
    font: "'Anton', system-ui, sans-serif",
  },
];

export function templateFor(id: ThemeId): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;
}
