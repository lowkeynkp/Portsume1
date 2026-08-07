import type { Portfolio } from "@portsume/shared";
import {
  esc,
  safeUrl,
  visible,
  dateLabel,
  period,
  initials,
  socialChips,
  skillGroupsMarkup,
  languagesMarkup,
  REVEAL_CSS,
  REVEAL_JS,
  PRINT_CSS,
} from "../shared.js";

const COVER_PALETTE = ["#D9503F", "#2F6B5E", "#B0794A", "#5E548E", "#C45B7B", "#3A5A78"];

function section(no: string, label: string, title: string, body: string): string {
  if (!body) return "";
  return `<section id="${label}" class="section rv">
    <div class="sec-head">
      <span class="sec-no">${no}</span>
      <span class="sec-label">${esc(label)}</span>
      <span class="sec-rule"></span>
    </div>
    <h2 class="sec-title">${esc(title)}</h2>
    ${body}
  </section>`;
}

function projectCard(p: Portfolio["content"]["projects"][number], i: number): string {
  const img = p.images?.[0];
  const cover = img
    ? `<img class="p-cover" src="${esc(safeUrl(img))}" alt="${esc(p.title)}" loading="lazy"/>`
    : `<div class="p-cover p-cover-plain" style="background:${COVER_PALETTE[i % COVER_PALETTE.length]};color:#fff">
         <span class="p-idx">${String(i + 1).padStart(2, "0")}</span>
         <span class="p-mono">${esc((p.techStack[0] ?? "PROJECT").toUpperCase())}</span>
       </div>`;
  const links = [
    p.url ? `<a class="p-link" href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener noreferrer">Visit ↗</a>` : "",
  ]
    .filter(Boolean)
    .join("");
  const tech = (p.techStack ?? []).slice(0, 6).map((t) => `<span class="ptag">${esc(t)}</span>`).join("");
  return `<article class="p-card">
    ${cover}
    <div class="p-body">
      <h3 class="p-title">${esc(p.title)}</h3>
      ${p.subtitle ? `<p class="p-sub">${esc(p.subtitle)}</p>` : ""}
      <p class="p-desc">${esc(p.description)}</p>
      ${tech ? `<div class="ptags">${tech}</div>` : ""}
      ${links}
    </div>
  </article>`;
}

