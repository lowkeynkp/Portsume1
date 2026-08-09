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
    <h2 class="sec-title">${esc(title)}</h2>
    ${body}
  </section>`;
}

export function renderExecutive(p: Portfolio): string {
  const c = p.content;
  const name = c.about.name || "Your Name";
  const role = c.about.role || "Professional";
  const hasDownload = Boolean(c.resumeDownload.url);
  const yrs = c.experience.length;
  const projCount = c.projects.length;
  const skillsCount = c.skills.reduce((n, g) => n + g.skills.length, 0);
  const stats = [
    yrs ? { n: String(yrs).padStart(2, "0"), l: "Roles" } : null,
    projCount ? { n: String(projCount).padStart(2, "0"), l: "Projects" } : null,
    skillsCount ? { n: String(skillsCount).padStart(2, "0"), l: "Skills" } : null,
    c.publications.length ? { n: String(c.publications.length).padStart(2, "0"), l: "Publications" } : null,
  ].filter((s): s is { n: string; l: string } => Boolean(s));
  const statsHtml = stats.length
    ? `<div class="stats">${stats.map((s) => `<div class="stat"><span class="stat-n">${s.n}</span><span class="stat-l">${s.l}</span></div>`).join("")}</div>`
    : "";

  const asideRows = [
    c.contact.email ? `<li><span class="k">Email</span><a href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a></li>` : "",
    c.contact.phone ? `<li><span class="k">Phone</span><a href="tel:${esc(c.contact.phone)}">${esc(c.contact.phone)}</a></li>` : "",
    c.contact.location ? `<li><span class="k">Location</span><span>${esc(c.contact.location)}</span></li>` : "",
    c.contact.availableForWork ? `<li><span class="k">Status</span><span class="avail"><i></i> Open to work</span></li>` : "",
    hasDownload ? `<li><span class="k">Résumé</span><a href="${esc(safeUrl(c.resumeDownload.url))}" target="_blank" rel="noopener noreferrer">Download PDF ↗</a></li>` : "",
  ]
    .filter(Boolean)
    .join("");

  const experienceHtml = c.experience
    .map((e) => {
      const bullets = (e.highlights ?? []).map((b) => `<li>${esc(b)}</li>`).join("");
      return `<div class="job">
        <div class="job-head">
          <div>
            <h3 class="job-role">${esc(e.role)}</h3>
            <p class="job-org">${esc(e.company || "Independent")}${e.location ? ` · ${esc(e.location)}` : ""}</p>
          </div>
          <span class="job-years">${esc(period(e.start, e.end, e.current))}</span>
        </div>
        ${bullets ? `<ul class="job-bullets">${bullets}</ul>` : e.description ? `<p class="job-desc">${esc(e.description)}</p>` : ""}
      </div>`;
    })
    .join("");

  const projectsHtml = c.projects
    .map((pr) => {
      const tech = (pr.techStack ?? []).slice(0, 5).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
      return `<a class="card" href="${esc(safeUrl(pr.url ?? "#"))}" target="${pr.url ? "_blank" : "_self"}" rel="noopener noreferrer">
        <div class="card-top">
          <h3 class="card-title">${esc(pr.title)}</h3>
          ${pr.url ? `<span class="card-arrow">↗</span>` : ""}
        </div>
        ${pr.subtitle ? `<p class="card-sub">${esc(pr.subtitle)}</p>` : ""}
        <p class="card-desc">${esc(pr.description)}</p>
        ${tech ? `<div class="tags">${tech}</div>` : ""}
      </a>`;
    })
    .join("");

  const certHtml = c.certificates
    .map((x) => `<li><strong>${esc(x.name)}</strong>${x.issuer ? ` — ${esc(x.issuer)}` : ""}${x.year ? `<span class="yr">${esc(x.year)}</span>` : ""}</li>`)
    .join("");
  const awardHtml = c.awards
    .map((a) => `<li><strong>${esc(a.title)}</strong>${a.issuer ? ` — ${esc(a.issuer)}` : ""}${a.year ? `<span class="yr">${esc(a.year)}</span>` : ""}${a.description ? `<small>${esc(a.description)}</small>` : ""}</li>`)
    .join("");
  const pubHtml = c.publications
    .map((pub) => `<li>${pub.url ? `<a class="plink" href="${esc(safeUrl(pub.url))}" target="_blank" rel="noopener noreferrer">${esc(pub.title)}</a>` : `<strong>${esc(pub.title)}</strong>`}${pub.venue ? `<span class="pmeta">${esc(pub.venue)}${pub.year ? ` · ${esc(pub.year)}` : ""}</span>` : ""}</li>`)
    .join("");

  const eduAside = c.education
    .map((e) => {
      const parts = [e.degree, e.field].filter(Boolean).join(" · ");
      return `<div class="edu">
        <h3 class="edu-school">${esc(e.institution)}</h3>
        <p class="edu-degree">${esc(parts || "—")}</p>
        ${e.end ? `<span class="edu-years">${esc(period(e.start, e.end))}</span>` : ""}
      </div>`;
    })
    .join("");

  const mainSections = `
    ${visible(p, "about") && c.about.bio ? section("about", "Professional Summary", `<p class="bio">${esc(c.about.bio)}</p>`) : ""}
    ${c.experience.length ? section("experience", "Experience", `<div class="jobs">${experienceHtml}</div>`) : ""}
    ${c.projects.length ? section("projects", "Projects", `<div class="cards">${projectsHtml}</div>`) : ""}
    ${certHtml ? section("certifications", "Certifications", `<ul class="list">${certHtml}</ul>`) : ""}
    ${awardHtml ? section("awards", "Awards & Recognition", `<ul class="list">${awardHtml}</ul>`) : ""}
    ${pubHtml ? section("publications", "Publications & Speaking", `<ul class="list">${pubHtml}</ul>`) : ""}`;

  const asideSections = `
    ${c.skills.length ? section("skills", "Skills", skillGroupsMarkup(c.skills)) : ""}
    ${c.education.length ? section("education", "Education", eduAside) : ""}
    ${c.languages.length ? section("languages", "Languages", languagesMarkup(c.languages)) : ""}`;

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
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#FFFFFF;--paper:#F4F6F8;--ink:#16233B;--muted:#55627A;--accent:#0F5E7E;--accent-soft:#E4EEF3;--line:#DDE3EA}
*{box-sizing:border-box;margin:0}
html{scroll-behavior:smooth}
body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.7}
a{color:inherit}
.page{max-width:1120px;margin:0 auto;padding:0 24px}

/* ── masthead ── */
.masthead{background:linear-gradient(180deg,#F7FAFC,var(--bg));border-bottom:1px solid var(--line);padding:70px 0 54px}
.mast-inner{display:flex;justify-content:space-between;align-items:flex-end;gap:28px;flex-wrap:wrap}
.name-role .kicker{font-size:.74rem;font-weight:700;letter-spacing:.26em;text-transform:uppercase;color:var(--accent)}
.name-role h1{font-family:Lora,Georgia,serif;font-weight:600;font-size:clamp(2.4rem,6vw,3.8rem);line-height:1.06;letter-spacing:-.01em;margin-top:10px}
.name-role .headline{margin-top:14px;max-width:52ch;color:var(--muted);font-size:1.08rem;font-weight:500}
.name-role .tagline{margin-top:6px;max-width:52ch;color:var(--muted);font-size:.96rem}
.stats{display:flex;gap:26px}
.stat{text-align:center}
.stat-n{display:block;font-family:Lora,Georgia,serif;font-size:2rem;font-weight:600;color:var(--accent);line-height:1}
.stat-l{font-size:.68rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-top:6px}

/* ── layout ── */
.layout{display:grid;grid-template-columns:1fr;gap:0}
@media(min-width:880px){.layout{grid-template-columns:300px 1fr}}
aside.side{background:var(--paper);padding:44px 30px;border-right:1px solid var(--line)}
main.main{padding:44px 38px;min-width:0}
.contact-list{list-style:none;display:grid;gap:18px}
.contact-list li .k{display:block;font-size:.64rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.contact-list a{color:var(--accent);text-decoration:none;font-size:.95rem;font-weight:500;word-break:break-word}
.contact-list a:hover{text-decoration:underline}
.avail{display:inline-flex;align-items:center;gap:8px;font-size:.9rem;font-weight:600;color:var(--accent)}
.avail i{width:9px;height:9px;border-radius:50%;background:#1E9E5A;box-shadow:0 0 0 4px rgba(30,158,90,.18)}
.chips{margin-top:18px;display:flex;flex-wrap:wrap;gap:8px}
.chip{font-size:.78rem;font-weight:600;color:var(--muted);border:1px solid var(--line);border-radius:100px;padding:6px 12px;text-decoration:none;background:#fff}
.chip:hover{color:var(--accent);border-color:var(--accent)}

/* ── sections ── */
.section{padding:40px 0;border-top:1px solid var(--line)}
.section:first-child{border-top:none}
.sec-title{font-family:Lora,Georgia,serif;font-size:1.5rem;font-weight:600;margin-bottom:26px;padding-bottom:12px;border-bottom:2px solid var(--accent);display:inline-block}
.bio{max-width:68ch;font-size:1.05rem;color:var(--ink)}

/* ── experience ── */
.jobs{display:grid;gap:0}
.job{padding:24px 0;border-top:1px solid var(--line)}
.job:first-child{border-top:none;padding-top:0}
.job-head{display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap}
.job-role{font-family:Lora,Georgia,serif;font-size:1.22rem;font-weight:600}
.job-org{color:var(--accent);font-weight:600;font-size:.92rem;margin-top:2px}
.job-years{font-size:.78rem;font-weight:600;color:var(--muted);white-space:nowrap;background:var(--accent-soft);border-radius:100px;padding:5px 12px}
.job-bullets{margin:12px 0 0;padding-left:20px;color:#3A4760;font-size:.97rem}
.job-bullets li{margin-bottom:6px}
.job-desc{color:var(--muted);margin-top:10px;font-size:.97rem}

/* ── projects ── */
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
.card{display:block;text-decoration:none;border:1px solid var(--line);border-radius:14px;padding:20px 22px;background:var(--bg);transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s,border-color .25s}
.card:hover{transform:translateY(-4px);box-shadow:0 18px 36px -20px rgba(22,35,59,.35);border-color:var(--accent)}
.card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.card-title{font-family:Lora,Georgia,serif;font-size:1.14rem;font-weight:600}
.card-arrow{color:var(--accent);font-size:1.1rem}
.card-sub{color:var(--accent);font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-top:6px}
.card-desc{color:var(--muted);font-size:.92rem;margin-top:10px}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.tag{font-size:.72rem;font-weight:600;color:var(--accent);background:var(--accent-soft);border-radius:100px;padding:4px 10px}

/* ── skills ── */
.skills{display:grid;grid-template-columns:1fr;gap:20px}
.skill-group{}
.skill-cat{display:block;font-size:.74rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.skill-list{display:flex;flex-wrap:wrap;gap:8px}
.skill{font-size:.84rem;font-weight:500;border:1px solid var(--line);border-radius:8px;padding:6px 12px;color:#3A4760;background:#fff}

/* ── education (aside) ── */
.edu{padding:14px 0;border-top:1px solid var(--line)}
.edu:first-child{border-top:none;padding-top:0}
.edu-school{font-family:Lora,Georgia,serif;font-size:1.02rem;font-weight:600}
.edu-degree{color:var(--muted);font-size:.9rem;margin-top:4px}
.edu-years{font-size:.76rem;font-weight:600;color:var(--accent);display:inline-block;margin-top:6px}

/* ── lists (certs/awards/pubs) ── */
.list{list-style:none}
.list li{position:relative;padding:14px 0 14px 26px;border-top:1px solid var(--line);font-size:.95rem;color:#3A4760}
.list li:first-child{border-top:none}
.list li::before{content:"▹";position:absolute;left:4px;color:var(--accent);font-size:.95rem}
.list li strong{font-weight:600}
.list li small{display:block;color:var(--muted);margin-top:4px}
.yr{float:right;font-size:.78rem;font-weight:600;color:var(--muted)}
.plink{color:var(--accent);text-decoration:none;font-weight:600}
.plink:hover{text-decoration:underline}
.pmeta{display:block;color:var(--muted);font-size:.85rem;margin-top:3px}

/* ── languages ── */
.languages{display:flex;flex-wrap:wrap;gap:8px}
.lang{font-size:.86rem;border:1px solid var(--line);border-radius:8px;padding:8px 14px;background:#fff;color:#3A4760}

/* ── contact footer ── */
.closing{padding:70px 0;text-align:center}
.closing h2{font-family:Lora,Georgia,serif;font-size:clamp(1.9rem,4.6vw,3rem);font-weight:600}
.closing p{color:var(--muted);margin-top:12px}
.btn{display:inline-block;margin-top:24px;font-size:.9rem;font-weight:700;padding:14px 32px;border-radius:100px;background:var(--accent);color:#fff;text-decoration:none;transition:transform .2s,background .2s}
.btn:hover{transform:translateY(-2px);background:#0B4A63}

footer{border-top:1px solid var(--line)}
.footer-inner{max-width:1120px;margin:0 auto;padding:30px 24px;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:.82rem}
.footer-inner a:hover{color:var(--accent)}
${REVEAL_CSS}
${PRINT_CSS}
</style>
</head>
<body>
<header class="masthead">
  <div class="page mast-inner rv">
    <div class="name-role">
      <p class="kicker">${esc(role)}</p>
      <h1>${esc(name)}</h1>
      <p class="headline">${esc(c.landing.headline)}</p>
      <p class="tagline">${esc(c.landing.tagline)}</p>
    </div>
    ${statsHtml}
  </div>
</header>
<div class="layout">
  <aside class="side">
    ${visible(p, "contact") ? `<section class="section rv"><h2 class="sec-title">Contact</h2><ul class="contact-list">${asideRows}</ul>${socialChips(c.socialLinks)}</section>` : ""}
    ${asideSections}
  </aside>
  <main class="main">${mainSections}</main>
</div>
${visible(p, "contact") ? `<div class="closing rv">
  <div class="page">
    <h2>Let's work together.</h2>
    <p>${c.contact.availableForWork ? "Currently available for new opportunities." : "Always happy to connect."}</p>
    ${c.contact.email ? `<a class="btn" href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a>` : ""}
  </div>
</div>` : ""}
<footer>
  <div class="footer-inner">
    <span>© ${new Date().getFullYear()} ${esc(name)}</span>
    <a href="https://portsume.app" style="text-decoration:none">built with portsume</a>
  </div>
</footer>
${REVEAL_JS}
</body>
</html>`;
}
