import type { Portfolio } from "@portsume/shared";
import {
  esc,
  safeUrl,
  visible,
  period,
  socialChips,
  skillGroupsMarkup,
  languagesMarkup,
  REVEAL_CSS,
  REVEAL_JS,
  PRINT_CSS,
} from "../shared.js";

function section(id: string, title: string, body: string): string {
  if (!body) return "";
  return `<section id="${id}" class="section rv">
    <h2 class="sec-title"><span class="hash">##</span> ${esc(title)}</h2>
    ${body}
  </section>`;
}

function projectCard(p: Portfolio["content"]["projects"][number], i: number): string {
  const img = p.images?.[0];
  const cover = img
    ? `<img class="pcov" src="${esc(safeUrl(img))}" alt="${esc(p.title)}" loading="lazy"/>`
    : `<div class="pcov pcov-plain" style="--h:${(i * 37) % 360}"><span class="pcov-glyph">▮▮▮</span></div>`;
  const links = [
    p.url ? `<a class="plink" href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener noreferrer">↗ open</a>` : "",
  ]
    .filter(Boolean)
    .join("");
  const tech = (p.techStack ?? []).slice(0, 6).map((t) => `<span class="ptag">${esc(t)}</span>`).join("");
  return `<article class="pcard">
    <div class="pbar"><span class="pdot"></span><span class="pdot"></span><span class="pdot"></span><span class="pfile">./${esc(p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}.tsx</span></div>
    ${cover}
    <div class="pbody">
      <h3 class="ptitle">${esc(p.title)}</h3>
      ${p.subtitle ? `<p class="psub">${esc(p.subtitle)}</p>` : ""}
      <p class="pdesc">${esc(p.description)}</p>
      ${tech ? `<div class="ptags">${tech}</div>` : ""}
      ${links}
    </div>
  </article>`;
}