export function renderEditorial(p: Portfolio): string {
  const c = p.content;
  const name = c.about.name || "Your Name";
  const role = c.about.role || "Portfolio";
  const loc = c.contact.location ? ` · ${esc(c.contact.location)}` : "";
  const hasDownload = Boolean(c.resumeDownload.url);

  const aboutBody = `<div class="about-grid">
      <div class="about-mark">${esc(initials(name))}</div>
      <p class="about-bio">${esc(c.about.bio)}</p>
    </div>`;

  const projects = c.projects.filter((pr) => visible(p, "projects") !== false);
  const featured = new Set(c.featuredProjectIds ?? []);
  const featuredProjects = projects.filter((pr) => featured.has(pr.id));
  const restProjects = projects.filter((pr) => !featured.has(pr.id));
  const projectsHtml = [
    ...featuredProjects.slice(0, 2).map((pr, i) => `<div class="p-featured">${projectCard(pr, i)}</div>`),
    restProjects.length ? `<div class="p-grid">${restProjects.map((pr, i) => projectCard(pr, i + featuredProjects.length)).join("")}</div>` : "",
  ].join("");

  const timeline = c.experience
    .map((e) => {
      const bullets = (e.highlights ?? [])
        .map((b) => `<li>${esc(b)}</li>`)
        .join("");
      return `<article class="tl">
        <div class="tl-line"><span class="tl-dot"></span></div>
        <div class="tl-body">
          <div class="tl-meta">${esc(period(e.start, e.end, e.current))}</div>
          <h3 class="tl-role">${esc(e.role)}</h3>
          <div class="tl-org">${esc(e.company)}${e.location ? ` <span class="tl-loc">— ${esc(e.location)}</span>` : ""}</div>
          ${bullets ? `<ul class="tl-bullets">${bullets}</ul>` : e.description ? `<p class="tl-desc">${esc(e.description)}</p>` : ""}
        </div>
      </article>`;
    })
    .join("");

  const eduList = c.education
    .map((e) => {
      const parts = [e.degree, e.field].filter(Boolean).join(", ");
      return `<li class="row">
        <div><strong>${esc(e.institution)}</strong>${parts ? `<br/><span class="muted">${esc(parts)}</span>` : ""}</div>
        <span class="row-year">${esc(period(e.start, e.end))}</span>
      </li>`;
    })
    .join("");
  const certList = c.certificates
    .map(
      (x) =>
        `<li class="row"><div><strong>${esc(x.name)}</strong>${x.issuer ? `<br/><span class="muted">${esc(x.issuer)}</span>` : ""}</div>${x.year ? `<span class="row-year">${esc(x.year)}</span>` : ""}</li>`,
    )
    .join("");

  const awardList = c.awards
    .map(
      (a) =>
        `<li class="row"><div><strong>${esc(a.title)}</strong>${a.issuer ? `<br/><span class="muted">${esc(a.issuer)}</span>` : ""}${a.description ? `<br/><span class="muted">${esc(a.description)}</span>` : ""}</div>${a.year ? `<span class="row-year">${esc(a.year)}</span>` : ""}</li>`,
    )
    .join("");
  const achievementsList = c.achievements.map((a) => `<li>${esc(a)}</li>`).join("");

  const pubList = c.publications
    .map((pub) => {
      const meta = [pub.venue, pub.year].filter(Boolean).join(" · ");
      return `<li class="row">
        <div>${pub.url ? `<a class="pub-link" href="${esc(safeUrl(pub.url))}" target="_blank" rel="noopener noreferrer">${esc(pub.title)} ↗</a>` : `<strong>${esc(pub.title)}</strong>`}${meta ? `<br/><span class="muted">${esc(meta)}</span>` : ""}</div>
      </li>`;
    })
    .join("");

  const contactBody = `<div class="contact-card">
      <h3 class="contact-title">Let's make something <em>worth keeping.</em></h3>
      <p class="contact-lede">${c.contact.availableForWork ? "Currently available for new work —" : "Always happy to chat —"} I reply to every message.</p>
      ${c.contact.email ? `<a class="btn" href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a>` : ""}
      <div class="contact-meta">
        ${c.contact.location ? `<span>${esc(c.contact.location)}</span>` : ""}
        ${c.contact.phone ? `<a href="tel:${esc(c.contact.phone)}">${esc(c.contact.phone)}</a>` : ""}
        ${socialChips(c.socialLinks)}
      </div>
    </div>`;

  const sections = `
    ${visible(p, "about") && c.about.bio ? section("01", "about", "About", aboutBody) : ""}
    ${projects.length ? section("02", "work", "Selected Work", projectsHtml) : ""}
    ${c.experience.length ? section("03", "experience", "Experience", `<div class="tl-wrap">${timeline}</div>`) : ""}
    ${c.skills.length ? section("04", "skills", "Capabilities", skillGroupsMarkup(c.skills)) : ""}
    ${c.education.length ? section("05", "education", "Education", `<ul class="rows">${eduList}</ul>`) : ""}
    ${c.certificates.length ? section("06", "certifications", "Certifications", `<ul class="rows">${certList}</ul>`) : ""}
    ${awardList || achievementsList ? section("07", "recognition", "Recognition", `<ul class="rows">${awardList}${achievementsList}</ul>`) : ""}
    ${c.publications.length ? section("08", "publications", "Writing & Talks", `<ul class="rows">${pubList}</ul>`) : ""}
    ${c.languages.length ? section("09", "languages", "Languages", languagesMarkup(c.languages)) : ""}
    ${visible(p, "contact") ? section("10", "contact", "Contact", contactBody) : ""}`;

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
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#FBF6EE;--paper:#F3ECDF;--ink:#1C1B19;--muted:#6E6759;--accent:#D9503F;--line:#D9CFBE}
*{box-sizing:border-box;margin:0}
html{scroll-behavior:smooth}
body{font-family:Manrope,system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.65;font-size:16px}
a{color:inherit}
.wrap{max-width:1060px;margin:0 auto;padding:0 24px}
.display{font-family:Fraunces,Georgia,serif;font-weight:600;letter-spacing:-.02em;line-height:.98;font-optical-sizing:auto}

/* ── hero ── */
.hero{min-height:92vh;display:flex;flex-direction:column;justify-content:center;position:relative;padding:120px 24px 60px}
.hero::after{content:"";position:absolute;inset:auto 0 0;height:2px;background:var(--line)}
.kicker{font-family:Manrope;font-size:.72rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin-bottom:22px}
.hero .display{font-size:clamp(3.2rem,11vw,7.4rem);max-width:14ch}
.statement{margin-top:28px;font-family:Fraunces,Georgia,serif;font-style:italic;font-weight:400;font-size:clamp(1.25rem,3vw,1.7rem);max-width:30ch;color:var(--ink)}
.lede{margin-top:18px;max-width:44ch;color:var(--muted);font-size:1.02rem}
.hero-actions{margin-top:34px;display:flex;gap:14px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:8px;border:2px solid var(--ink);border-radius:99px;padding:13px 26px;font-weight:700;font-size:.9rem;text-decoration:none;transition:transform .25s cubic-bezier(.22,1,.36,1),background .25s}
.btn:hover{transform:translateY(-2px)}
.btn-solid{background:var(--ink);color:var(--bg)}
.btn-solid:hover{background:var(--accent);border-color:var(--accent)}
.btn-ghost:hover{background:var(--paper)}
.chips{margin-top:30px;display:flex;flex-wrap:wrap;gap:10px}
.chip{border:1px solid var(--line);border-radius:99px;padding:7px 16px;font-size:.78rem;font-weight:600;text-decoration:none;color:var(--muted);transition:all .2s}
.chip:hover{color:var(--ink);border-color:var(--ink)}
.hero-big{position:absolute;right:6vw;top:12vh;font-family:Fraunces;font-weight:600;font-size:clamp(4rem,14vw,11rem);color:transparent;-webkit-text-stroke:1.5px var(--line);user-select:none;line-height:1}

/* ── sections ── */
.section{margin:0;padding:88px 0;border-bottom:2px solid var(--line)}
.sec-head{display:flex;align-items:baseline;gap:16px}
.sec-no{font-family:Fraunces;font-style:italic;color:var(--accent);font-size:1rem}
.sec-label{font-family:Manrope;font-size:.68rem;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}
.sec-rule{flex:1;height:1px;background:var(--line);transform:translateY(-4px)}
.sec-title{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(2rem,5vw,3.2rem);letter-spacing:-.02em;margin:18px 0 34px;line-height:1.05}

/* ── about ── */
.about-grid{display:grid;grid-template-columns:120px 1fr;gap:34px;align-items:start}
.about-mark{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:2.4rem;display:grid;place-items:center;aspect-ratio:1;border-radius:999px;background:var(--paper);border:1px solid var(--line)}
.about-bio{font-family:Fraunces,Georgia,serif;font-weight:400;font-size:clamp(1.15rem,2.6vw,1.6rem);line-height:1.5;max-width:56ch}

/* ── projects ── */
.p-featured{margin-bottom:28px}
.p-card{background:var(--paper);border:1px solid var(--line);transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .4s}
.p-featured .p-card{display:grid;grid-template-columns:1.1fr 1fr;min-height:0}
.p-featured .p-body{padding:30px 34px}
.p-card:hover{transform:translateY(-6px);box-shadow:0 30px 60px -24px rgba(28,27,25,.28)}
.p-cover{aspect-ratio:16/10;width:100%;object-fit:cover;display:block}
.p-featured .p-cover{aspect-ratio:auto;height:100%;min-height:280px}
.p-cover-plain{position:relative;display:grid;place-items:center;overflow:hidden}
.p-cover-plain::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(-45deg,rgba(255,255,255,.08) 0 2px,transparent 2px 14px)}
.p-idx{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:3.4rem;opacity:.9;position:relative;z-index:1}
.p-mono{position:absolute;left:16px;bottom:14px;font-size:.62rem;font-weight:700;letter-spacing:.2em;opacity:.8;position:absolute;z-index:1}
.p-body{padding:24px}
.p-title{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:1.45rem;line-height:1.1}
.p-sub{color:var(--accent);font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-top:6px}
.p-desc{margin-top:10px;color:var(--muted);font-size:.95rem}
.p-link{display:inline-block;margin-top:16px;font-weight:700;font-size:.88rem;color:var(--accent);text-decoration:none;border-bottom:2px solid var(--accent);padding-bottom:2px}
.ptags{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}
.ptag{font-size:.68rem;font-weight:600;letter-spacing:.06em;border:1px solid var(--line);padding:4px 10px;border-radius:99px;color:var(--muted)}
.p-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:28px}
.p-grid .p-cover{aspect-ratio:16/11}

