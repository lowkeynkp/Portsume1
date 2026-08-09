import type { Portfolio } from "@portsume/shared";
import {
  esc,
  safeUrl,
  visible,
  period,
  socialChips,
  languagesMarkup,
  REVEAL_CSS,
  REVEAL_JS,
  PRINT_CSS,
} from "../shared.js";

function issue(id: string, no: string, label: string, title: string, body: string): string {
  if (!body) return "";
  return `<section id="${id}" class="issue rv">
    <div class="issue-kicker"><span class="issue-no">no. ${no}</span><span class="issue-label">${esc(label)}</span></div>
    <h2 class="issue-title">${esc(title)}</h2>
    <div class="issue-body">${body}</div>
  </section>`;
}

export function renderMagazine(p: Portfolio): string {
  const c = p.content;
  const name = c.about.name || "Your Name";
  const role = c.about.role || "Portfolio";
  const hasDownload = Boolean(c.resumeDownload.url);
  const heroImg = c.landing.heroImages?.[0] || c.about.photoUrl;

  const aboutBody = `<div class="spread">
    ${heroImg ? `<figure class="portrait"><img src="${esc(safeUrl(heroImg))}" alt=""/></figure>` : ""}
    <div class="lede">
      <p class="lede-line">${esc(c.about.bio)}</p>
      <p class="lede-sig">— ${esc(name)}</p>
    </div>
  </div>`;

  const projects = c.projects.filter((pr) => visible(p, "projects") !== false);
  const featured = new Set(c.featuredProjectIds ?? []);
  const lead = [...projects].sort((a, b) => Number(featured.has(b.id)) - Number(featured.has(a.id)))[0];
  const rest = projects.filter((pr) => pr !== lead);

  const leadHtml = lead
    ? `<figure class="lead-story">
        ${lead.images?.[0] ? `<div class="lead-cover" style="background-image:url('${esc(safeUrl(lead.images[0]))}')"></div>` : `<div class="lead-cover lead-cover-plain"><span>${esc(lead.title.slice(0, 1).toUpperCase())}</span></div>`}
        <figcaption>
          <span class="story-tag">${esc(lead.subtitle || "feature")}</span>
          <h3 class="story-title">${esc(lead.title)}</h3>
          <p class="story-desc">${esc(lead.description)}</p>
          ${(lead.techStack ?? []).length ? `<p class="story-tech">${esc((lead.techStack ?? []).slice(0, 5).join(" / "))}</p>` : ""}
          ${lead.url ? `<a class="story-link" href="${esc(safeUrl(lead.url))}" target="_blank" rel="noopener noreferrer">read the case study ↗</a>` : ""}
        </figcaption>
      </figure>`
    : "";

  const restHtml = rest
    .map((pr, i) => {
      const cover = pr.images?.[0]
        ? `<div class="story-cover" style="background-image:url('${esc(safeUrl(pr.images[0]))}')"></div>`
        : `<div class="story-cover story-cover-plain" style="--n:${i}"><span>${esc(pr.title.slice(0, 1).toUpperCase())}</span></div>`;
      return `<article class="story">
        ${cover}
        <div class="story-body">
          <span class="story-index">${String(i + 2).padStart(2, "0")}</span>
          <h3 class="story-title">${esc(pr.title)}</h3>
          ${pr.subtitle ? `<p class="story-sub">${esc(pr.subtitle)}</p>` : ""}
          <p class="story-desc">${esc(pr.description)}</p>
          ${pr.url ? `<a class="story-link" href="${esc(safeUrl(pr.url))}" target="_blank" rel="noopener noreferrer">read ↗</a>` : ""}
        </div>
      </article>`;
    })
    .join("");

  const timeline = c.experience
    .map((e) => {
      const bullets = (e.highlights ?? []).map((b) => `<li>${esc(b)}</li>`).join("");
      return `<div class="entry">
        <div class="entry-meta">${esc(period(e.start, e.end, e.current))}</div>
        <div class="entry-body">
          <h3 class="entry-role">${esc(e.role)}</h3>
          <p class="entry-org">${esc(e.company || "Independent")}</p>
          ${bullets ? `<ul class="entry-bullets">${bullets}</ul>` : e.description ? `<p class="entry-desc">${esc(e.description)}</p>` : ""}
        </div>
      </div>`;
    })
    .join("");

  const skillCols = c.skills
    .map(
      (g) =>
        `<div class="col">
          <h4 class="col-cat">${esc(g.category)}</h4>
          <p class="col-items">${esc(g.skills.join(", "))}</p>
        </div>`,
    )
    .join("");

  const eduList = c.education
    .map((e) => {
      const parts = [e.degree, e.field].filter(Boolean).join(", ");
      return `<li><div><strong>${esc(e.institution)}</strong>${parts ? `<br/><span class="meta">${esc(parts)}</span>` : ""}</div><span class="meta">${esc(period(e.start, e.end))}</span></li>`;
    })
    .join("");
  const credList = [
    ...c.certificates.map((x) => `<li><div><strong>${esc(x.name)}</strong>${x.issuer ? `<br/><span class="meta">${esc(x.issuer)}</span>` : ""}</div>${x.year ? `<span class="meta">${esc(x.year)}</span>` : ""}</li>`),
    ...c.awards.map((a) => `<li><div><strong>${esc(a.title)}</strong>${a.issuer ? `<br/><span class="meta">${esc(a.issuer)}</span>` : ""}</div>${a.year ? `<span class="meta">${esc(a.year)}</span>` : ""}</li>`),
  ].join("");
  const pubList = c.publications
    .map((pub) => `<li><div>${pub.url ? `<a class="story-link" href="${esc(safeUrl(pub.url))}" target="_blank" rel="noopener noreferrer">${esc(pub.title)}</a>` : `<strong>${esc(pub.title)}</strong>`}${pub.venue ? `<br/><span class="meta">${esc(pub.venue)}${pub.year ? ` · ${esc(pub.year)}` : ""}</span>` : ""}</div></li>`)
    .join("");

  const sections = `
    ${visible(p, "about") && c.about.bio ? issue("about", "01", "profile", "About", aboutBody) : ""}
    ${projects.length ? issue("work", "02", "selected stories", "The Work", `${leadHtml}${rest.length ? `<div class="stories">${restHtml}</div>` : ""}`) : ""}
    ${c.experience.length ? issue("experience", "03", "chronology", "Experience", `<div class="entries">${timeline}</div>`) : ""}
    ${c.skills.length ? issue("skills", "04", "capabilities", "Skills", `<div class="cols">${skillCols}</div>`) : ""}
    ${c.education.length ? issue("education", "05", "education", "Education", `<ul class="table">${eduList}</ul>`) : ""}
    ${credList ? issue("credentials", "06", "recognition", "Awards & Certifications", `<ul class="table">${credList}</ul>`) : ""}
    ${pubList ? issue("publications", "07", "writings", "Publications & Talks", `<ul class="table">${pubList}</ul>`) : ""}
    ${c.languages.length ? issue("languages", "08", "languages", "Languages", languagesMarkup(c.languages)) : ""}`;

  const closing = [
    c.contact.email ? `<a href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a>` : "",
    c.contact.phone ? `<a href="tel:${esc(c.contact.phone)}">${esc(c.contact.phone)}</a>` : "",
    c.contact.location ? `<span>${esc(c.contact.location)}</span>` : "",
    hasDownload ? `<a href="${esc(safeUrl(c.resumeDownload.url))}" target="_blank" rel="noopener noreferrer">Résumé ↗</a>` : "",
  ]
    .filter(Boolean)
    .join("");

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
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#FAF6EF;--ink:#16130E;--muted:#6A6255;--accent:#B3210E;--line:#D8CEC0}
*{box-sizing:border-box;margin:0}
html{scroll-behavior:smooth}
body{font-family:"Source Serif 4",Georgia,serif;background:var(--bg);color:var(--ink);line-height:1.75}
a{color:inherit}
.page{max-width:1180px;margin:0 auto;padding:0 28px}
.mono{font-family:"IBM Plex Mono",monospace}

/* ── masthead ── */
.masthead{border-bottom:3px double var(--ink);padding:22px 0 0}
.mast-top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.mast-top .l{font-family:"IBM Plex Mono",monospace}
.mast-top .r{text-align:right;font-family:"IBM Plex Mono",monospace}
.mast-title{text-align:center;font-family:Anton,sans-serif;font-size:clamp(2.2rem,7vw,4.4rem);letter-spacing:.02em;line-height:1;padding:10px 0 6px;text-transform:uppercase}
.mast-tagline{text-align:center;font-style:italic;font-size:.98rem;color:var(--muted);padding-bottom:16px}
.mast-rules{border-top:1px solid var(--ink);padding:10px 0;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;font-family:"IBM Plex Mono",monospace;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}

/* ── cover headline ── */
.cover{padding:54px 0 18px;text-align:center}
.cover-kicker{font-family:"IBM Plex Mono",monospace;font-size:.76rem;letter-spacing:.24em;text-transform:uppercase;color:var(--accent)}
.cover-name{font-family:Anton,sans-serif;font-size:clamp(3.6rem,13vw,9rem);line-height:.96;text-transform:uppercase;letter-spacing:.01em;margin-top:16px}
.cover-role{font-family:"Source Serif 4",serif;font-style:italic;font-size:clamp(1.2rem,3vw,1.7rem);color:var(--muted);margin-top:14px}
.cover-line{max-width:58ch;margin:16px auto 0;font-size:1.08rem;color:var(--ink)}
.cover-actions{margin-top:28px;display:flex;justify-content:center;gap:14px;flex-wrap:wrap}
.btn{font-family:"IBM Plex Mono",monospace;font-size:.78rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;padding:14px 30px;text-decoration:none;transition:all .2s;border:1.5px solid var(--ink)}
.btn-solid{background:var(--ink);color:var(--bg)}
.btn-solid:hover{background:var(--accent);border-color:var(--accent)}
.btn-ghost{border-color:var(--ink);color:var(--ink)}
.btn-ghost:hover{background:var(--ink);color:var(--bg)}
.cover .chips{margin-top:26px;justify-content:center}
.chips{display:flex;flex-wrap:wrap;gap:10px}
.chip{font-family:"IBM Plex Mono",monospace;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);border:1px solid var(--line);padding:7px 14px;text-decoration:none;transition:all .2s}
.chip:hover{color:var(--accent);border-color:var(--accent)}

