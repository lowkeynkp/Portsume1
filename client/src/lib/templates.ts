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
];

export function templateFor(id: ThemeId): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;
}
