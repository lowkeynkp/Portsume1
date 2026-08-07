import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Portfolio, ThemeId } from "@portsume/shared";
import { api } from "../../lib/api";
import { EASE } from "../../lib/motion";
import { TEMPLATES } from "../../lib/templates";

interface Props {
  portfolio: Portfolio;
  onSelect: (portfolio: Portfolio) => void;
}

const PREVIEW_WIDTH = 560;
const PREVIEW_SCALE = 0.42;

export function TemplateSelectView({ portfolio, onSelect }: Props) {
  const [html, setHtml] = useState<Partial<Record<ThemeId, string>>>({});
  const [selected, setSelected] = useState<ThemeId>(portfolio.themeId);
  const [busy, setBusy] = useState<ThemeId | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      TEMPLATES.map(async (t) => {
        try {
          const h = await api.portfolios.preview(portfolio.id, t.id);
          if (!cancelled) setHtml((prev) => ({ ...prev, [t.id]: h }));
        } catch {
          // card shows a loading state forever; harmless
        }
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [portfolio.id]);

  async function choose(themeId: ThemeId) {
    if (busy) return;
    if (themeId === portfolio.themeId) {
      onSelect(portfolio);
      return;
    }
    setBusy(themeId);
    setError("");
    try {
      const res = await api.portfolios.update(portfolio.id, { themeId });
      onSelect(res.data.portfolio);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not apply template");
      setBusy(null);
    }
  }

  return (
    <div className="px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="kicker text-coral">step 2 · pick a look</span>
          <h1 className="mt-3 display-1 text-[clamp(1.8rem,4.5vw,3rem)]">Your content is ready.</h1>
          <p className="scribble mt-2 text-2xl text-navy/50">now give it a home ✨</p>
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-coral/30 bg-coral/10 p-4 text-center text-sm font-semibold text-coral">
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {TEMPLATES.map((t, i) => {
            const active = selected === t.id;
            const ready = Boolean(html[t.id]);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.5, ease: EASE }}
                className={`relative flex flex-col overflow-hidden rounded-[1.75rem] border-2 transition-all duration-300 ${
                  active ? "-translate-y-1 border-navy shadow-lift" : "border-navy/10 shadow-soft hover:-translate-y-1"
                }`}
                style={{ background: "#fff" }}
              >
                <button
                  onClick={() => setSelected(t.id)}
                  className="group relative block h-56 overflow-hidden border-b border-navy/10 bg-navy/5"
                  aria-label={`Preview ${t.name} template`}
                >
                  {ready ? (
                    <div className="pointer-events-none h-full w-full" style={{ width: PREVIEW_WIDTH, transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left" }}>
                      <iframe title={`${t.name} preview`} srcDoc={html[t.id]} className="h-full w-full border-0" />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-navy/15 border-t-coral" />
                    </div>
                  )}
                </button>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="grid h-8 w-8 place-items-center rounded-xl text-xs font-black"
                        style={{ background: t.bg, color: t.accent }}
                      >
                        {t.name.slice(0, 1)}
                      </span>
                      <div>
                        <h2 className="font-display text-lg font-semibold leading-none">{t.name}</h2>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: t.accent }}>
                          {t.tagline}
                        </p>
                      </div>
                    </div>
                    <span className="flex -space-x-1">
                      {[t.bg, t.ink, t.accent].map((c) => (
                        <span key={c} className="h-3.5 w-3.5 rounded-full border-2 border-white" style={{ background: c }} />
                      ))}
                    </span>
                  </div>
                  <p className="mt-3 flex-1 text-xs leading-relaxed text-navy/60">{t.blurb}</p>
                  <button
                    onClick={() => choose(t.id)}
                    disabled={busy !== null}
                    className={`mt-4 w-full rounded-full py-2.5 text-xs font-bold transition-all duration-300 ${
                      active
                        ? "bg-navy text-cream"
                        : "border border-navy/20 bg-transparent text-navy hover:border-navy hover:bg-navy hover:text-cream"
                    }`}
                  >
                    {busy === t.id ? "Applying…" : active ? "Using this look" : "Use this look"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => choose(selected)}
            className="btn-primary"
          >
            Continue editing →
          </button>
        </div>
      </div>
    </div>
  );
}