/* ── issue sections ── */
.issue{border-top:1px solid var(--line);padding:60px 0}
.issue-kicker{display:flex;gap:18px;align-items:baseline;font-family:"IBM Plex Mono",monospace;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase}
.issue-no{color:var(--accent)}
.issue-label{color:var(--muted)}
.issue-title{font-family:Anton,sans-serif;font-size:clamp(2rem,5.4vw,3.4rem);text-transform:uppercase;letter-spacing:.01em;margin:14px 0 34px;line-height:1}
.issue-body{}

/* ── about spread ── */
.spread{display:grid;grid-template-columns:1fr;gap:34px}
@media(min-width:820px){.spread{grid-template-columns:320px 1fr;align-items:center}}
.portrait{margin:0}
.portrait img{width:100%;aspect-ratio:3/4;object-fit:cover;filter:grayscale(.1)}
.lede-line{font-size:clamp(1.3rem,3vw,1.8rem);line-height:1.5;font-weight:600}
.lede-sig{font-style:italic;color:var(--muted);margin-top:18px}

/* ── stories ── */
.lead-story{margin-bottom:44px}
.lead-cover{aspect-ratio:16/7;background-size:cover;background-position:center}
.lead-cover-plain{background:#E7DDCB;display:grid;place-items:center}
.lead-cover-plain span{font-family:Anton,sans-serif;font-size:8rem;color:var(--accent)}
.lead-story figcaption{padding:18px 0 0;max-width:76ch}
.story-tag{font-family:"IBM Plex Mono",monospace;font-size:.68rem;letter-spacing:.2em;text-transform:uppercase;color:var(--accent)}
.story-title{font-family:Anton,sans-serif;font-size:clamp(1.6rem,3.6vw,2.4rem);text-transform:uppercase;line-height:1.05;margin-top:8px}
.story-sub{font-style:italic;color:var(--muted);margin-top:8px}
.story-desc{color:var(--ink);margin-top:12px}
.story-tech{font-family:"IBM Plex Mono",monospace;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:12px}
.story-link{display:inline-block;font-family:"IBM Plex Mono",monospace;font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);text-decoration:none;margin-top:14px;border-bottom:1px solid var(--accent);padding-bottom:2px}
.story-link:hover{color:var(--ink);border-color:var(--ink)}
.stories{columns:2;column-gap:36px}
@media(max-width:640px){.stories{columns:1}}
.story{break-inside:avoid;margin:0 0 38px}
.story-cover{aspect-ratio:4/3;background-size:cover;background-position:center}
.story-cover-plain{background:linear-gradient(150deg,hsl(calc(var(--n)*53) 55% 82%),hsl(calc(var(--n)*53 + 50) 60% 74%));display:grid;place-items:center}
.story-cover-plain span{font-family:Anton,sans-serif;font-size:4rem;color:var(--ink)}
.story-body{padding-top:12px}
.story-index{font-family:"IBM Plex Mono",monospace;font-size:.68rem;color:var(--accent);letter-spacing:.12em}
.story-body .story-title{font-size:clamp(1.3rem,2.6vw,1.8rem)}

