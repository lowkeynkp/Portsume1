import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { getToken } from "../../lib/api";

export function Logo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} aria-label="Portsume home">
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-butter border border-navy/10" style={{ transform: "rotate(-4deg)" }}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M4 16.5 Q 9 4, 20 16.5" stroke="#24305E" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path d="M9 12.5 q 1.5 2.5 3 0 q 1.5-2.5 3 0" stroke="#24305E" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold tracking-tight" style={{ fontOpticalSizing: "auto" }}>
        Portsume
      </span>
    </Link>
  );
}

const LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Themes", href: "#themes" },
  { label: "Stories", href: "#stories" },
  { label: "Pricing", href: "#pricing" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const authed = Boolean(getToken());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "px-3 pt-3" : "px-0 pt-0"
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 transition-all duration-300 ${
          scrolled ? "rounded-full border border-navy/10 bg-cream/85 shadow-soft backdrop-blur-md" : ""
        }`}
      >
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="kicker text-navy/70 transition-colors hover:text-navy"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {authed ? (
            <Link to="/app" className="btn-primary !px-5 !py-2.5 !text-xs">
              Open studio →
            </Link>
          ) : (
            <>
              <Link to="/app" className="kicker px-3 py-2 text-navy/70 hover:text-navy">
                Sign in
              </Link>
              <Link to="/app" className="btn-primary !px-5 !py-2.5 !text-xs">
                Start free
              </Link>
            </>
          )}
        </div>

        <button
          className="btn-paper !p-2.5 md:hidden"
          aria-expanded={open}
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}
          </svg>
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3 mt-2 rounded-3xl border border-navy/10 bg-cream p-5 shadow-lift md:hidden"
        >
          <div className="flex flex-col gap-4">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="font-display text-2xl font-medium">
                {l.label}
              </a>
            ))}
            <Link to="/app" onClick={() => setOpen(false)} className="btn-primary mt-2 w-full">
              {authed ? "Open studio" : "Start free"}
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