/* ── timeline ── */
.tl{display:grid;grid-template-columns:44px 1fr;gap:18px;margin-bottom:42px}
.tl-line{position:relative}
.tl-line::before{content:"";position:absolute;top:10px;bottom:-42px;left:6px;width:2px;background:var(--line)}
.tl:last-child .tl-line::before{display:none}
.tl-dot{position:absolute;top:4px;left:0;width:14px;height:14px;border-radius:50%;background:var(--accent);border:3px solid var(--bg);box-shadow:0 0 0 2px var(--accent)}
.tl-meta{font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
.tl-role{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:1.5rem;margin-top:4px;line-height:1.15}
.tl-org{color:var(--muted);font-weight:600;font-size:.98rem;margin-top:2px}
.tl-loc{font-weight:400}
.tl-bullets{margin:14px 0 0;padding-left:20px;color:var(--ink);font-size:.96rem}
.tl-bullets li{margin-bottom:6px}
.tl-desc{margin-top:12px;color:var(--muted);font-size:.96rem;max-width:62ch}

/* ── skills ── */
.skills{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:30px}
.skill-group{border-left:3px solid var(--accent);padding-left:18px}
.skill-cat{font-family:Manrope;font-size:.7rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.skill-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.skill{font-size:.85rem;background:var(--paper);border:1px solid var(--line);border-radius:99px;padding:7px 14px}
.skill:hover{border-color:var(--accent);color:var(--accent)}

/* ── rows (education/certs/awards) ── */
.rows{list-style:none;padding:0}
.row{display:flex;justify-content:space-between;gap:20px;align-items:baseline;padding:20px 0;border-top:1px solid var(--line)}
.row:first-child{border-top:none}
.row-year{font-family:Manrope;font-size:.78rem;font-weight:700;letter-spacing:.12em;color:var(--accent);white-space:nowrap}
.muted{color:var(--muted);font-size:.9rem}
.pub-link{color:var(--ink);font-weight:600;text-decoration:none;border-bottom:2px solid var(--accent)}

/* ── languages ── */
.languages{display:flex;flex-wrap:wrap;gap:12px}
.lang{font-family:Fraunces,Georgia,serif;font-size:1.25rem;border-bottom:2px solid var(--accent);padding-bottom:2px}

/* ── contact ── */
.contact-card{border:2px solid var(--ink);background:var(--paper);padding:clamp(30px,6vw,64px);text-align:center}
.contact-title{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(1.8rem,4.5vw,3rem);line-height:1.05;letter-spacing:-.02em}
.contact-title em{color:var(--accent)}
.contact-lede{margin:16px auto 30px;color:var(--muted);max-width:44ch}
.contact-meta{margin-top:26px;display:flex;flex-direction:column;gap:8px;align-items:center;font-size:.95rem;color:var(--muted)}
.contact-meta a{color:var(--ink);font-weight:600}
.contact-meta .chips{margin-top:8px;justify-content:center}

footer{border-top:2px solid var(--line);margin-top:0}
.footer-inner{max-width:1060px;margin:0 auto;padding:36px 24px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;color:var(--muted);font-size:.85rem}
${REVEAL_CSS}
${PRINT_CSS}
</style>
</head>
<body>
<div class="hero">
  <span class="hero-big">${esc(initials(name))}</span>
  <div class="wrap" style="position:relative">
    <div class="rv">
      <p class="kicker">${esc(role)}${loc}</p>
      <h1 class="display">${esc(name)}</h1>
      <p class="statement">${esc(c.landing.headline)}</p>
      <p class="lede">${esc(c.landing.tagline)}</p>
      <div class="hero-actions">
        ${c.contact.email ? `<a class="btn btn-solid" href="mailto:${esc(c.contact.email)}">Let's work together</a>` : ""}
        ${hasDownload ? `<a class="btn btn-ghost" href="${esc(safeUrl(c.resumeDownload.url))}" target="_blank" rel="noopener">View résumé</a>` : ""}
      </div>
      ${socialChips(c.socialLinks)}
    </div>
  </div>
</div>
<main class="wrap">${sections}</main>
<footer>
  <div class="footer-inner">
    <span>© ${new Date().getFullYear()} ${esc(name)}</span>
    <span>${esc(c.landing.tagline.slice(0, 60))}</span>
    <a href="https://portsume.app" style="color:inherit;font-weight:700;text-decoration:none">Built with Portsume</a>
  </div>
</footer>
${REVEAL_JS}
</body>
</html>`;
}
