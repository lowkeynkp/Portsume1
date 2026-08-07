import { useState } from "react";
import { motion } from "framer-motion";
import type { Portfolio } from "@portsume/shared";
import { publicPortfolioUrl } from "../../lib/api";
import { EASE } from "../../lib/motion";
import { Flower, Spark, CurvedArrow, Blob, DoodleCircle, Tape } from "../decor";

interface Props {
  portfolio: Portfolio;
  onEdit: () => void;
}

export function PublishedView({ portfolio, onEdit }: Props) {
  const url = portfolio.publishedUrl ?? publicPortfolioUrl(portfolio.slug);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="relative grid min-h-[80vh] place-items-center overflow-hidden px-5 py-12">
      <div className="wash absolute inset-0" aria-hidden="true" />
      <div className="dot-paper absolute inset-0 opacity-50" aria-hidden="true" />
      <Blob className="absolute -left-[6%] top-[10%] h-72 w-72" tone="#B9E4F4" />
      <Blob className="absolute -right-[8%] bottom-[8%] h-80 w-80" tone="#F8CCD6" />
      <DoodleCircle className="absolute right-[16%] top-[14%] h-28 w-28" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative w-full max-w-xl text-center"
      >
        <motion.div
          initial={{ scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-forest border-4 border-cream shadow-lift"
        >
          <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="#FFF8EF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <h1 className="mt-6 display-1 text-[clamp(2.2rem,6vw,3.6rem)]">
          It's <em className="italic text-forest">live.</em>
        </h1>
        <p className="scribble mt-3 text-2xl text-navy/55">go on, look at what you became ✨</p>

        <div className="relative mt-8 rounded-[2rem] border border-navy/10 bg-paper/85 p-6 shadow-lift backdrop-blur-sm">
          <Tape className="-top-3 left-8" />
          <span className="kicker text-coral">your public URL</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block break-all rounded-2xl bg-ivory px-4 py-3 font-display text-lg font-semibold text-forest underline decoration-coral decoration-2 underline-offset-4"
          >
            {url}
          </a>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button onClick={copy} className="btn-primary !py-2.5 !text-xs">
              {copied ? "Copied!" : "Copy link"}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn-ghost !py-2.5 !text-xs">
              Open live site ↗
            </a>
            <button onClick={onEdit} className="btn-paper !py-2.5 !text-xs">
              Keep editing
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs font-bold uppercase tracking-widest text-navy/40">
          <span>✓ SEO metadata</span>
          <span>✓ Open Graph</span>
          <span>✓ Sitemap</span>
          <span>✓ Customizable</span>
        </div>

        <div className="relative mx-auto mt-10 max-w-[240px]">
          <CurvedArrow className="absolute -right-20 -top-6 h-16 w-16" />
          <p className="scribble text-xl text-navy/50">recruiters will know your name now</p>
        </div>
      </motion.div>
    </div>
  );
}
