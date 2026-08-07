import { motion } from "framer-motion";
import { Reveal } from "../Reveal";
import { Flower, Spark, SparkCoral, Blob, ArrowScribble, DoodleCircle, Squiggle, Tape } from "../decor";
import { staggerContainer } from "../../lib/motion";

interface Step {
  n: string;
  title: string;
  body: string;
  color: string;
  meta: string;
}

const STEPS: Step[] = [
  {
    n: "01",
    title: "Drop your resume",
    body: "A PDF or DOCX in, that's it. Files are validated, scanned and stored privately.",
    color: "bg-peach",
    meta: "pdf · docx",
  },
  {
    n: "02",
    title: "AI reads like a designer",
    body: "Every section is recovered — even messy columns, tables and two-page layouts.",
    color: "bg-powder",
    meta: "parser → structured",
  },
  {
    n: "03",
    title: "Copy gets a polish pass",
    body: "Grammar fixed, summaries sharpened, SEO titles written. Never invents facts.",
    color: "bg-lavender",
    meta: "AI copywriting",
  },
  {
    n: "04",
    title: "Portfolio is composed",
    body: "Experience, projects and skills become theme-independent, editable content.",
    color: "bg-butter",
    meta: "structured JSON",
  },
  {
    n: "05",
    title: "Pick a handcrafted theme",
    body: "Six editorial themes. Switch any time — content never changes shape.",
    color: "bg-blush",
    meta: "6 themes",
  },
  {
    n: "06",
    title: "Publish in one click",
    body: "A live URL with SEO, Open Graph and a sitemap. Share it everywhere.",
    color: "bg-sage",
    meta: "live link",
  },
];

function StepCard({ step, i }: { step: Step; i: number }) {
  const tilt = i % 2 === 0 ? -2 : 2;
  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={`relative rounded-[1.75rem] border border-navy/10 p-7 ${step.color} transition-transform duration-300 hover:-translate-y-1.5`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <span className="scribble absolute -top-4 right-5 bg-cream px-3 py-0.5 text-2xl text-navy" style={{ transform: "rotate(3deg)" }}>
        step {step.n}
      </span>
      <span className="font-display text-6xl font-semibold text-navy/90">{step.n}</span>
      <h3 className="mt-4 font-display text-2xl font-semibold leading-tight">{step.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-navy/70">{step.body}</p>
      <span className="mt-5 inline-block rounded-full border border-navy/15 bg-paper/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-navy/60">
        {step.meta}
      </span>
    </motion.article>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="relative overflow-hidden py-24 md:py-32">
      <div className="notebook-lines absolute inset-0 opacity-40" aria-hidden="true" />
      <Flower className="absolute right-[6%] top-16 h-14 w-14 opacity-80 animate-floaty" />
      <DoodleCircle className="absolute left-[2%] top-1/2 hidden h-32 w-32 md:block" />
      <Squiggle className="absolute bottom-16 left-1/2 h-8 w-40 -translate-x-1/2" />

      <div className="relative mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker text-coral">the transformation</span>
          <h2 className="mt-4 display-1 text-[clamp(2.2rem,5vw,3.6rem)]">
            From a plain document
            <br />
            to a <span className="underline-squiggle">living website</span>
          </h2>
          <p className="scribble mt-5 text-2xl text-navy/60">
            six small steps, one big glow-up ✨
          </p>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {STEPS.map((s, i) => (
            <StepCard key={s.n} step={s} i={i} />
          ))}
        </motion.div>

        <Reveal className="mt-16 flex justify-center">
          <div className="relative">
            <ArrowScribble className="absolute -left-24 -top-8 hidden h-16 w-24 md:block" />
            <a href="#themes" className="btn-ghost">
              Explore the themes ↓
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
