import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "../Reveal";
import { Flower, SparkCoral, Blob, Tape } from "../decor";
import { EASE } from "../../lib/motion";

interface Theme {
  slug: string;
  name: string;
  blurb: string;
  bg: string;
  ink: string;
  accent: string;
  card: string;
  font: string;
  mono?: boolean;
}

const THEMES: Theme[] = [
  {
    slug: "editorial",
    name: "Editorial",
    blurb: "Magazine-grade serif type, numbered sections and a confident editorial grid on warm paper.",
    bg: "#FBF6EE",
    ink: "#1C1B19",
    accent: "#D9503F",
    card: "#F3ECDF",
    font: "Fraunces, serif",
  },
  {
    slug: "developer",
    name: "Developer",
    blurb: "A dark, terminal-inspired canvas with monospace headers, status dots and project-first timeline.",
    bg: "#0D1117",
    ink: "#E6EDF3",
    accent: "#58A6FF",
    card: "#161B22",
    font: "ui-monospace, SFMono-Regular, monospace",
    mono: true,
  },
  {
    slug: "professional",
    name: "Professional",
    blurb: "Clean and elegant — a refined single-column layout with serif display type and calm teal accents.",
    bg: "#FFFFFF",
    ink: "#1C2B4B",
    accent: "#4A7E8E",
    card: "#FAFAF7",
    font: "'Source Serif 4', serif",
  },
  {
    slug: "creative",
    name: "Creative",
    blurb: "Bold gradients, tilted cards, hand-drawn accents and vibrant brand color for big personalities.",
    bg: "#FDF3EC",
    ink: "#241F2E",
    accent: "#FF5C8A",
    card: "#FFFFFF",
    font: "'Space Grotesk', sans-serif",
  },
];

function ThemePreview({ theme }: { theme: Theme }) {
  return (
    <div
      className="relative overflow-hidden rounded-[1.5rem] border border-navy/10 shadow-lift"
      style={{ background: theme.bg }}
    >
      <Tape className="-top-2 left-10" variant="blue" />
      <div className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.accent }}>
            portfolio
          </span>
          <span
            className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold"
            style={{ background: theme.accent, color: theme.bg }}
          >
            AR
          </span>
        </div>
        <div className="mt-4" style={{ fontFamily: theme.font }}>
          <div className="h-2 w-24 rounded-full" style={{ background: theme.ink, opacity: 0.9 }} />
          <div className="mt-2 h-2 w-16 rounded-full" style={{ background: theme.accent }} />
          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 w-full rounded-full" style={{ background: theme.ink, opacity: 0.18 }} />
            <div className="h-1.5 w-4/5 rounded-full" style={{ background: theme.ink, opacity: 0.18 }} />
            <div className="h-1.5 w-3/5 rounded-full" style={{ background: theme.ink, opacity: 0.18 }} />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl p-2.5" style={{ background: theme.card, border: `1px solid ${theme.ink}14` }}>
              <div className="h-6 rounded-lg" style={{ background: theme.accent, opacity: 0.7 - i * 0.15 }} />
              <div className="mt-2 h-1.5 w-4/5 rounded-full" style={{ background: theme.ink, opacity: 0.2 }} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["Figma", "Motion", "React"].map((s) => (
            <span
              key={s}
              className="rounded-full border px-2 py-0.5 text-[9px] font-bold"
              style={{ borderColor: `${theme.ink}25`, color: theme.ink, opacity: 0.8 }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Themes() {
  const [active, setActive] = useState(0);
  const theme = THEMES[active]!;

  const variants = useMemo(
    () => ({
      initial: { opacity: 0, y: 16, rotate: 0 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
      exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
    }),
    [],
  );

  return (
    <section id="themes" className="relative overflow-hidden py-24 md:py-32">
      <div className="dot-paper absolute inset-0" aria-hidden="true" />
      <div className="wash-alt absolute inset-0 opacity-70" aria-hidden="true" />
      <Flower className="absolute left-[4%] bottom-24 h-16 w-16 animate-floaty" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
        <div>
          <Reveal>
            <span className="kicker text-forest">the theme shelf</span>
            <h2 className="mt-4 display-1 text-[clamp(2.2rem,5vw,3.5rem)]">
              Four handcrafted looks.
              <br />
              <span className="italic text-coral">One</span> content.
            </h2>
            <p className="mt-6 max-w-md text-navy/70 leading-relaxed">
              Content is never tied to a template. Switch from Editorial to Developer to Creative —
              your words, projects and images stay exactly where they were.
            </p>
          </Reveal>

          <Reveal className="mt-8 flex flex-wrap gap-2.5" delay={0.15}>
            {THEMES.map((t, i) => (
              <button
                key={t.slug}
                onClick={() => setActive(i)}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition-all duration-300 ${
                  i === active
                    ? "-translate-y-0.5 border-navy bg-navy text-cream shadow-soft"
                    : "border-navy/20 bg-paper/70 text-navy/70 hover:-translate-y-0.5 hover:border-navy/40"
                }`}
                aria-pressed={i === active}
              >
                {t.name}
              </button>
            ))}
          </Reveal>

          <Reveal delay={0.2} className="mt-6">
            <p className="scribble text-2xl text-navy/60" key={theme.slug}>
              “{theme.blurb}”
            </p>
          </Reveal>
        </div>

        <div className="relative" aria-hidden="true">
          <Blob className="absolute -right-6 -top-10 h-56 w-56" tone="#D7C7F4" />
          <Blob className="absolute -bottom-8 -left-8 h-48 w-48" tone="#FFD6C2" />
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div key={theme.slug} {...variants} initial="initial" animate="animate" exit="exit">
                <ThemePreview theme={theme} />
              </motion.div>
            </AnimatePresence>
            <div className="absolute -bottom-5 -right-3">
              <SparkCoral className="h-10 w-10 animate-wiggle" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
