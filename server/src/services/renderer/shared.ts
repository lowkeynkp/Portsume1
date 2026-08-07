import type { Portfolio, SocialLink, SkillGroup } from "@portsume/shared";

export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only allow safe URL schemes + bare hostnames; everything else is dead-ended. */
export function safeUrl(u?: string): string {
  if (!u) return "#";
  const t = u.trim();
  if (/^(https?:\/\/|mailto:)/i.test(t)) return t;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(t)) return `https://${t}`;
  return "#";
}

/** Respect the editor's per-section visibility switch (defaults on). */
export function visible(p: Portfolio, id: string): boolean {
  return p.content.sections?.[id]?.visible !== false;
}

/** Standardized months → short label. */
export function dateLabel(raw?: string): string {
  if (!raw) return "";
  const y = raw.match(/\b(20\d{2}|19\d{2})\b/);
  const m = raw.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*/i);
  return m && y ? `${m[1]}. ${y[0]}` : y ? y[0] : raw;
}

export function period(start?: string, end?: string, current?: boolean): string {
  const a = dateLabel(start);
  const b = current ? "Present" : dateLabel(end);
  if (a && b) return `${a} — ${b}`;
  return a || b || "";
}

export function initials(name: string): string {
  return (name.trim().split(/\s+/).map((w) => w[0] ?? "").slice(0, 2).join("")).toUpperCase();
}

/* ── Shared building blocks (styling lives in each template) ── */

export function socialChips(links: SocialLink[]): string {
  if (links.length === 0) return "";
  const chips = links
    .map(
      (l) =>
        `<a class="chip" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener noreferrer nofollow">${esc(l.platform)}</a>`,
    )
    .join("");
  return `<div class="chips">${chips}</div>`;
}

export function skillGroupsMarkup(groups: SkillGroup[]): string {
  if (!groups || groups.length === 0) return "";
  const groupsHtml = groups
    .map((g) => {
      const chips = g.skills.map((s) => `<span class="skill">${esc(s)}</span>`).join("");
      return `<div class="skill-group"><span class="skill-cat">${esc(g.category)}</span><div class="skill-list">${chips}</div></div>`;
    })
    .join("");
  return `<div class="skills">${groupsHtml}</div>`;
}

export function languagesMarkup(langs: string[]): string {
  if (!langs || langs.length === 0) return "";
  return `<div class="languages">${langs.map((l) => `<span class="lang">${esc(l)}</span>`).join("")}</div>`;
}

export const REVEAL_JS = `<script>
(function(){
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  },{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
  var els=document.querySelectorAll('.rv'); for(var i=0;i<els.length;i++){ io.observe(els[i]); }
})();
</script>`;

export const REVEAL_CSS = `.rv{opacity:0;transform:translateY(26px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)}
.rv.in{opacity:1;transform:none}
@media (prefers-reduced-motion: reduce){.rv{opacity:1!important;transform:none!important;transition:none!important}*{animation:none!important}}`;

export const PRINT_CSS = `@media print{
  .rv{opacity:1!important;transform:none!important}
  nav,.noprint{display:none!important}
  a{text-decoration:none;color:inherit}
  section{break-inside:avoid}
}`;
