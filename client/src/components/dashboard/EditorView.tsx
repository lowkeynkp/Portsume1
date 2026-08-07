import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Portfolio, PortfolioContent, ThemeId } from "@portsume/shared";
import { api, publicPortfolioUrl } from "../../lib/api";
import { EASE } from "../../lib/motion";
import { TEMPLATES, templateFor } from "../../lib/templates";
import { Tape } from "../decor";

interface Props {
  portfolio: Portfolio;
  onPublished: (portfolio: Portfolio) => void;
}

type SaveState = "idle" | "dirty" | "saving" | "saved";
type Tab = "story" | "experience" | "projects" | "skills" | "contact" | "appearance";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "story", label: "Story" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
  { id: "appearance", label: "Look" },
];

const ACCENT_SWATCHES = [
  "#F68D7A", "#D9503F", "#157A43", "#3FB950", "#24305E",
  "#8ED8F8", "#58A6FF", "#4A7E8E", "#FF5C8A", "#6C5CE7", "#FFC93C",
];

function Field({
  label,
  value,
  onChange,
  textarea,
  rows,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
  mono?: boolean;
}) {
  const cls = `w-full rounded-2xl border border-navy/15 bg-ivory/60 px-4 py-3 font-body text-sm leading-relaxed focus:border-forest focus:outline-none focus:ring-2 focus:ring-sage/50 ${
    mono ? "font-mono" : ""
  }`;
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-navy/50">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows ?? 4} className={cls} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </label>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="kicker mb-3 text-forest">{children}</h3>;
}