export function renderDeveloper(p: Portfolio): string {
  const c = p.content;
  const name = c.about.name || "your_name";
  const role = c.about.role || "developer";
  const hasDownload = Boolean(c.resumeDownload.url);

  const statusDot = c.contact.availableForWork
    ? '<span class="status"><span class="stat-dot"></span> available for work</span>'
    : '<span class="status muted"><span class="stat-dot off"></span> open to conversations</span>';

  const aboutBody = `<div class="about-box"><span class="comment">// about.txt</span><p class="about-bio">${esc(c.about.bio)}</p></div>`;

  const featured = new Set(c.featuredProjectIds ?? []);
  const projects = c.projects
    .slice()
    .sort((a, b) => Number(featured.has(b.id)) - Number(featured.has(a.id)) || a.sortOrder - b.sortOrder);
  const projectsHtml = projects.length
    ? `<div class="pgrid">${projects.map((pr, i) => projectCard(pr, i)).join("")}</div>`
    : "";

  const timeline = c.experience
    .map((e) => {
      const bullets = (e.highlights ?? [])
        .map((b) => `<li>${esc(b)}</li>`)
        .join("");
      return `<div class="tl">
        <div class="tl-meta"><span class="tl-cmd">$</span> <span class="tl-years">${esc(period(e.start, e.end, e.current))}</span></div>
        <div class="tl-role">${esc(e.role)} <span class="tl-at">@ ${esc(e.company || "self")}</span></div>
        ${bullets ? `<ul class="tl-bullets">${bullets}</ul>` : e.description ? `<p class="tl-desc">${esc(e.description)}</p>` : ""}
      </div>`;
    })
    .join("");

  const eduList = c.education
    .map((e) => {
      const parts = [e.degree, e.field].filter(Boolean).join(", ");
      return `<li class="row"><span class="glyph">▸</span><div><strong>${esc(e.institution)}</strong><br/><span class="muted">${esc(parts || "—")}</span></div><span class="ryears">${esc(period(e.start, e.end))}</span></li>`;
    })
    .join("");
  const certList = c.certificates
    .map((x) => `<li class="row"><span class="glyph">▸</span><div><strong>${esc(x.name)}</strong>${x.issuer ? `<br/><span class="muted">${esc(x.issuer)}</span>` : ""}</div>${x.year ? `<span class="ryears">${esc(x.year)}</span>` : ""}</li>`)
    .join("");
  const awardList = c.awards
    .map((a) => `<li class="row"><span class="glyph">★</span><div><strong>${esc(a.title)}</strong>${a.issuer ? `<br/><span class="muted">${esc(a.issuer)}</span>` : ""}</div>${a.year ? `<span class="ryears">${esc(a.year)}</span>` : ""}</li>`)
    .join("");
  const achievementsList = c.achievements.map((a) => `<li class="row"><span class="glyph">✓</span><div><strong>${esc(a)}</strong></div></li>`).join("");
  const pubList = c.publications
    .map((pub) => `<li class="row"><span class="glyph">→</span><div>${pub.url ? `<a class="publink" href="${esc(safeUrl(pub.url))}" target="_blank" rel="noopener noreferrer">${esc(pub.title)}</a>` : `<strong>${esc(pub.title)}</strong>`}${pub.venue ? `<br/><span class="muted">${esc(pub.venue)}${pub.year ? ` · ${esc(pub.year)}` : ""}</span>` : ""}</div></li>`)
    .join("");

  const skillsHtml = c.skills.length ? section("skills", "skills.ts", skillGroupsMarkup(c.skills)) : "";

  const contactBody = `<div class="terminal">
    <div class="term-bar"><span class="pdot"></span><span class="pdot"></span><span class="pdot"></span><span class="term-title">contact — portsume</span></div>
    <div class="term-body">
      <p><span class="tprompt">➜ ~</span> <span class="tcmd">whoami</span></p>
      <p class="tname">${esc(name)} — ${esc(role)}</p>
      ${c.contact.email ? `<p><span class="tprompt">➜ ~</span> <span class="tcmd">email</span> &nbsp;<a class="tlink" href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a></p>` : ""}
      ${c.contact.phone ? `<p><span class="tprompt">➜ ~</span> <span class="tcmd">call</span> &nbsp;<a class="tlink" href="tel:${esc(c.contact.phone)}">${esc(c.contact.phone)}</a></p>` : ""}
      ${c.contact.location ? `<p><span class="tprompt">➜ ~</span> <span class="tcmd">location</span> &nbsp;${esc(c.contact.location)}</p>` : ""}
      ${hasDownload ? `<p><span class="tprompt">➜ ~</span> <span class="tcmd">cat resume.pdf</span> &nbsp;<a class="tlink" href="${esc(safeUrl(c.resumeDownload.url))}" target="_blank" rel="noopener noreferrer">download →</a></p>` : ""}
      ${socialChips(c.socialLinks)}
      <p class="tblink">▮</p>
    </div>
  </div>`;

  const sections = `
    ${visible(p, "about") && c.about.bio ? section("about", "about.ts", aboutBody) : ""}
    ${projectsHtml ? section("work", "projects.ts", projectsHtml) : ""}
    ${c.experience.length ? section("experience", "experience.ts", `<div class="tlwrap">${timeline}</div>`) : ""}
    ${skillsHtml}
    ${c.education.length ? section("education", "education.txt", `<ul class="rows">${eduList}</ul>`) : ""}
    ${c.certificates.length ? section("certifications", "certs.txt", `<ul class="rows">${certList}</ul>`) : ""}
    ${awardList || achievementsList ? section("recognition", "awards.md", `<ul class="rows">${awardList}${achievementsList}</ul>`) : ""}
    ${c.publications.length ? section("publications", "writing.md", `<ul class="rows">${pubList}</ul>`) : ""}
    ${c.languages.length ? section("languages", "langs.ts", languagesMarkup(c.languages)) : ""}
    ${visible(p, "contact") ? section("contact", "contact.ts", contactBody) : ""}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(p.seo.title)}</title>
<meta name="description" content="${esc(p.seo.description)}"/>
<meta property="og:title" content="${esc(p.seo.title)}"/>
<meta property="og:description" content="${esc(p.seo.description)}"/>
<meta property="og:type" content="profile"/>
<meta name="twitter:card" content="summary"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#0D1117;--panel:#161B22;--line:#21262D;--ink:#E6EDF3;--muted:#8B949E;--accent:#58A6FF;--green:#3FB950;--orange:#D29922}
*{box-sizing:border-box;margin:0}
html{scroll-behavior:smooth}
body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.65}
a{color:inherit}
.wrap{max-width:960px;margin:0 auto;padding:0 24px}
.mono,code{font-family:JetBrainsMono,ui-monospace,monospace}

/* ── hero ── */
.hero{min-height:88vh;display:flex;align-items:center;position:relative;padding:120px 0 70px}
.hero::before{content:"";position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);
  background-size:44px 44px;opacity:.4;mask-image:radial-gradient(70% 70% at 30% 30%,#000,transparent)}
.kicker{font-family:JetBrainsMono,monospace;font-size:.8rem;color:var(--accent);margin-bottom:20px}
.kicker::before{content:"❯ ";color:var(--green)}
.display{font-size:clamp(2.6rem,8vw,5rem);line-height:1;font-weight:700;letter-spacing:-.03em;font-family:JetBrainsMono,monospace}
.display .accent{color:var(--accent)}
.statement{margin-top:22px;font-size:clamp(1.1rem,2.6vw,1.5rem);color:var(--ink);max-width:40ch;font-weight:500}
.lede{margin-top:14px;color:var(--muted);max-width:48ch}
.hero-actions{margin-top:30px;display:flex;gap:14px;flex-wrap:wrap;align-items:center}
.btn{font-family:JetBrainsMono,monospace;font-size:.85rem;padding:12px 22px;border:1px solid var(--line);border-radius:8px;text-decoration:none;transition:all .2s;font-weight:500}
.btn-solid{background:var(--accent);color:#0D1117;border-color:var(--accent);font-weight:700}
.btn-solid:hover{filter:brightness(1.1)}
.btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
.status{font-family:JetBrainsMono,monospace;font-size:.78rem;color:var(--green);display:inline-flex;align-items:center;gap:8px}
.status.muted{color:var(--muted)}
.stat-dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 0 3px rgba(63,185,80,.2)}
.stat-dot.off{background:var(--muted);box-shadow:none}
.chips{margin-top:26px;display:flex;flex-wrap:wrap;gap:10px}
.chip{font-family:JetBrainsMono,monospace;font-size:.78rem;color:var(--muted);border:1px solid var(--line);border-radius:6px;padding:6px 12px;text-decoration:none;transition:all .2s}
.chip:hover{color:var(--accent);border-color:var(--accent)}

/* ── sections ── */
.section{margin:0;padding:72px 0;border-top:1px solid var(--line)}
.sec-title{font-family:JetBrainsMono,monospace;font-size:1.05rem;font-weight:700;margin-bottom:34px;letter-spacing:.02em}
.sec-title .hash{color:var(--green)}

/* ── about ── */
.about-box{border:1px solid var(--line);border-radius:10px;padding:26px;background:var(--panel);position:relative}
.comment{font-family:JetBrainsMono,monospace;font-size:.78rem;color:var(--muted);position:absolute;top:14px;right:18px}
.about-bio{font-size:1.12rem;max-width:58ch;padding-top:10px}

/* ── projects ── */
.pgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px}
.pcard{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;transition:transform .3s cubic-bezier(.22,1,.36,1),border-color .3s}
.pcard:hover{transform:translateY(-5px);border-color:var(--accent)}
.pbar{display:flex;align-items:center;gap:6px;padding:9px 14px;background:#0A0D12;border-bottom:1px solid var(--line)}
.pdot{width:9px;height:9px;border-radius:50%;background:var(--line)}
.pdot:first-child{background:#F85149}.pdot:nth-child(2){background:#D29922}.pdot:nth-child(3){background:#3FB950}
.pfile{font-family:JetBrainsMono,monospace;font-size:.7rem;color:var(--muted);margin-left:8px}
.pcov{aspect-ratio:16/9;object-fit:cover;width:100%;display:block}
.pcov-plain{display:grid;place-items:center;background:linear-gradient(135deg,hsl(var(--h) 45% 22%),hsl(calc(var(--h) + 50) 55% 12%))}
.pcov-glyph{font-family:JetBrainsMono,monospace;font-size:1.6rem;color:rgba(230,237,243,.7);letter-spacing:4px}
.pbody{padding:20px}
.ptitle{font-size:1.12rem;font-weight:700}
.psub{color:var(--accent);font-family:JetBrainsMono,monospace;font-size:.76rem;margin-top:4px}
.pdesc{color:var(--muted);font-size:.92rem;margin-top:10px}
.ptags{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.ptag{font-family:JetBrainsMono,monospace;font-size:.7rem;color:var(--accent);background:rgba(88,166,255,.1);border:1px solid rgba(88,166,255,.25);border-radius:5px;padding:3px 8px}
.plink{display:inline-block;margin-top:16px;font-family:JetBrainsMono,monospace;font-size:.8rem;color:var(--green);text-decoration:none}
.plink:hover{text-decoration:underline}

/* ── timeline ── */
.tlwrap{border-left:2px solid var(--line);margin-left:8px;padding-left:28px}
.tl{margin-bottom:38px;position:relative}
.tl::before{content:"";position:absolute;left:-35px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--green);box-shadow:0 0 0 4px var(--bg)}
.tl-meta{font-family:JetBrainsMono,monospace;font-size:.78rem;color:var(--muted)}
.tl-cmd{color:var(--green)}
.tl-years{color:var(--orange)}
.tl-role{font-size:1.2rem;font-weight:700;margin-top:6px}
.tl-at{color:var(--accent);font-weight:500}
.tl-bullets{margin:14px 0 0;padding-left:20px;color:var(--muted);font-size:.95rem}
.tl-bullets li{margin-bottom:6px}
.tl-desc{color:var(--muted);margin-top:10px;font-size:.95rem}

/* ── skills ── */
.skills{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:26px}
.skill-group{border:1px solid var(--line);border-radius:10px;padding:18px;background:var(--panel)}
.skill-cat{font-family:JetBrainsMono,monospace;font-size:.78rem;color:var(--green);font-weight:700}
.skill-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.skill{font-family:JetBrainsMono,monospace;font-size:.78rem;border:1px solid var(--line);border-radius:5px;padding:5px 10px;color:var(--ink)}
.skill:hover{border-color:var(--accent);color:var(--accent)}

/* ── rows ── */
.rows{list-style:none}
.row{display:flex;gap:14px;align-items:flex-start;padding:16px 0;border-top:1px solid var(--line)}
.row:first-child{border-top:none}
.glyph{color:var(--green);font-family:JetBrainsMono,monospace}
.ryears{font-family:JetBrainsMono,monospace;font-size:.78rem;color:var(--orange);margin-left:auto;white-space:nowrap}
.muted{color:var(--muted);font-size:.9rem}
.publink{color:var(--accent);text-decoration:none}
.publink:hover{text-decoration:underline}

/* ── languages ── */
.languages{display:flex;flex-wrap:wrap;gap:10px}
.lang{font-family:JetBrainsMono,monospace;font-size:.82rem;border:1px solid var(--line);border-radius:6px;padding:8px 14px;color:var(--ink)}
.lang::before{content:"‹› ";color:var(--green)}

/* ── contact terminal ── */
.terminal{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--panel)}
.term-bar{display:flex;align-items:center;gap:6px;padding:10px 14px;background:#0A0D12;border-bottom:1px solid var(--line)}
.term-title{font-family:JetBrainsMono,monospace;font-size:.72rem;color:var(--muted);margin-left:8px}
.term-body{padding:24px;font-family:JetBrainsMono,monospace;font-size:.9rem;line-height:2}
.tprompt{color:var(--green)}
.tcmd{color:var(--muted)}
.tname{color:var(--ink);font-weight:700}
.tlink{color:var(--accent);text-decoration:none}
.tlink:hover{text-decoration:underline}
.tblink{color:var(--green);animation:blink 1.1s steps(2) infinite}
@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
.term-body .chips{margin-top:14px}
.term-body .chip{color:var(--muted)}

footer{border-top:1px solid var(--line)}
.footer-inner{max-width:960px;margin:0 auto;padding:32px 24px;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;color:var(--muted);font-family:JetBrainsMono,monospace;font-size:.78rem}
${REVEAL_CSS}
${PRINT_CSS}
</style>
</head>
<body>
<header class="hero">
  <div class="wrap">
    <div class="rv">
      <p class="kicker">$ whoami && cat profile.ts</p>
      <h1 class="display">${esc(name)}<span class="accent">;</span></h1>
      <p class="statement">${esc(c.landing.headline)}</p>
      <p class="lede">${esc(c.landing.tagline)}</p>
      <div class="hero-actions">
        ${statusDot}
        ${c.contact.email ? `<a class="btn btn-solid" href="mailto:${esc(c.contact.email)}">contact →</a>` : ""}
        ${hasDownload ? `<a class="btn btn-ghost" href="${esc(safeUrl(c.resumeDownload.url))}" target="_blank" rel="noopener noreferrer">resume.pdf</a>` : ""}
      </div>
      ${socialChips(c.socialLinks)}
    </div>
  </div>
</header>
<main class="wrap">${sections}</main>
<footer>
  <div class="footer-inner">
    <span>© ${new Date().getFullYear()} ${esc(name)}</span>
    <span>curl portsume.app/${esc(p.slug)}</span>
    <a href="https://portsume.app" style="color:inherit;text-decoration:none">built with portsume</a>
  </div>
</footer>
${REVEAL_JS}
</body>
</html>`;
}
