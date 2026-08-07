import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "../Reveal";
import { Squiggle } from "../decor";
import { EASE } from "../../lib/motion";

const FAQS = [
  {
    q: "Is my resume data safe?",
    a: "Resumes are stored in private, permission-scoped storage. We only ever read them to build your portfolio, and you can delete everything with one tap. Your words are yours — the AI only polishes what's already on the page and never invents facts.",
  },
  {
    q: "What file formats can I upload?",
    a: "PDF and DOCX today. TXT and Markdown are on the roadmap. Uploads are validated for size, type, corruption and password protection before anything is processed.",
  },
  {
    q: "What if my resume is messy — columns, tables, two pages?",
    a: "That's exactly the case the parser was built for. It recovers broken sections, merges fragmented paragraphs and normalizes inconsistent formatting so the AI can work with clean, structured content.",
  },
  {
    q: "Can I switch themes after publishing?",
    a: "Any time, instantly. Content and themes are fully separated in our data model, so changing your look never disturbs your projects, text or SEO.",
  },
  {
    q: "Do I need to be a developer?",
    a: "Not at all. If you can email a file, you can ship a portfolio. Every result is still editable — copy, projects, sections — through a clean, visual editor.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes, on the Studio plan. You also get a custom portsume.app subdomain on every plan, with SEO metadata, Open Graph cards and a sitemap generated automatically.",
  },
];

function FaqItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(i === 0);
  return (
    <div className="border-b border-navy/10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="flex items-baseline gap-3">
          <span className="kicker text-coral">{String(i + 1).padStart(2, "0")}</span>
          <span className="font-display text-lg font-semibold md:text-xl">{q}</span>
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-navy/20 text-lg"
          aria-hidden="true"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-6 pl-9 pr-8 text-sm leading-relaxed text-navy/70">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  return (
    <section className="relative py-24 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <span className="kicker text-forest">still curious?</span>
          <h2 className="mt-4 display-1 text-[clamp(2.1rem,4.5vw,3.2rem)]">
            Questions,
            <br />
            <span className="italic text-coral">answered.</span>
          </h2>
          <Squiggle className="mt-5 h-8 w-40" />
          <p className="mt-6 max-w-sm text-navy/60 leading-relaxed">
            Anything else? Write to us at{" "}
            <a href="mailto:hello@portsume.app" className="font-bold text-forest underline decoration-coral decoration-2 underline-offset-4">
              hello@portsume.app
            </a>{" "}
            — a human reads every note.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-[2rem] border border-navy/10 bg-paper/60 px-6 py-4 shadow-soft">
            {FAQS.map((f, i) => (
              <FaqItem key={f.q} q={f.q} a={f.a} i={i} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