/* ── experience ── */
.entries{display:grid;gap:0}
.entry{display:grid;grid-template-columns:1fr;gap:8px;padding:26px 0;border-top:1px solid var(--line)}
@media(min-width:720px){.entry{grid-template-columns:170px 1fr;gap:30px}}
.entry-meta{font-family:"IBM Plex Mono",monospace;font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);padding-top:4px}
.entry-role{font-family:Anton,sans-serif;font-size:1.4rem;text-transform:uppercase;letter-spacing:.01em;line-height:1.1}
.entry-org{font-style:italic;color:var(--muted);margin-top:4px}
.entry-bullets{margin:12px 0 0;padding-left:20px;font-size:.98rem}
.entry-bullets li{margin-bottom:6px}
.entry-desc{color:var(--muted);margin-top:10px;font-size:.98rem}

/* ── skills columns ── */
.cols{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:30px}
.col-cat{font-family:"IBM Plex Mono",monospace;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);padding-bottom:8px;border-bottom:1px solid var(--line)}
.col-items{font-size:1rem;margin-top:12px}

/* ── tables (education / creds / pubs) ── */
.table{list-style:none}
.table li{display:flex;justify-content:space-between;align-items:baseline;gap:18px;padding:16px 0;border-top:1px solid var(--line);font-size:.98rem;flex-wrap:wrap}
.table li:first-child{border-top:none}
.table li strong{font-weight:600}
.table a{color:var(--accent);text-decoration:none}
.table a:hover{text-decoration:underline}
.meta{font-family:"IBM Plex Mono",monospace;font-size:.72rem;letter-spacing:.04em;color:var(--muted);text-transform:uppercase}

