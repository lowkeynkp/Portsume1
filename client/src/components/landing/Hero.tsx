import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { EASE } from "../../lib/motion";
import {
  Flower,
  FlowerBlush,
  Spark,
  Blob,
  DoodleCircle,
  ArrowScribble,
  Tape,
  WavyLine,
  Squiggle,
} from "../decor";

function ResumeCard() {
  return (
    <div className="relative rounded-2xl border border-navy/10 bg-paper p-5 shadow-lift" style={{ width: 300, transform: "rotate(-5deg)" }}>
      <Tape className="-top-3 left-8" />
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-coral" />
        <span className="kicker text-navy/50">resume.pdf</span>
        <span className="ml-auto rounded-full bg-sage/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-forest">
          parsed ✓
        </span>
      </div>
      <div className="rounded-xl bg-ivory p-3">
        <div className="h-3 w-24 rounded-full bg-navy/80" />
        <div className="mt-1.5 h-2 w-16 rounded-full bg-coral/70" />
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-navy/15" />
          <div className="h-1.5 w-11/12 rounded-full bg-navy/15" />
          <div className="h-1.5 w-4/5 rounded-full bg-navy/15" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-8 rounded-lg bg-peach/70" />
          <div className="h-8 rounded-lg bg-powder/70" />
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-navy/15" />
        <div className="mt-1.5 h-1.5 w-3/4 rounded-full bg-navy/15" />
      </div>
    </div>
  );
}

function BrowserCard() {
  return (
    <div className="rounded-2xl border border-navy/10 bg-paper shadow-lift" style={{ width: 340, transform: "rotate(2.5deg)" }}>
      <div className="flex items-center gap-1.5 border-b border-navy/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-coral" />
        <span className="h-2.5 w-2.5 rounded-full bg-butter" />
        <span className="h-2.5 w-2.5 rounded-full bg-sage" />
        <span className="ml-3 rounded-full bg-ivory px-3 py-0.5 text-[10px] font-semibold text-navy/60">
          adarivera.portsume.app
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-2.5 w-20 rounded-full bg-navy/80" />
            <div className="mt-1 h-2 w-12 rounded-full bg-coral/80" />
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-powder text-xs font-bold text-navy">
            AR
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-12 flex-1 rounded-xl bg-blush/70" />
          <div className="h-12 flex-1 rounded-xl bg-butter/70" />
          <div className="h-12 flex-1 rounded-xl bg-sage/70" />
        </div>
      </div>
    </div>
  );
}

function AiWindow() {
  return (
    <div className="rounded-2xl border border-navy/10 bg-navy p-4 text-cream shadow-lift" style={{ width: 260, transform: "rotate(4deg)" }}>
      <div className="flex items-center gap-2">
        <Spark className="h-5 w-5" />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-butter">Portsume AI</span>
      </div>
      <div className="mt-3 space-y-2 font-body text-xs text-cream/85">
        <p className="rounded-xl bg-cream/10 px-3 py-2">Enhancing summary…</p>
        <motion.div
          className="rounded-xl bg-cream/10 px-3 py-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          Rewriting: “did stuff” → “Led cross-functional teams to ship…”
        </motion.div>
        <p className="rounded-xl bg-cream/10 px-3 py-2">SEO title generated ✓</p>
      </div>
      <div className="mt-3 flex gap-1.5">
        {[80, 55, 90, 40, 70, 95].map((h, i) => (
          <motion.span
            key={i}
            className="w-2.5 rounded-full bg-sky"
            animate={{ height: [h, h / 2, h] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15 }}
            style={{ height: h }}
          />
        ))}
      </div>
    </div>
  );
}

