import { Link } from "react-router-dom";
import { Reveal } from "../Reveal";
import { Flower, Spark, ArrowScribble } from "../decor";
import { Logo } from "./Nav";

const COLUMN = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Themes", href: "#themes" },
      { label: "Stories", href: "#stories" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Studio",
    links: [
      { label: "Make a portfolio", href: "/app" },
      { label: "Live demo", href: "/app" },
      { label: "Changelog", href: "#" },
      { label: "Roadmap", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Journal", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "mailto:hello@portsume.app" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-navy text-cream">
      <div className="grain absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5 py-20">
        <Reveal className="relative rounded-[2rem] border border-cream/15 bg-cream/10 p-8 text-center md:p-14">
          <Flower className="absolute left-6 top-6 h-12 w-12" />
          <Spark className="absolute right-8 top-8 h-10 w-10" />
          <span className="kicker text-butter">ready when you are</span>
          <h2 className="mx-auto mt-4 max-w-2xl display-1 text-[clamp(2.2rem,5.5vw,4rem)]">
            Your resume has been waiting its whole life for this.
          </h2>
          <Link to="/app" className="btn-primary mt-8 !bg-butter !text-navy hover:!bg-peach">
            Build my portfolio — free
          </Link>
          <p className="scribble mt-5 text-2xl text-cream/70">
            no credit card, just a resume and 60 seconds
          </p>
          <ArrowScribble className="absolute -bottom-6 right-10 hidden h-16 w-24 md:block" style={{ opacity: 0.5 }} />
        </Reveal>

        <div className="mt-20 grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo className="text-cream" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">
              The intelligent content engine that turns a single resume into a
              stunning, editable, published portfolio.
            </p>
            <div className="mt-5 flex gap-3">
              {["𝕏", "in", "dr"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-full border border-cream/25 text-sm font-bold transition-colors hover:bg-cream hover:text-navy"
                  aria-label="Social link"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
          {COLUMN.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h3 className="kicker text-butter">{c.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-cream/70 transition-colors hover:text-cream">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-6 text-xs text-cream/40 md:flex-row">
          <span>© {new Date().getFullYear()} Portsume — made with pastels on a Sunday.</span>
          <span>Privacy · Terms · Cookies</span>
        </div>
      </div>
    </footer>
  );
}