export function EditorView({ portfolio, onPublished }: Props) {
  const [draft, setDraft] = useState(portfolio);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [previewHtml, setPreviewHtml] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [tab, setTab] = useState<Tab>("story");
  const [previewKey, setPreviewKey] = useState(0);

  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const previewReq = useRef(0);
  const initialPreviewDone = useRef(false);
  const draftRef = useRef(draft);
  const saveStateRef = useRef(saveState);

  const theme = templateFor(draft.themeId);

  useEffect(() => {
    draftRef.current = draft;
    saveStateRef.current = saveState;
  }, [draft, saveState]);

  const [hexDraft, setHexDraft] = useState(draft.accent);
  useEffect(() => {
    setHexDraft(draft.accent);
  }, [draft.accent]);

  /* ── helpers ─────────────────────────────────────────────── */

  const updateContent = useCallback((updater: (c: PortfolioContent) => PortfolioContent) => {
    setDraft((prev) => {
      const next: Portfolio = { ...prev, content: updater(prev.content) };
      return next;
    });
    setSaveState("dirty");
  }, []);

  const refreshPreview = useCallback(
    async (id: string) => {
      const req = ++previewReq.current;
      try {
        const html = await api.portfolios.preview(id);
        if (req !== previewReq.current) return;
        setPreviewHtml(html);
      } catch {
        // keep last good preview
      }
    },
    [],
  );

  // Initial preview render.
  useEffect(() => {
    if (initialPreviewDone.current) return;
    initialPreviewDone.current = true;
    void refreshPreview(draft.id);
  }, [draft.id, refreshPreview]);

  // Autosave content (debounced) then re-render the preview.
  useEffect(() => {
    if (saveState === "idle" || saveState === "saved") return;
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await api.portfolios.update(draft.id, { title: draft.title, content: draft.content });
        setDraft(res.data.portfolio);
        setSaveState("saved");
        void refreshPreview(res.data.portfolio.id);
      } catch {
        setSaveState("dirty");
      }
    }, 900);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.title, draft.content]);

  /* ── theme & accent: immediate save for a snappy preview ── */

  async function setTheme(id: ThemeId) {
    if (id === draft.themeId) return;
    const prev = draft.themeId;
    setDraft((prevDraft) => ({ ...prevDraft, themeId: id }));
    setSaveState("saving");
    try {
      const res = await api.portfolios.update(draft.id, { themeId: id });
      setDraft(res.data.portfolio);
      setSaveState("saved");
      setPreviewKey((k) => k + 1);
      void refreshPreview(res.data.portfolio.id);
    } catch {
      setDraft((prevDraft) => (prevDraft.themeId === id ? { ...prevDraft, themeId: prev } : prevDraft));
      setSaveState("dirty");
    }
  }

  async function setAccent(accent: string) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(accent)) return;
    const prev = draft.accent;
    setDraft((prevDraft) => ({ ...prevDraft, accent }));
    setSaveState("saving");
    try {
      const res = await api.portfolios.update(draft.id, { accent });
      setDraft(res.data.portfolio);
      setSaveState("saved");
      void refreshPreview(res.data.portfolio.id);
    } catch {
      setDraft((prevDraft) => (prevDraft.accent === accent ? { ...prevDraft, accent: prev } : prevDraft));
      setSaveState("dirty");
    }
  }

  /** Persist any pending content edit right now so Publish never ships stale content. */
  async function flushSave(): Promise<Portfolio> {
    const current = draftRef.current;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (saveStateRef.current === "dirty" || saveStateRef.current === "saving") {
      setSaveState("saving");
      try {
        const res = await api.portfolios.update(current.id, { title: current.title, content: current.content });
        setDraft(res.data.portfolio);
        setSaveState("saved");
        return res.data.portfolio;
      } catch {
        setSaveState("dirty");
        return current;
      }
    }
    return current;
  }

  async function publish() {
    setPublishing(true);
    try {
      const saved = await flushSave();
      const res = await api.portfolios.publish(saved.id);
      onPublished(res.data.portfolio);
    } finally {
      setPublishing(false);
    }
  }

  function commitHex() {
    const v = hexDraft.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      void setAccent(v);
    } else {
      setHexDraft(draft.accent);
    }
  }

  /* ── list editing ────────────────────────────────────────── */

  function updateListEntry<K extends "experience" | "projects">(key: K, id: string, patch: Record<string, unknown>) {
    updateContent((c) => ({
      ...c,
      [key]: (c[key] as Array<{ id: string }>).map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }

  function addEntry<K extends "experience" | "projects">(key: K) {
    updateContent((c) => {
      const list = c[key] as Array<{ id: string; sortOrder: number }>;
      const blank =
        key === "experience"
          ? { id: `exp-${Date.now()}`, role: "", company: "", start: "", end: "", current: false, description: "", highlights: [], sortOrder: list.length }
          : { id: `prj-${Date.now()}`, title: "", subtitle: "", description: "", url: "", techStack: [], sortOrder: list.length };
      return { ...c, [key]: [...list, blank] };
    });
  }

  function removeEntry<K extends "experience" | "projects">(key: K, id: string) {
    updateContent((c) => ({ ...c, [key]: (c[key] as Array<{ id: string }>).filter((e) => e.id !== id) }));
  }

  function setHighlights(id: string, raw: string) {
    const highlights = raw.split("\n").map((s) => s.trim()).filter(Boolean);
    updateListEntry("experience", id, { highlights });
  }

  function setTech(id: string, raw: string) {
    const techStack = raw.split(",").map((s) => s.trim()).filter(Boolean);
    updateListEntry("projects", id, { techStack });
  }

  function setSkillsGroup(id: string, patch: { category?: string; skills?: string[] }) {
    updateContent((c) => ({
      ...c,
      skills: c.skills.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  }

  function addSkillGroup() {
    updateContent((c) => ({ ...c, skills: [...c.skills, { id: `grp-${Date.now()}`, category: "More", skills: [] }] }));
  }

  function setSectionVisibility(key: string, visible: boolean) {
    updateContent((c) => ({
      ...c,
      sections: { ...(c.sections ?? {}), [key]: { ...(c.sections?.[key] ?? { visible: true }), visible } },
    }));
  }

  const c = draft.content;
  const sectionKeys = [
    ["about", "About"],
    ["experience", "Experience"],
    ["projects", "Projects"],
    ["skills", "Skills"],
    ["education", "Education"],
    ["certificates", "Certifications"],
    ["awards", "Awards"],
    ["achievements", "Achievements"],
    ["publications", "Publications"],
    ["languages", "Languages"],
    ["contact", "Contact"],
  ] as const;

  /* ── render ──────────────────────────────────────────────── */

  return (
    <div className="px-5 py-6">
      <div className="mx-auto max-w-[1400px]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="kicker text-coral">the studio</span>
            <h1 className="mt-1 font-display text-3xl font-semibold">{draft.title || "Untitled portfolio"}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                saveState === "saved" ? "border-sage/60 bg-sage/30 text-forest" : saveState === "dirty" ? "border-butter/70 bg-butter/30 text-navy" : "border-navy/15 bg-paper text-navy/60"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${saveState === "saved" ? "bg-forest" : saveState === "dirty" ? "bg-coral animate-pulse" : "bg-navy/30"}`} />
              {saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving…" : saveState === "dirty" ? "Unsaved edits" : "Autosave on"}
            </span>
            <button onClick={publish} disabled={publishing} className="btn-primary !py-2.5 !text-xs">
              {publishing ? "Publishing…" : draft.status === "published" ? "Republish ↗" : "Publish ↗"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,460px)_1fr]">
          {/* Left: editor panel */}
          <div className="flex flex-col rounded-[2rem] border border-navy/10 bg-paper/80 shadow-soft">
            <div className="relative border-b border-navy/10 px-5 pt-5">
              <Tape className="-top-3 right-8" />
              <span className="kicker text-forest">edit your story</span>
              <div className="mt-4 flex flex-wrap gap-1">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                      tab === t.id ? "bg-navy text-cream" : "text-navy/60 hover:bg-navy/5 hover:text-navy"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[520px] overflow-y-auto p-5 lg:h-[640px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.22, ease: EASE }}
                  className="space-y-5"
                >
                  {tab === "story" && (
                    <>
                      <SectionHeading>Identity</SectionHeading>
                      <Field label="Name" value={c.about.name} onChange={(v) => updateContent((x) => ({ ...x, about: { ...x.about, name: v } }))} />
                      <Field label="Professional title / role" value={c.about.role} onChange={(v) => updateContent((x) => ({ ...x, about: { ...x.about, role: v } }))} />
                      <SectionHeading>Opening</SectionHeading>
                      <Field label="Headline" value={c.landing.headline} onChange={(v) => updateContent((x) => ({ ...x, landing: { ...x.landing, headline: v } }))} />
                      <Field label="Tagline" value={c.landing.tagline} onChange={(v) => updateContent((x) => ({ ...x, landing: { ...x.landing, tagline: v } }))} />
                      <Field label="Bio" value={c.about.bio} onChange={(v) => updateContent((x) => ({ ...x, about: { ...x.about, bio: v } }))} textarea rows={5} />
                    </>
                  )}

                  {tab === "experience" && (
                    <>
                      <div className="flex items-center justify-between">
                        <SectionHeading>Work history</SectionHeading>
                        <button onClick={() => addEntry("experience")} className="btn-ghost !px-3 !py-1.5 !text-[11px]">+ Add role</button>
                      </div>
                      {c.experience.map((e, i) => (
                        <div key={e.id} className="relative rounded-2xl border border-navy/10 bg-ivory/50 p-4">
                          <span className="absolute right-3 top-3 text-[10px] font-bold text-navy/30">#{i + 1}</span>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Role" value={e.role} onChange={(v) => updateListEntry("experience", e.id, { role: v })} />
                            <Field label="Company" value={e.company} onChange={(v) => updateListEntry("experience", e.id, { company: v })} />
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <Field label="Start" value={e.start ?? ""} onChange={(v) => updateListEntry("experience", e.id, { start: v })} mono />
                            <Field label="End" value={e.current ? "Present" : (e.end ?? "")} onChange={(v) => updateListEntry("experience", e.id, { end: v, current: v.toLowerCase().startsWith("present") })} mono />
                            <Field label="Location" value={e.location ?? ""} onChange={(v) => updateListEntry("experience", e.id, { location: v })} />
                          </div>
                          <div className="mt-3">
                            <Field label="Highlights (one per line)" value={(e.highlights ?? []).join("\n")} onChange={(v) => setHighlights(e.id, v)} textarea rows={3} />
                          </div>
                          <button onClick={() => removeEntry("experience", e.id)} className="mt-3 text-xs font-bold text-coral hover:underline">
                            Remove entry
                          </button>
                        </div>
                      ))}
                    </>
                  )}

                  {tab === "projects" && (
                    <>
                      <div className="flex items-center justify-between">
                        <SectionHeading>Selected work</SectionHeading>
                        <button onClick={() => addEntry("projects")} className="btn-ghost !px-3 !py-1.5 !text-[11px]">+ Add project</button>
                      </div>
                      {c.projects.map((p) => (
                        <div key={p.id} className="rounded-2xl border border-navy/10 bg-ivory/50 p-4">
                          <Field label="Title" value={p.title} onChange={(v) => updateListEntry("projects", p.id, { title: v })} />
                          <div className="mt-3">
                            <Field label="Subtitle" value={p.subtitle ?? ""} onChange={(v) => updateListEntry("projects", p.id, { subtitle: v })} />
                          </div>
                          <div className="mt-3">
                            <Field label="Description" value={p.description} onChange={(v) => updateListEntry("projects", p.id, { description: v })} textarea rows={3} />
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <Field label="Tech stack (comma separated)" value={(p.techStack ?? []).join(", ")} onChange={(v) => setTech(p.id, v)} />
                            <Field label="URL" value={p.url ?? ""} onChange={(v) => updateListEntry("projects", p.id, { url: v })} mono />
                          </div>
                          <button onClick={() => removeEntry("projects", p.id)} className="mt-3 text-xs font-bold text-coral hover:underline">
                            Remove project
                          </button>
                        </div>
                      ))}
                    </>
                  )}

                  {tab === "skills" && (
                    <>
                      <div className="flex items-center justify-between">
                        <SectionHeading>Skill groups</SectionHeading>
                        <button onClick={addSkillGroup} className="btn-ghost !px-3 !py-1.5 !text-[11px]">+ Add group</button>
                      </div>
                      {c.skills.map((g) => (
                        <div key={g.id} className="rounded-2xl border border-navy/10 bg-ivory/50 p-4">
                          <Field label="Category" value={g.category} onChange={(v) => setSkillsGroup(g.id, { category: v })} />
                          <div className="mt-3">
                            <Field label="Skills (comma separated)" value={g.skills.join(", ")} onChange={(v) => setSkillsGroup(g.id, { skills: v.split(",").map((s) => s.trim()).filter(Boolean) })} textarea rows={2} />
                          </div>
                        </div>
                      ))}
                      <SectionHeading>Education</SectionHeading>
                      {c.education.map((e) => (
                        <div key={e.id} className="rounded-2xl border border-navy/10 bg-ivory/50 p-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Institution" value={e.institution} onChange={(v) => updateContent((x) => ({ ...x, education: x.education.map((ed) => (ed.id === e.id ? { ...ed, institution: v } : ed)) }))} />
                            <Field label="Degree" value={e.degree} onChange={(v) => updateContent((x) => ({ ...x, education: x.education.map((ed) => (ed.id === e.id ? { ...ed, degree: v } : ed)) }))} />
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <Field label="Years (e.g. 2015 — 2019)" value={[e.start, e.end].filter(Boolean).join(" — ")} onChange={(v) => {
                              const [start, end] = v.split(/—|-|–/).map((s) => s.trim());
                              updateContent((x) => ({ ...x, education: x.education.map((ed) => (ed.id === e.id ? { ...ed, start, end } : ed)) }));
                            }} />
                            <Field label="Field" value={e.field ?? ""} onChange={(v) => updateContent((x) => ({ ...x, education: x.education.map((ed) => (ed.id === e.id ? { ...ed, field: v } : ed)) }))} />
                          </div>
                        </div>
                      ))}
                      <SectionHeading>Awards</SectionHeading>
                      {c.awards.map((a) => (
                        <div key={a.id} className="rounded-2xl border border-navy/10 bg-ivory/50 p-4">
                          <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
                            <Field label="Award" value={a.title} onChange={(v) => updateContent((x) => ({ ...x, awards: x.awards.map((aw) => (aw.id === a.id ? { ...aw, title: v } : aw)) }))} />
                            <Field label="Year" value={a.year ?? ""} onChange={(v) => updateContent((x) => ({ ...x, awards: x.awards.map((aw) => (aw.id === a.id ? { ...aw, year: v } : aw)) }))} />
                          </div>
                        </div>
                      ))}
                      <SectionHeading>Languages</SectionHeading>
                      <Field label="Languages (comma separated)" value={c.languages.join(", ")} onChange={(v) => updateContent((x) => ({ ...x, languages: v.split(",").map((s) => s.trim()).filter(Boolean) }))} />
                    </>
                  )}

                  {tab === "contact" && (
                    <>
                      <SectionHeading>Contact details</SectionHeading>
                      <Field label="Email" value={c.contact.email} onChange={(v) => updateContent((x) => ({ ...x, contact: { ...x.contact, email: v } }))} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Phone" value={c.contact.phone ?? ""} onChange={(v) => updateContent((x) => ({ ...x, contact: { ...x.contact, phone: v } }))} />
                        <Field label="Location" value={c.contact.location ?? ""} onChange={(v) => updateContent((x) => ({ ...x, contact: { ...x.contact, location: v } }))} />
                      </div>
                      <label className="flex items-center justify-between rounded-2xl border border-navy/10 bg-ivory/50 px-4 py-3">
                        <span className="text-xs font-bold text-navy/70">Available for work</span>
                        <input
                          type="checkbox"
                          checked={c.contact.availableForWork}
                          onChange={(e) => updateContent((x) => ({ ...x, contact: { ...x.contact, availableForWork: e.target.checked } }))}
                          className="h-5 w-5 accent-forest"
                        />
                      </label>
                      <SectionHeading>Social links</SectionHeading>
                      <div className="flex flex-wrap gap-2">
                        {c.socialLinks.length === 0 && <p className="text-sm text-navy/50">No social links detected.</p>}
                        {c.socialLinks.map((s) => (
                          <span key={s.id} className="flex items-center gap-2 rounded-full border border-navy/15 bg-ivory px-3 py-1.5 text-xs font-bold text-navy/70">
                            {s.platform}
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">↗</a>
                          </span>
                        ))}
                      </div>
                      {c.resumeDownload.url && (
                        <div>
                          <SectionHeading>Resume</SectionHeading>
                          <a href={c.resumeDownload.url} target="_blank" rel="noopener noreferrer" className="btn-ghost !py-2 !text-xs">
                            Download original resume ↗
                          </a>
                        </div>
                      )}
                    </>
                  )}

                  {tab === "appearance" && (
                    <>
                      <SectionHeading>Template</SectionHeading>
                      <div className="grid grid-cols-2 gap-3">
                        {TEMPLATES.map((t) => {
                          const active = draft.themeId === t.id;
                          return (
                            <button
                              key={t.id}
                              onClick={() => setTheme(t.id)}
                              className={`rounded-2xl border-2 p-3 text-left transition-all duration-200 ${
                                active ? "border-navy shadow-soft" : "border-navy/10 hover:border-navy/40"
                              }`}
                              style={{ background: t.bg }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold" style={{ color: t.ink }}>
                                  {t.name}
                                </span>
                                <span className="grid h-5 w-5 place-items-center rounded-full text-[9px]" style={{ background: t.accent, color: t.bg }}>
                                  {t.tagline.slice(0, 1)}
                                </span>
                              </div>
                              <div className="mt-2 flex gap-1">
                                {[t.bg, t.ink, t.accent].map((col) => (
                                  <span key={col} className="h-3 w-3 rounded-full border border-black/10" style={{ background: col }} />
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <SectionHeading>Accent color</SectionHeading>
                      <div className="flex flex-wrap items-center gap-2">
                        {ACCENT_SWATCHES.map((col) => (
                          <button
                            key={col}
                            onClick={() => setAccent(col)}
                            aria-label={`Set accent ${col}`}
                            className={`h-9 w-9 rounded-full border-2 transition-transform ${draft.accent.toLowerCase() === col.toLowerCase() ? "scale-110 border-navy" : "border-white hover:scale-105"}`}
                            style={{ background: col }}
                          />
                        ))}
                        <input
                          type="color"
                          value={draft.accent}
                          onChange={(e) => setAccent(e.target.value)}
                          className="h-9 w-9 cursor-pointer rounded-full border-2 border-white bg-transparent"
                          aria-label="Custom accent color"
                        />
                        <input
                          value={hexDraft}
                          onChange={(e) => setHexDraft(e.target.value)}
                          onBlur={commitHex}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitHex();
                          }}
                          className="w-28 rounded-full border border-navy/15 bg-ivory/60 px-3 py-1.5 font-mono text-xs focus:border-forest focus:outline-none"
                          aria-label="Accent hex"
                        />
                      </div>

                      <SectionHeading>Sections</SectionHeading>
                      <div className="space-y-1.5">
                        {sectionKeys.map(([key, label]) => {
                          const visible = c.sections?.[key]?.visible ?? true;
                          return (
                            <label key={key} className="flex items-center justify-between rounded-xl border border-navy/10 bg-ivory/50 px-4 py-2.5">
                              <span className="text-sm font-bold text-navy/70">{label}</span>
                              <input
                                type="checkbox"
                                checked={visible}
                                onChange={(e) => setSectionVisibility(key, e.target.checked)}
                                className="h-5 w-5 accent-forest"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right: live preview */}
          <div className="flex min-h-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="kicker text-navy/50">
                live preview · <span style={{ color: theme.accent }}>{theme.name}</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-forest">
                <span className="h-2 w-2 rounded-full bg-forest" /> real render, updated on save
              </span>
            </div>
            <div className="mt-3 flex-1 overflow-hidden rounded-[2rem] border border-navy/10 shadow-lift" style={{ background: theme.bg }}>
              <div className="flex items-center gap-1.5 border-b border-navy/10 bg-paper/70 px-4 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-coral" />
                <span className="h-2.5 w-2.5 rounded-full bg-butter" />
                <span className="h-2.5 w-2.5 rounded-full bg-sage" />
                <span className="ml-3 rounded-full bg-navy/5 px-3 py-0.5 text-[10px] font-semibold text-navy/50">
                  {publicPortfolioUrl(draft.slug)}
                </span>
              </div>
              <div className="h-[560px] lg:h-[640px]">
                {previewHtml ? (
                  <motion.iframe
                    key={previewKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35 }}
                    title="Live portfolio preview"
                    srcDoc={previewHtml}
                    className="h-full w-full border-0"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-navy/15 border-t-coral" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
