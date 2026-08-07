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
    <h2 class="sec-title"><span class="squiggle">✦</span> ${esc(title)}</h2>
    ${body}
  </section>`;
}

export function renderCreative(p: Portfolio): string {
  const c = p.content;
  const name = c.about.name || "Your Name";
  const role = c.about.role || "Creative";
  const hasDownload = Boolean(c.resumeDownload.url);

  const chips = c.skills.map((s) => `<span class="chip">${esc(s.category)}</span>`).join("");

  const projectsHtml = c.projects
    .map((pr, i) => {
      const img = pr.images?.[0];
      const cover = img
        ? `<div class="pcover" style="background-image:url('${esc(safeUrl(img))}')"></div>`
        : `<div class="pcover pcover-plain" style="--t:${i}"><span class="pcover-glyph">✦${i + 1}</span></div>`;
      const tech = (pr.techStack ?? []).slice(0, 5).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
      return `<article class="pcard" style="--t:${i}">
        ${cover}
        <div class="pbody">
          <h3 class="ptitle">${esc(pr.title)}</h3>
          ${pr.subtitle ? `<p class="psub">${esc(pr.subtitle)}</p>` : ""}
          <p class="pdesc">${esc(pr.description)}</p>
          ${tech ? `<div class="tags">${tech}</div>` : ""}
          ${pr.url ? `<a class="plink" href="${esc(safeUrl(pr.url))}" target="_blank" rel="noopener noreferrer">view case study →</a>` : ""}
        </div>
      </article>`;
    })
    .join("");

  const timeline = c.experience
    .map((e) => {
      const bullets = (e.highlights ?? []).map((b) => `<li>${esc(b)}</li>`).join("");
      return `<div class="tl">
        <div class="tl-bubble">${esc((e.company || e.role).charAt(0).toUpperCase())}</div>
        <div class="tl-body">
          <p class="tl-years">${esc(period(e.start, e.end, e.current))}</p>
          <h3 class="tl-role">${esc(e.role)}</h3>
          <p class="tl-org">${esc(e.company || "Independent")}</p>
          ${bullets ? `<ul class="tl-bullets">${bullets}</ul>` : e.description ? `<p class="tl-desc">${esc(e.description)}</p>` : ""}
        </div>
      </div>`;
    })
    .join("");

  const eduHtml = c.education
    .map((e) => {
      const parts = [e.degree, e.field].filter(Boolean).join(", ");
      return `<div class="edu">
        <h3>${esc(e.institution)}</h3>
        <p>${esc(parts || "—")}</p>
        ${e.end ? `<span class="eduyears">${esc(period(e.start, e.end))}</span>` : ""}
      </div>`;
    })
    .join("");

  const credList = [
    ...c.certificates.map((x) => `<li><strong>${esc(x.name)}</strong><span>${esc(x.issuer ?? "")}</span><span>${esc(x.year ?? "")}</span></li>`),
    ...c.awards.map((a) => `<li><strong>${esc(a.title)}</strong><span>${esc(a.issuer ?? "")}</span><span>${esc(a.year ?? "")}</span></li>`),
  ].join("");

  const pubHtml = c.publications
    .map((pub) => `<li class="pub">${pub.url ? `<a class="publink" href="${esc(safeUrl(pub.url))}" target="_blank" rel="noopener noreferrer">${esc(pub.title)}</a>` : `<strong>${esc(pub.title)}</strong>`}<span class="pubmeta">${[pub.venue, pub.year].filter(Boolean).join(" · ")}</span></li>`)
    .join("");

  const contactCards = [
    c.contact.email ? `<a class="ccard" href="mailto:${esc(c.contact.email)}"><span class="cico">✉</span><span>${esc(c.contact.email)}</span></a>` : "",
    c.contact.phone ? `<a class="ccard" href="tel:${esc(c.contact.phone)}"><span class="cico">✆</span><span>${esc(c.contact.phone)}</span></a>` : "",
    c.contact.location ? `<div class="ccard"><span class="cico">◎</span><span>${esc(c.contact.location)}</span></div>` : "",
    hasDownload ? `<a class="ccard" href="${esc(safeUrl(c.resumeDownload.url))}" target="_blank" rel="noopener noreferrer"><span class="cico">↧</span><span>Resume</span></a>` : "",
  ]
    .filter(Boolean)
    .join("");

  const sections = `
    ${visible(p, "about") && c.about.bio ? section("about", "About Me", `<p class="bio">${esc(c.about.bio)}</p>`) : ""}
    ${projectsHtml ? section("work", "My Work", `<div class="pgrid">${projectsHtml}</div>`) : ""}
    ${c.experience.length ? section("experience", "Experience", `<div class="tls">${timeline}</div>`) : ""}
    ${c.skills.length ? section("skills", "Skills", skillGroupsMarkup(c.skills)) : ""}
    ${c.education.length ? section("education", "Education", `<div class="edus">${eduHtml}</div>`) : ""}
    ${credList ? section("credentials", "Awards & Certifications", `<ul class="creds">${credList}</ul>`) : ""}
    ${pubHtml ? section("publications", "Writing & Talks", `<ul class="pubs">${pubHtml}</ul>`) : ""}
    ${c.languages.length ? section("languages", "Languages", languagesMarkup(c.languages)) : ""}
    ${visible(p, "contact") ? section("contact", "Get In Touch", `<div class="ccards">${contactCards}${socialChips(c.socialLinks)}</div>`) : ""}`;

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
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Caveat:wght@500;600&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#FDF3EC;--ink:#241F2E;--muted:#6F6677;--pink:#FF5C8A;--purple:#6C5CE7;--line:#EADAC9;--yellow:#FFC93C}
*{box-sizing:border-box;margin:0}
html{scroll-behavior:smooth}
body{font-family:"Space Grotesk",system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.65}
a{color:inherit}
.wrap{max-width:1020px;margin:0 auto;padding:0 28px}

/* ── hero ── */
.hero{position:relative;padding:110px 0 80px;overflow:hidden}
.blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:.5;pointer-events:none}
.blob-a{width:340px;height:340px;background:var(--pink);top:-90px;right:-70px}
.blob-b{width:300px;height:300px;background:var(--purple);bottom:-120px;left:-80px;opacity:.35}
.blob-c{width:180px;height:180px;background:var(--yellow);top:40%;left:55%;opacity:.4}
.hero-inner{position:relative;text-align:center}
.eyebrow{font-family:"Caveat",cursive;font-size:1.8rem;color:var(--pink);transform:rotate(-3deg);display:inline-block}
.display{font-size:clamp(3rem,9vw,5.6rem);font-weight:700;line-height:1.02;letter-spacing:-.03em;margin-top:10px}
.display .hi{display:inline-block;transform:rotate(-4deg) translateY(-6px)}
.statement{font-family:"Caveat",cursive;font-size:clamp(1.5rem,3.4vw,2.1rem);color:var(--purple);margin-top:16px}
.lede{margin:16px auto 0;max-width:52ch;color:var(--muted);font-size:1.05rem}
.hero-actions{margin-top:30px;display:flex;justify-content:center;gap:14px;flex-wrap:wrap}
.btn{font-size:.92rem;font-weight:700;padding:14px 30px;border-radius:100px;text-decoration:none;display:inline-block;transition:transform .2s,box-shadow .2s}
.btn-solid{background:var(--pink);color:#fff;box-shadow:0 10px 24px -10px rgba(255,92,138,.6)}
.btn-solid:hover{transform:translateY(-3px) rotate(-1deg)}
.btn-ghost{background:#fff;color:var(--ink);border:2px solid var(--line)}
.btn-ghost:hover{transform:translateY(-3px) rotate(1deg);border-color:var(--purple);color:var(--purple)}
.chips{margin-top:26px;display:flex;justify-content:center;flex-wrap:wrap;gap:10px}
.chip{font-size:.82rem;font-weight:600;color:var(--muted);border:2px solid var(--line);border-radius:100px;padding:7px 16px}
.chip:nth-child(3n){border-color:var(--pink);color:var(--pink)}
.chip:nth-child(3n+1){border-color:var(--purple);color:var(--purple)}
.chip:nth-child(3n+2){border-color:var(--yellow);color:#B97B00}

/* ── sections ── */
.section{padding:66px 0;border-top:2px dashed var(--line)}
.sec-title{font-size:1.9rem;font-weight:700;margin-bottom:34px;letter-spacing:-.02em}
.sec-title .squiggle{color:var(--pink);display:inline-block;transform:rotate(12deg)}

.bio{max-width:60ch;font-size:1.14rem}

/* ── projects ── */
.pgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:26px}
.pcard{border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 6px 24px -14px rgba(36,31,46,.25);transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s;position:relative}
.pcard:hover{transform:translateY(-6px) rotate(calc((var(--t) % 2 == 0 ? -1 : 1) * .6deg));box-shadow:0 20px 40px -16px rgba(36,31,46,.35)}
.pcover{aspect-ratio:16/10;background-size:cover;background-position:center}
.pcover-plain{background:linear-gradient(135deg,hsl(calc(var(--t)*37) 85% 92%),hsl(calc(var(--t)*37 + 60) 80% 86%))}
.pcover-glyph{font-family:"Caveat",cursive;font-size:3rem;color:var(--purple);display:grid;place-items:center;height:100%}
.pbody{padding:22px}
.ptitle{font-size:1.25rem;font-weight:700}
.psub{color:var(--pink);font-weight:600;font-size:.86rem;margin-top:5px}
.pdesc{color:var(--muted);font-size:.93rem;margin-top:10px}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.tag{font-size:.74rem;font-weight:600;color:var(--purple);background:rgba(108,92,231,.1);border-radius:100px;padding:4px 11px}
.plink{display:inline-block;margin-top:16px;font-weight:700;color:var(--purple);text-decoration:none}
.plink:hover{color:var(--pink)}

/* ── timeline ── */
.tls{display:grid;gap:26px}
.tl{display:flex;gap:20px;background:#fff;border-radius:18px;padding:22px;box-shadow:0 6px 24px -14px rgba(36,31,46,.2)}
.tl-bubble{flex:none;width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;display:grid;place-items:center;font-size:1.4rem;font-weight:700;transform:rotate(-4deg)}
.tl-years{font-family:"Caveat",cursive;font-size:1.25rem;color:var(--purple)}
.tl-role{font-size:1.15rem;font-weight:700;margin-top:2px}
.tl-org{color:var(--pink);font-weight:600;font-size:.9rem}
.tl-bullets{margin:12px 0 0;padding-left:20px;color:var(--muted);font-size:.95rem}
.tl-bullets li{margin-bottom:5px}
.tl-desc{color:var(--muted);margin-top:10px;font-size:.95rem}

/* ── skills ── */
.skills{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:26px}
.skill-group{background:#fff;border-radius:18px;padding:22px;box-shadow:0 6px 24px -14px rgba(36,31,46,.2)}
.skill-cat{font-weight:700;font-size:1.05rem;color:var(--purple)}
.skill-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.skill{font-size:.84rem;border:2px solid var(--line);border-radius:100px;padding:6px 13px;font-weight:600}
.skill:nth-child(2n){border-color:var(--pink);color:var(--pink)}

/* ── education ── */
.edus{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:22px}
.edu{background:#fff;border-radius:18px;padding:22px;position:relative;box-shadow:0 6px 24px -14px rgba(36,31,46,.2)}
.edu h3{font-size:1.08rem;font-weight:700}
.edu p{color:var(--muted);margin-top:5px}
.eduyears{position:absolute;top:18px;right:20px;font-family:"Caveat",cursive;font-size:1.2rem;color:var(--pink)}

/* ── creds ── */
.creds{list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
.creds li{display:flex;flex-direction:column;background:#fff;border-radius:16px;padding:18px 20px;box-shadow:0 6px 24px -14px rgba(36,31,46,.2)}
.creds li::before{content:"★";color:var(--yellow);font-size:1.3rem;margin-bottom:6px}
.creds li strong{font-size:1rem}
.creds li span{color:var(--muted);font-size:.86rem}

/* ── publications ── */
.pubs{list-style:none;display:grid;gap:14px}
.pub{background:#fff;border-radius:16px;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;box-shadow:0 6px 24px -14px rgba(36,31,46,.2)}
.publink{color:var(--purple);font-weight:700;text-decoration:none}
.publink:hover{color:var(--pink)}
.pubmeta{color:var(--muted);font-size:.85rem}

/* ── languages ── */
.languages{display:flex;flex-wrap:wrap;gap:10px}
.lang{font-size:.9rem;font-weight:600;border:2px solid var(--line);border-radius:100px;padding:9px 17px}
.lang::before{content:"🗣 ";}

/* ── contact ── */
.ccards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.ccard{display:flex;align-items:center;gap:12px;background:#fff;border-radius:16px;padding:18px 20px;text-decoration:none;box-shadow:0 6px 24px -14px rgba(36,31,46,.2);transition:transform .2s}
.ccard:hover{transform:translateY(-3px)}
.cico{width:42px;height:42px;flex:none;border-radius:12px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;display:grid;place-items:center;font-size:1.05rem}
.ccards .chips{grid-column:1/-1;justify-content:flex-start}

footer{border-top:2px dashed var(--line);margin-top:40px}
.footer-inner{max-width:1020px;margin:0 auto;padding:34px 28px;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:.86rem;font-weight:500}
.footer-inner a:hover{color:var(--pink)}
${REVEAL_CSS}
${PRINT_CSS}
</style>
</head>
<body>
<header class="hero">
  <div class="blob blob-a"></div>
  <div class="blob blob-b"></div>
  <div class="blob blob-c"></div>
  <div class="wrap hero-inner rv">
    <span class="eyebrow">hi, i'm</span>
    <h1 class="display"><span class="hi">${esc(name)}</span></h1>
    <p class="statement">${esc(c.landing.headline)}</p>
    <p class="lede">${esc(c.landing.tagline)}</p>
    <div class="hero-actions">
      ${c.contact.email ? `<a class="btn btn-solid" href="mailto:${esc(c.contact.email)}">let's work together</a>` : ""}
      ${hasDownload ? `<a class="btn btn-ghost" href="${esc(safeUrl(c.resumeDownload.url))}" target="_blank" rel="noopener noreferrer">grab my resume</a>` : ""}
    </div>
    ${chips ? `<div class="chips">${chips}</div>` : ""}
  </div>
</header>
<main class="wrap">${sections}</main>
<footer>
  <div class="footer-inner">
    <span>© ${new Date().getFullYear()} ${esc(name)}</span>
    <a href="https://portsume.app" style="color:inherit;text-decoration:none">made with ♥ + portsume</a>
  </div>
</footer>
${REVEAL_JS}
</body>
</html>`;
}
