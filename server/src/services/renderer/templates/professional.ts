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
    <div class="sec-head"><span class="sec-num">${esc(String(id).padStart(2, "0"))}</span><h2 class="sec-title">${esc(title)}</h2><span class="sec-rule"></span></div>
    ${body}
  </section>`;
}

export function renderProfessional(p: Portfolio): string {
  const c = p.content;
  const name = c.about.name || "Your Name";
  const role = c.about.role || "Professional";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

  const hasDownload = Boolean(c.resumeDownload.url);

  const skillsHtml = c.skills.length ? section("skills", "Core Competencies", skillGroupsMarkup(c.skills)) : "";

  const experienceHtml = c.experience
    .map((e) => {
      const bullets = (e.highlights ?? []).map((b) => `<li>${esc(b)}</li>`).join("");
      return `<div class="role">
        <div class="role-row">
          <div>
            <h3 class="role-title">${esc(e.role)}</h3>
            <p class="role-org">${esc(e.company || "Independent")}</p>
          </div>
          <span class="role-years">${esc(period(e.start, e.end, e.current))}</span>
        </div>
        ${bullets ? `<ul class="role-bullets">${bullets}</ul>` : e.description ? `<p class="role-desc">${esc(e.description)}</p>` : ""}
      </div>`;
    })
    .join("");

  const eduHtml = c.education
    .map((e) => {
      const parts = [e.degree, e.field].filter(Boolean).join(" · ");
      return `<div class="edu">
        <div>
          <h3 class="edu-school">${esc(e.institution)}</h3>
          <p class="edu-degree">${esc(parts || "—")}</p>
        </div>
        ${e.end ? `<span class="role-years">${esc(period(e.start, e.end))}</span>` : ""}
      </div>`;
    })
    .join("");

  const certHtml = c.certificates
    .map((x) => `<li class="cert"><strong>${esc(x.name)}</strong>${x.issuer ? ` — ${esc(x.issuer)}` : ""}${x.year ? ` · ${esc(x.year)}` : ""}</li>`)
    .join("");
  const awardHtml = c.awards
    .map((a) => `<li class="cert"><strong>${esc(a.title)}</strong>${a.issuer ? ` — ${esc(a.issuer)}` : ""}${a.year ? ` · ${esc(a.year)}` : ""}</li>`)
    .join("");

  const pubHtml = c.publications
    .map((pub) => `<li class="cert">${pub.url ? `<a class="publink" href="${esc(safeUrl(pub.url))}" target="_blank" rel="noopener noreferrer">${esc(pub.title)}</a>` : `<strong>${esc(pub.title)}</strong>`}${pub.venue ? ` — ${esc(pub.venue)}${pub.year ? ` (${esc(pub.year)})` : ""}` : ""}</li>`)
    .join("");

  const projectsHtml = c.projects
    .map((pr) => {
      const img = pr.images?.[0];
      const cover = img
        ? `<div class="pcover" style="background-image:url('${esc(safeUrl(img))}')"></div>`
        : `<div class="pcover pcover-plain"><span class="pcover-monogram">${esc(pr.title.charAt(0).toUpperCase())}</span></div>`;
      const tech = (pr.techStack ?? []).slice(0, 5).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
      return `<a class="pcard" href="${esc(safeUrl(pr.url ?? "#"))}" target="${pr.url ? "_blank" : "_self"}" rel="noopener noreferrer">
        ${cover}
        <div class="pbody">
          <h3 class="ptitle">${esc(pr.title)}</h3>
          ${pr.subtitle ? `<p class="psub">${esc(pr.subtitle)}</p>` : ""}
          <p class="pdesc">${esc(pr.description)}</p>
          ${tech ? `<div class="tags">${tech}</div>` : ""}
        </div>
      </a>`;
    })
    .join("");

  const contactRows = [
    c.contact.email ? `<li><span class="c-icon">✉</span><a href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a></li>` : "",
    c.contact.phone ? `<li><span class="c-icon">✆</span><a href="tel:${esc(c.contact.phone)}">${esc(c.contact.phone)}</a></li>` : "",
    c.contact.location ? `<li><span class="c-icon">◎</span>${esc(c.contact.location)}</li>` : "",
    hasDownload ? `<li><span class="c-icon">↧</span><a href="${esc(safeUrl(c.resumeDownload.url))}" target="_blank" rel="noopener noreferrer">Download Resume</a></li>` : "",
  ]
    .filter(Boolean)
    .join("");

  const sections = `
    ${visible(p, "about") && c.about.bio ? section("about", "About", `<p class="bio">${esc(c.about.bio)}</p>`) : ""}
    ${c.experience.length ? section("experience", "Experience", experienceHtml) : ""}
    ${projectsHtml ? section("work", "Selected Work", `<div class="pgrid">${projectsHtml}</div>`) : ""}
    ${skillsHtml}
    ${c.education.length ? section("education", "Education", `<div class="edus">${eduHtml}</div>`) : ""}
    ${certHtml ? section("credentials", "Certifications & Awards", `<ul class="certs">${certHtml}${awardHtml}</ul>`) : awardHtml ? section("credentials", "Awards", `<ul class="certs">${awardHtml}</ul>`) : ""}
    ${pubHtml ? section("publications", "Publications & Speaking", `<ul class="certs">${pubHtml}</ul>`) : ""}
    ${c.languages.length ? section("languages", "Languages", languagesMarkup(c.languages)) : ""}
    ${visible(p, "contact") ? section("contact", "Contact", `<ul class="contacts">${contactRows}</ul>`) : ""}`;

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
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#FFFFFF;--paper:#FAFAF7;--ink:#1C2B4B;--muted:#5A6A85;--accent:#4A7E8E;--accent-soft:#E8F0F2;--line:#E4E7EC}
*{box-sizing:border-box;margin:0}
html{scroll-behavior:smooth}
body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.7}
a{color:inherit}
.wrap{max-width:1000px;margin:0 auto;padding:0 32px}

/* ── hero ── */
.hero{padding:110px 0 70px;text-align:center;position:relative}
.monogram{width:74px;height:74px;border-radius:50%;background:var(--accent);color:#fff;display:grid;place-items:center;font-family:"Source Serif 4",serif;font-size:1.7rem;font-weight:600;margin:0 auto 26px;letter-spacing:.02em}
.kicker{font-size:.78rem;text-transform:uppercase;letter-spacing:.28em;color:var(--accent);font-weight:600}
.display{font-family:"Source Serif 4",serif;font-size:clamp(2.6rem,6.5vw,4.2rem);line-height:1.08;font-weight:600;margin-top:14px;letter-spacing:-.01em}
.statement{margin:22px auto 0;max-width:52ch;font-size:clamp(1.08rem,2.4vw,1.32rem);color:var(--ink);font-weight:500}
.lede{margin:14px auto 0;max-width:56ch;color:var(--muted);font-size:1rem}
.hero-actions{margin-top:30px;display:flex;justify-content:center;gap:14px;flex-wrap:wrap}
.btn{font-size:.88rem;font-weight:600;padding:12px 26px;border-radius:100px;text-decoration:none;transition:all .2s;border:1.5px solid var(--accent)}
.btn-solid{background:var(--accent);color:#fff}
.btn-solid:hover{background:#3D6A78}
.btn-ghost{color:var(--accent)}
.btn-ghost:hover{background:var(--accent-soft)}
.chips{margin-top:26px;display:flex;justify-content:center;flex-wrap:wrap;gap:10px}
.chip{font-size:.8rem;color:var(--muted);border:1px solid var(--line);border-radius:100px;padding:6px 14px;text-decoration:none;transition:all .2s}
.chip:hover{color:var(--accent);border-color:var(--accent)}

/* ── sections ── */
.section{padding:64px 0;border-top:1px solid var(--line)}
.sec-head{display:flex;align-items:center;gap:16px;margin-bottom:34px}
.sec-num{font-family:"Source Serif 4",serif;font-size:.95rem;color:var(--accent);font-weight:600}
.sec-title{font-family:"Source Serif 4",serif;font-size:1.7rem;font-weight:600;letter-spacing:-.01em}
.sec-rule{flex:1;height:1px;background:var(--line)}

.bio{max-width:64ch;font-size:1.1rem;color:var(--ink)}

/* ── experience ── */
.role{padding:6px 0 34px}
.role-row{display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap}
.role-title{font-family:"Source Serif 4",serif;font-size:1.3rem;font-weight:600}
.role-org{color:var(--accent);font-weight:600;font-size:.95rem;margin-top:2px}
.role-years{font-size:.82rem;color:var(--muted);font-family:ui-monospace,monospace;white-space:nowrap}
.role-bullets{margin:12px 0 0;padding-left:20px;color:#33415E;font-size:.98rem}
.role-bullets li{margin-bottom:6px}
.role-desc{color:var(--muted);margin-top:10px;font-size:.98rem}

/* ── projects ── */
.pgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:26px}
.pcard{display:block;text-decoration:none;border-radius:14px;overflow:hidden;border:1px solid var(--line);background:var(--paper);transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s}
.pcard:hover{transform:translateY(-4px);box-shadow:0 16px 40px -18px rgba(28,43,75,.35)}
.pcover{aspect-ratio:16/10;background-size:cover;background-position:center}
.pcover-plain{background:linear-gradient(135deg,var(--accent-soft),#F5EADF);display:grid;place-items:center}
.pcover-monogram{font-family:"Source Serif 4",serif;font-size:3.4rem;color:var(--accent);font-weight:600}
.pbody{padding:22px}
.ptitle{font-family:"Source Serif 4",serif;font-size:1.2rem;font-weight:600}
.psub{color:var(--accent);font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-top:5px}
.pdesc{color:var(--muted);font-size:.92rem;margin-top:10px}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.tag{font-size:.72rem;color:var(--accent);background:var(--accent-soft);border-radius:100px;padding:4px 10px;font-weight:600}

/* ── skills ── */
.skills{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:30px}
.skill-group{border-left:3px solid var(--accent);padding-left:18px}
.skill-cat{font-family:"Source Serif 4",serif;font-size:1.05rem;font-weight:600}
.skill-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.skill{font-size:.82rem;border:1px solid var(--line);border-radius:100px;padding:5px 13px;color:#33415E}

/* ── education ── */
.edu{display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap;padding:18px 0;border-top:1px solid var(--line)}
.edu:first-child{border-top:none}
.edu-school{font-family:"Source Serif 4",serif;font-size:1.12rem;font-weight:600}
.edu-degree{color:var(--muted);font-size:.92rem;margin-top:3px}

/* ── certs / awards / publications ── */
.certs{list-style:none}
.cert{display:flex;gap:10px;padding:13px 0;border-top:1px solid var(--line);font-size:.96rem;color:#33415E}
.cert:first-child{border-top:none}
.cert::before{content:"◆";color:var(--accent);font-size:.7rem;margin-top:6px}
.publink{color:var(--accent);text-decoration:none}
.publink:hover{text-decoration:underline}

/* ── languages ── */
.languages{display:flex;flex-wrap:wrap;gap:10px}
.lang{font-size:.88rem;border:1px solid var(--line);border-radius:8px;padding:9px 16px;color:#33415E;background:var(--paper)}

/* ── contact ── */
.contacts{list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.contacts li{display:flex;align-items:center;gap:12px;border:1px solid var(--line);border-radius:12px;padding:16px 18px;font-size:.94rem}
.contacts a{color:var(--ink);text-decoration:none}
.contacts a:hover{color:var(--accent)}
.c-icon{color:var(--accent);font-weight:700}

footer{border-top:1px solid var(--line);margin-top:40px}
.footer-inner{max-width:1000px;margin:0 auto;padding:34px 32px;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:.82rem}
${REVEAL_CSS}
${PRINT_CSS}
</style>
</head>
<body>
<header class="hero">
  <div class="wrap rv">
    <div class="monogram">${esc(initials)}</div>
    <p class="kicker">${esc(role)}</p>
    <h1 class="display">${esc(name)}</h1>
    <p class="statement">${esc(c.landing.headline)}</p>
    <p class="lede">${esc(c.landing.tagline)}</p>
    <div class="hero-actions">
      ${c.contact.email ? `<a class="btn btn-solid" href="mailto:${esc(c.contact.email)}">Let's Connect</a>` : ""}
      ${hasDownload ? `<a class="btn btn-ghost" href="${esc(safeUrl(c.resumeDownload.url))}" target="_blank" rel="noopener noreferrer">Download Résumé</a>` : ""}
    </div>
    ${socialChips(c.socialLinks)}
  </div>
</header>
<main class="wrap">${sections}</main>
<footer>
  <div class="footer-inner">
    <span>© ${new Date().getFullYear()} ${esc(name)}</span>
    <span>${esc(c.contact.email || role)}</span>
    <a href="https://portsume.app" style="color:inherit;text-decoration:none">built with portsume</a>
  </div>
</footer>
${REVEAL_JS}
</body>
</html>`;
}
