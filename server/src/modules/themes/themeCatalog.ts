import type { Theme, ThemeId } from "@portsume/shared";

export const THEMES: Theme[] = [
  {
    id: "t-editorial",
    slug: "editorial",
    name: "Editorial",
    blurb: "Magazine-grade serif typography, oversized pull quotes, numbered sections and a confident editorial grid. Built for designers, writers and creative leads.",
    previewColors: ["#FFF8EF", "#24305E", "#F68D7A"],
    version: 2,
  },
  {
    id: "t-developer",
    slug: "developer",
    name: "Developer",
    blurb: "A dark, terminal-inspired canvas with monospace accents, syntax-tinted highlights and a project-first timeline. Built for engineers and builders.",
    previewColors: ["#0F1512", "#8ED8F8", "#BFD8B8"],
    version: 2,
  },
  {
    id: "t-professional",
    slug: "professional",
    name: "Professional",
    blurb: "Clean, minimal and elegant — a refined single-column layout with generous whitespace. Ideal for engineers, researchers and business professionals.",
    previewColors: ["#FFFFFF", "#1C2B4B", "#4A7E8E"],
    version: 2,
  },
  {
    id: "t-creative",
    slug: "creative",
    name: "Creative",
    blurb: "Bold gradients, playful cards, big imagery and lively motion. A vibrant portfolio that lets creators show off personality.",
    previewColors: ["#FDF3EC", "#FF5C8A", "#6C5CE7"],
    version: 2,
  },
] as const;

export const DEFAULT_THEME: ThemeId = "editorial";

export const ACCENT_PALETTE = [
  "#F68D7A",
  "#157A43",
  "#24305E",
  "#8ED8F8",
  "#FFE37A",
  "#D7C7F4",
  "#FF5C8A",
  "#6C5CE7",
] as const;