/* ── languages ── */
.languages{display:flex;flex-wrap:wrap;gap:10px}
.lang{font-family:"IBM Plex Mono",monospace;font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;border:1px solid var(--line);padding:9px 16px}

/* ── colophon ── */
.colophon{border-top:3px double var(--ink);padding:56px 0 40px;text-align:center}
.colophon h2{font-family:Anton,sans-serif;font-size:clamp(2rem,5.6vw,3.6rem);text-transform:uppercase;line-height:1}
.colophon .contact-links{display:flex;justify-content:center;gap:22px;flex-wrap:wrap;margin-top:24px;font-family:"IBM Plex Mono",monospace;font-size:.8rem;letter-spacing:.06em;text-transform:uppercase}
.colophon .contact-links a{color:var(--accent);text-decoration:none}
.colophon .contact-links a:hover{color:var(--ink)}
.colophon .contact-links span{color:var(--muted)}

footer{border-top:1px solid var(--line)}
.footer-inner{max-width:1180px;margin:0 auto;padding:26px 28px;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;color:var(--muted);font-family:"IBM Plex Mono",monospace;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase}
.footer-inner a:hover{color:var(--accent)}
${REVEAL_CSS}
${PRINT_CSS}
</style>
</head>
<body>
<header class="masthead">
  <div class="page">
    <div class="mast-top">
      <span class="l">the portfolio of</span>
      <span class="r">est. ${new Date().getFullYear()}</span>
    </div>
    <div class="mast-title">Portfolio</div>
    <p class="mast-tagline">${esc(c.landing.tagline)}</p>
    <div class="mast-rules">
      <span>issue no. 01</span>
      <span>${esc(c.landing.headline)}</span>
      <span>${esc(c.contact.location || role)}</span>
    </div>
  </div>
</header>
<div class="cover rv">
  <div class="page">
    <p class="cover-kicker">${esc(role)}</p>
    <h1 class="cover-name">${esc(name)}</h1>
    <p class="cover-role">${esc(c.landing.headline)}</p>
    <p class="cover-line">${esc(c.landing.tagline)}</p>
    <div class="cover-actions">
      ${c.contact.email ? `<a class="btn btn-solid" href="mailto:${esc(c.contact.email)}">Get in touch</a>` : ""}
      ${hasDownload ? `<a class="btn btn-ghost" href="${esc(safeUrl(c.resumeDownload.url))}" target="_blank" rel="noopener noreferrer">Download résumé</a>` : ""}
    </div>
    ${socialChips(c.socialLinks)}
  </div>
</div>
<main class="page">${sections}</main>
${visible(p, "contact") ? `<div class="colophon rv">
  <div class="page">
    <h2>Next story<br/>starts with you.</h2>
    <div class="contact-links">${closing}</div>
  </div>
</div>` : ""}
<footer>
  <div class="footer-inner">
    <span>© ${new Date().getFullYear()} ${esc(name)}</span>
    <a href="https://portsume.app" style="text-decoration:none">printed with portsume</a>
  </div>
</footer>
${REVEAL_JS}
</body>
</html>`;
}