function SkillCard() {
  return (
    <div className="rounded-2xl border border-navy/10 bg-paper p-4 shadow-soft" style={{ transform: "rotate(-3deg)" }}>
      <span className="kicker text-coral">skills</span>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["Figma", "React", "Motion", "TypeScript", "Strategy"].map((s) => (
          <span key={s} className="rounded-full border border-navy/15 px-2.5 py-1 text-[11px] font-bold text-navy/80">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function PortfolioCard() {
  return (
    <div className="relative rounded-2xl border border-navy/10 bg-butter p-4 shadow-soft" style={{ width: 200, transform: "rotate(6deg)" }}>
      <div className="flex items-center justify-between">
        <span className="kicker text-navy/60">live</span>
        <span className="grid h-6 w-6 place-items-center rounded-full bg-forest text-[10px] text-cream">✓</span>
      </div>
      <div className="mt-3 h-2.5 w-28 rounded-full bg-navy/85" />
      <div className="mt-2 h-2 w-20 rounded-full bg-coral" />
      <div className="mt-3 space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-navy/20" />
        <div className="h-1.5 w-4/5 rounded-full bg-navy/20" />
      </div>
    </div>
  );
}

const collageItems = [
  { node: <ResumeCard />, pos: "left-[2%] top-[4%] z-20", floaty: 0 },
  { node: <AiWindow />, pos: "left-[52%] top-[16%] z-30", floaty: 1 },
  { node: <BrowserCard />, pos: "left-[26%] top-[38%] z-10", floaty: 2 },
  { node: <SkillCard />, pos: "left-[3%] top-[58%] z-20", floaty: 1 },
  { node: <PortfolioCard />, pos: "left-[58%] top-[64%] z-20", floaty: 0 },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 md:pt-40">
      <div className="wash absolute inset-0" aria-hidden="true" />
      <div className="grain absolute inset-0" aria-hidden="true" />
      <div className="dotted-grid absolute inset-0 opacity-40" aria-hidden="true" />

      <Flower className="absolute left-[3%] top-24 h-16 w-16 md:h-20 md:w-20 animate-floaty" />
      <FlowerBlush className="absolute right-[2%] top-40 h-14 w-14 animate-floaty md:h-20 md:w-20" style={{ animationDelay: "1.2s" }} />
      <Spark className="absolute left-[46%] top-16 h-9 w-9" />
      <DoodleCircle className="absolute bottom-10 left-[38%] h-24 w-24 hidden md:block" />
      <Squiggle className="absolute right-[30%] bottom-6 h-8 w-32 hidden md:block" />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-navy/15 bg-paper/70 px-4 py-1.5 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-forest" />
            </span>
            <span className="text-xs font-bold tracking-wide text-navy/80">
              Resume in. Portfolio out. Live in ~60 seconds.
            </span>
          </motion.div>

          <motion.h1
            variants={{ hidden: { opacity: 0, y: 34 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } } }}
            className="display-1 text-[clamp(2.9rem,7vw,5.4rem)]"
          >
            Turn your
            <br />
            <em className="font-medium not-italic">
              <span className="underline-blob px-1 text-forest">resume</span>
            </em>
            <br />
            into a portfolio
            <br />
            <span className="text-coral italic" style={{ fontStyle: "italic" }}>
              people remember.
            </span>
          </motion.h1>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
            className="mt-7 max-w-md text-base leading-relaxed text-navy/70 md:text-lg"
          >
            Portsume reads your resume like a designer, polishes the story with AI, and
            publishes a handcrafted portfolio — themed, editable, and yours to keep.
          </motion.p>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link to="/app" className="btn-primary">
              Make my portfolio
              <span aria-hidden="true">↗</span>
            </Link>
            <Link to="#how" className="btn-ghost">
              See how it works
            </Link>
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.8, delay: 0.4 } } }}
            className="mt-10 flex items-center gap-4"
          >
            <div className="flex -space-x-3">
              {["bg-peach", "bg-powder", "bg-lavender", "bg-sage"].map((c, i) => (
                <span key={i} className={`grid h-9 w-9 place-items-center rounded-full border-2 border-cream text-[11px] font-bold text-navy ${c}`}>
                  {"ARSJ"[i]}
                </span>
              ))}
            </div>
            <p className="text-sm text-navy/60">
              <span className="font-bold text-navy">40,000+</span> creatives already published
            </p>
          </motion.div>
        </motion.div>

        {/* ── The collage ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: EASE, delay: 0.2 }}
          className="relative mx-auto h-[430px] w-full max-w-[520px] md:h-[500px]"
          aria-hidden="true"
        >
          <Blob className="absolute left-[8%] top-[12%] h-72 w-72" tone="#B9E4F4" />
          <Blob className="absolute bottom-[4%] right-[2%] h-64 w-64" tone="#F8CCD6" />

          {collageItems.map((item, i) => (
            <motion.div
              key={i}
              className={`absolute ${item.pos}`}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
            >
              {item.node}
            </motion.div>
          ))}

          <div className="absolute -left-4 top-[30%] hidden md:block">
            <ArrowScribble className="h-16 w-28" />
          </div>
          <WavyLine className="absolute bottom-0 left-[30%] h-4 w-40" />
        </motion.div>
      </div>
    </section>
  );
}
