import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PipelineJob } from "@portsume/shared";
import { api } from "../../lib/api";
import { Spark, Flower } from "../decor";
import { EASE } from "../../lib/motion";

const STAGE_LABELS: Record<string, string> = {
  validating: "Validating document",
  storing: "Storing securely",
  parsing: "Extracting text",
  normalizing: "Recovering sections",
  enhancing: "AI polish & SEO",
  generating: "Composing portfolio",
  publishing: "Going live",
  completed: "Done!",
};

const STAGE_COLORS = ["bg-peach", "bg-powder", "bg-butter", "bg-lavender", "bg-blush", "bg-sage", "bg-powder", "bg-butter"];

interface Props {
  jobId: string;
  onDone: (portfolioId: string) => void;
}

export function PipelineView({ jobId, onDone }: Props) {
  const [job, setJob] = useState<PipelineJob | null>(null);
  const [error, setError] = useState("");
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await api.uploads.job(jobId);
        if (cancelled) return;
        setJob(res.data.job);
        if (res.data.job.status === "completed" && !doneRef.current) {
          doneRef.current = true;
          const list = await api.portfolios.list();
          // The freshly-generated portfolio was created after this job started;
          // prefer it over any older portfolio that may have been edited more recently.
          const started = res.data.job.createdAt;
          const candidates = list.data.portfolios.filter((p) => p.createdAt >= started);
          const newest = candidates.length
            ? candidates.reduce((a, b) => (a.createdAt > b.createdAt ? a : b))
            : list.data.portfolios[0];
          if (newest) onDone(newest.id);
        } else if (res.data.job.status === "failed") {
          setError(res.data.job.error ?? "Something went wrong during processing");
        } else {
          timer = setTimeout(poll, 900);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Lost connection to the pipeline");
        }
      }
    }
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId, onDone]);

  const stages = job?.stages ?? [];
  const progress = job?.progress ?? 0;

  return (
    <div className="relative min-h-[80vh] px-5 py-10">
      <div className="dot-paper absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-2xl">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-butter border border-navy/10 shadow-sticker"
            style={{ transform: "rotate(-4deg)" }}
          >
            <motion.svg
              viewBox="0 0 24 24"
              className="h-8 w-8"
              fill="none"
              stroke="#24305E"
              strokeWidth="2.4"
              strokeLinecap="round"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <path d="M12 3a9 9 0 1 0 9 9" />
            </motion.svg>
          </motion.div>
          <h1 className="mt-6 display-1 text-[clamp(1.9rem,4.5vw,2.8rem)]">
            {job?.status === "completed" ? "Your portfolio is alive!" : "Working the magic…"}
          </h1>
          <p className="scribble mt-2 text-2xl text-navy/50">
            {job?.status === "completed" ? "that was fast ✨" : "one resume, seven little steps"}
          </p>
        </div>

        {/* progress bar */}
        <div className="mt-10 rounded-[2rem] border border-navy/10 bg-paper/80 p-6 shadow-soft backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="kicker text-coral">transformation pipeline</span>
            <span className="font-display text-2xl font-semibold">{progress}%</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-navy/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-coral via-butter to-forest"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: EASE }}
            />
          </div>

          <ol className="mt-6 space-y-1">
            {stages.map((s, i) => {
              const done = s.status === "done";
              const running = s.status === "running";
              return (
                <motion.li
                  key={s.stage}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4, ease: EASE }}
                  className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                >
                  <span
                    className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                      done
                        ? "bg-forest text-cream"
                        : running
                          ? "bg-butter text-navy"
                          : "border border-navy/20 text-navy/40"
                    }`}
                  >
                    {done ? "✓" : running ? <span className="h-2 w-2 animate-ping rounded-full bg-navy" /> : i + 1}
                  </span>
                  <span className="flex-1">
                    <span className={`block text-sm font-bold ${done ? "text-forest" : running ? "text-navy" : "text-navy/40"}`}>
                      {STAGE_LABELS[s.stage] ?? s.stage}
                    </span>
                    <AnimatePresence>
                      {s.detail && (
                        <motion.span
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="block text-xs text-navy/50"
                        >
                          {s.detail}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  {running && (
                    <motion.span
                      className="h-2 w-2 rounded-full bg-coral"
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.li>
              );
            })}
          </ol>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-coral/30 bg-coral/10 p-5">
            <p className="font-display text-lg font-semibold text-coral">The pipeline hit a snag</p>
            <p className="mt-1 text-sm text-navy/70">{error}</p>
            <button
              onClick={() => {
                window.location.hash = "#upload";
                window.location.reload();
              }}
              className="btn-ghost mt-4 !py-2 !text-xs"
            >
              Try another file
            </button>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-3 opacity-60">
          <Flower className="h-8 w-8" />
          <Spark className="h-6 w-6" />
          <Flower className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
