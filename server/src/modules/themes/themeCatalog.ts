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
  {
    id: "t-studio",
    slug: "studio",
    name: "Studio",
    blurb: "A gallery-style canvas with oversized display type, a scrolling skills marquee and asymmetric editorial project rows. Built for illustrators, animators, photographers and filmmakers.",
    previewColors: ["#FAF7F2", "#FF4D2E", "#1E2A5A"],
    version: 1,
  },
  {
    id: "t-executive",
    slug: "executive",
    name: "Executive",
    blurb: "A recruiter-ready CV layout with a dedicated sidebar rail, stat summary and structured sections. Ideal for engineers, managers and business professionals.",
    previewColors: ["#FFFFFF", "#0F5E7E", "#16233B"],
    version: 1,
  },
  {
    id: "t-magazine",
    slug: "magazine",
    name: "Magazine",
    blurb: "A magazine-inspired spread with a masthead, lead story, masonry stories and issue-style numbering. Premium art direction for image-led portfolios.",
    previewColors: ["#FAF6EF", "#B3210E", "#16130E"],
    version: 1,
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
