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

function section(id: string, index: string, title: string, body: string): string {
  if (!body) return "";
  return `<section id="${id}" class="section rv">
    <div class="sec-index">${index}</div>
    <div class="sec-body">
      <h2 class="sec-title">${esc(title)}</h2>
      ${body}
    </div>
  </section>`;
}

export function renderStudio(p: Portfolio): string {
  const c = p.content;
  const name = c.about.name || "Your Name";
  const role = c.about.role || "Creative";
  const hasDownload = Boolean(c.resumeDownload.url);
  const heroImg = c.landing.heroImages?.[0] || c.about.photoUrl;

  // Marquee band: every skill item (and project tech) scrolling in a loop.
  const marqueeItems = [
    ...c.skills.flatMap((g) => g.skills),
    ...c.projects.flatMap((pr) => pr.techStack ?? []),
  ];
  const marqueeText = marqueeItems.length
    ? marqueeItems.map((s) => `<span>${esc(s)}</span><i>✦</i>`).join("")
    : `<span>portfolio</span><i>✦</i>`;

  const projectsHtml = c.projects
    .map((pr, i) => {
      const img = pr.images?.[0];
      const cover = img
        ? `<div class="pcvr" style="background-image:url('${esc(safeUrl(img))}')"></div>`
        : `<div class="pcvr pcvr-plain" style="--h:${(i * 47) % 360}"><span class="pcvr-glyph">${String(i + 1).padStart(2, "0")}</span></div>`;
      const tech = (pr.techStack ?? []).slice(0, 5).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
      return `<article class="proj" style="--off:${i % 2 === 0 ? "0" : "60px"}">
        <a class="proj-cover" href="${esc(safeUrl(pr.url ?? "#"))}" target="${pr.url ? "_blank" : "_self"}" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">${cover}</a>
        <div class="proj-meta">
          <span class="proj-num">${String(i + 1).padStart(2, "0")}</span>
          <h3 class="proj-title">${esc(pr.title)}</h3>
          ${pr.subtitle ? `<p class="proj-sub">${esc(pr.subtitle)}</p>` : ""}
          <p class="proj-desc">${esc(pr.description)}</p>
          ${tech ? `<div class="tags">${tech}</div>` : ""}
          ${pr.url ? `<a class="proj-link" href="${esc(safeUrl(pr.url))}" target="_blank" rel="noopener noreferrer">view project ↗</a>` : ""}
        </div>
      </article>`;
    })
    .join("");

  const timeline = c.experience
    .map((e) => {
      const bullets = (e.highlights ?? []).map((b) => `<li>${esc(b)}</li>`).join("");
      return `<div class="role">
        <div class="role-years">${esc(period(e.start, e.end, e.current))}</div>
        <div class="role-body">
          <h3 class="role-title">${esc(e.role)}</h3>
          <p class="role-org">${esc(e.company || "Independent")}</p>
          ${bullets ? `<ul class="role-bullets">${bullets}</ul>` : e.description ? `<p class="role-desc">${esc(e.description)}</p>` : ""}
        </div>
      </div>`;
    })
    .join("");

  const eduHtml = c.education
    .map((e, i) => {
      const parts = [e.degree, e.field].filter(Boolean).join(" · ");
      return `<div class="edu" style="--rot:${i % 2 === 0 ? "-2deg" : "2deg"}">
        <span class="edu-year">${esc(period(e.start, e.end))}</span>
        <h3 class="edu-school">${esc(e.institution)}</h3>
        <p class="edu-degree">${esc(parts || "—")}</p>
      </div>`;
    })
    .join("");

  const credList = [
    ...c.certificates.map((x) => `<li><span class="cred-star">✳</span><div><strong>${esc(x.name)}</strong><span class="cred-meta">${esc(x.issuer ?? "")}${x.year ? ` · ${esc(x.year)}` : ""}</span></div></li>`),
    ...c.awards.map((a) => `<li><span class="cred-star">★</span><div><strong>${esc(a.title)}</strong><span class="cred-meta">${esc(a.issuer ?? "")}${a.year ? ` · ${esc(a.year)}` : ""}</span></div></li>`),
  ].join("");

  const pubHtml = c.publications
    .map((pub) => `<li class="pub">${pub.url ? `<a class="pub-link" href="${esc(safeUrl(pub.url))}" target="_blank" rel="noopener noreferrer">${esc(pub.title)} ↗</a>` : `<strong>${esc(pub.title)}</strong>`}<span class="pub-meta">${[pub.venue, pub.year].filter(Boolean).join(" · ")}</span></li>`)
    .join("");

  const contactLine = [
    c.contact.email ? `<a class="bigmail" href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a>` : "",
    c.contact.phone ? `<a class="contact-extra" href="tel:${esc(c.contact.phone)}">${esc(c.contact.phone)}</a>` : "",
    c.contact.location ? `<span class="contact-extra">${esc(c.contact.location)}</span>` : "",
  ]
    .filter(Boolean)
    .join("");

  const sections = `
    ${visible(p, "about") && c.about.bio ? section("about", "01", "about", `<p class="bio">${esc(c.about.bio)}</p>`) : ""}
    ${c.projects.length ? section("work", "02", "selected work", `<div class="projs">${projectsHtml}</div>`) : ""}
    ${c.experience.length ? section("experience", "03", "experience", `<div class="roles">${timeline}</div>`) : ""}
    ${c.skills.length ? section("skills", "04", "toolkit", skillBarsHtml(c.skills)) : ""}
    ${c.education.length ? section("education", "05", "education", `<div class="edus">${eduHtml}</div>`) : ""}
    ${credList ? section("credentials", "06", "recognition", `<ul class="creds">${credList}</ul>`) : ""}
    ${pubHtml ? section("publications", "07", "writings", `<ul class="pubs">${pubHtml}</ul>`) : ""}
    ${c.languages.length ? section("languages", "08", "languages", languagesMarkup(c.languages)) : ""}
    ${visible(p, "contact") ? section("contact", "09", "get in touch", `<p class="bio">${contactLine}</p>`) : ""}`;

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
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#FAF7F2;--ink:#15110C;--muted:#71685C;--accent:#FF4D2E;--navy:#1E2A5A;--line:#E4DCD0}
*{box-sizing:border-box;margin:0}
html{scroll-behavior:smooth}
body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.7}
a{color:inherit}
.wrap{max-width:1120px;margin:0 auto;padding:0 32px}

/* ── top bar ── */
.topbar{position:absolute;top:0;left:0;right:0;padding:26px 32px;display:flex;justify-content:space-between;align-items:center;font-size:.72rem;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);z-index:2}
.topbar .mono{font-family:Unbounded,sans-serif;letter-spacing:.14em}

/* ── hero ── */
.hero{position:relative;padding:150px 0 90px;overflow:hidden}
.hero-grid{position:relative;display:grid;grid-template-columns:1fr;gap:40px}
@media(min-width:860px){.hero-grid{grid-template-columns:1.25fr .75fr;align-items:end}}
.hero-kicker{font-size:.78rem;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:var(--accent)}
.display{font-family:Unbounded,sans-serif;font-weight:700;font-size:clamp(2.8rem,9vw,6.4rem);line-height:.98;letter-spacing:-.02em;margin-top:18px;text-wrap:balance}
.display .swash{display:inline-block;color:var(--navy);font-style:italic;position:relative}
.hero-lede{margin-top:26px;max-width:44ch;color:var(--muted);font-size:clamp(1.05rem,2.2vw,1.25rem);font-weight:500}
.hero-actions{margin-top:34px;display:flex;gap:14px;flex-wrap:wrap}
.btn{font-size:.9rem;font-weight:700;padding:15px 30px;border-radius:100px;text-decoration:none;display:inline-block;transition:transform .2s ease,box-shadow .2s ease}
.btn-solid{background:var(--ink);color:var(--bg)}
.btn-solid:hover{transform:translateY(-3px);box-shadow:0 16px 30px -12px rgba(21,17,12,.4)}
.btn-ghost{border:2px solid var(--ink);color:var(--ink)}
.btn-ghost:hover{transform:translateY(-3px);background:var(--ink);color:var(--bg)}
.hero-visual{position:relative;justify-self:end;width:min(100%,320px)}
.hero-visual img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:24px;filter:grayscale(.15) contrast(1.04)}
.hero-visual:after{content:"";position:absolute;inset:0;border-radius:24px;border:1.5px dashed var(--accent);transform:translate(14px,14px);z-index:-1}
.hero-badge{position:absolute;top:-18px;right:-18px;width:74px;height:74px;border-radius:50%;background:var(--accent);color:#fff;display:grid;place-items:center;font-family:Unbounded,sans-serif;font-size:.6rem;line-height:1.25;text-align:center;font-weight:600;transform:rotate(12deg)}
.chips{margin-top:30px;display:flex;flex-wrap:wrap;gap:10px}
.chip{font-size:.8rem;font-weight:600;color:var(--muted);border:1.5px solid var(--line);border-radius:100px;padding:7px 15px;text-decoration:none;transition:all .2s}
.chip:hover{color:var(--accent);border-color:var(--accent)}

/* ── marquee band ── */
.band{overflow:hidden;border-top:1.5px solid var(--ink);border-bottom:1.5px solid var(--ink);padding:16px 0;margin:0 0 30px;background:var(--bg)}
.band-track{display:flex;gap:40px;width:max-content;animation:marquee 26s linear infinite}
.band-track span{font-family:Unbounded,sans-serif;font-size:.9rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.band-track i{color:var(--accent);font-style:normal;margin-left:40px}
@keyframes marquee{to{transform:translateX(-50%)}}

/* ── sections ── */
.section{display:grid;grid-template-columns:96px 1fr;gap:34px;padding:74px 0;border-top:1.5px solid var(--line)}
.sec-index{font-family:Unbounded,sans-serif;font-size:1rem;color:var(--accent);padding-top:8px}
.sec-title{font-family:Unbounded,sans-serif;font-size:clamp(1.6rem,3.6vw,2.4rem);font-weight:600;letter-spacing:-.01em;margin-bottom:30px}
.bio{max-width:62ch;font-size:clamp(1.08rem,2.2vw,1.3rem);line-height:1.75;color:var(--ink)}

/* ── projects ── */
.projs{display:grid;gap:64px}
.proj{display:grid;grid-template-columns:1fr;gap:26px;transform:translateY(var(--off))}
@media(min-width:860px){.proj{grid-template-columns:1.15fr .85fr;align-items:center}}
.proj-cover{display:block;text-decoration:none;border-radius:20px;overflow:hidden;box-shadow:0 22px 50px -28px rgba(21,17,12,.5)}
.pcvr{aspect-ratio:4/3;background-size:cover;background-position:center;transition:transform .5s cubic-bezier(.22,1,.36,1)}
.proj-cover:hover .pcvr{transform:scale(1.04)}
.pcvr-plain{background:linear-gradient(140deg,hsl(var(--h) 65% 88%),hsl(calc(var(--h) + 40) 70% 80%));display:grid;place-items:center}
.pcvr-glyph{font-family:Unbounded,sans-serif;font-size:3.6rem;color:var(--navy);font-weight:700}
.proj-num{font-family:Unbounded,sans-serif;font-size:.9rem;color:var(--accent);letter-spacing:.1em}
.proj-title{font-family:Unbounded,sans-serif;font-size:clamp(1.5rem,3.4vw,2.3rem);font-weight:600;margin-top:10px;line-height:1.1}
.proj-sub{color:var(--navy);font-weight:600;font-size:.92rem;margin-top:8px;letter-spacing:.04em}
.proj-desc{color:var(--muted);margin-top:14px;font-size:1rem}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.tag{font-size:.74rem;font-weight:600;color:var(--navy);background:#ECE7F2;border-radius:100px;padding:5px 12px}
.proj-link{display:inline-block;margin-top:18px;font-weight:700;color:var(--accent);text-decoration:none;border-bottom:2px solid var(--accent);padding-bottom:2px}
.proj-link:hover{color:var(--navy);border-color:var(--navy)}

/* ── experience ── */
.roles{display:grid;gap:0}
.role{display:grid;grid-template-columns:150px 1fr;gap:24px;padding:28px 0;border-top:1.5px solid var(--line)}
.role:first-child{border-top:none}
.role-years{font-size:.82rem;font-weight:600;color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
.role-title{font-size:1.22rem;font-weight:700}
.role-org{color:var(--accent);font-weight:700;font-size:.92rem;margin-top:3px}
.role-bullets{margin:12px 0 0;padding-left:20px;color:var(--muted);font-size:.97rem}
.role-bullets li{margin-bottom:6px}
.role-desc{color:var(--muted);margin-top:10px;font-size:.97rem}

/* ── skills ── */
.skillbar{margin-bottom:18px}
.skillbar-top{display:flex;justify-content:space-between;font-size:.9rem;font-weight:600;margin-bottom:8px}
.skillbar-cat{color:var(--navy)}
.skillbar-items{color:var(--muted);text-align:right;font-weight:500}
.skillbar-track{height:5px;border-radius:100px;background:var(--line);overflow:hidden}
.skillbar-fill{height:100%;border-radius:100px;background:linear-gradient(90deg,var(--accent),var(--navy));transform-origin:left;animation:fill 1.2s cubic-bezier(.22,1,.36,1) both}
@keyframes fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}

/* ── education ── */
.edus{display:grid;gap:22px}
@media(min-width:760px){.edus{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}}
.edu{background:#fff;border:1.5px solid var(--line);border-radius:18px;padding:26px;transform:rotate(var(--rot));box-shadow:0 16px 34px -22px rgba(21,17,12,.35)}
.edu-year{font-size:.78rem;font-weight:600;color:var(--accent);letter-spacing:.08em;text-transform:uppercase}
.edu-school{font-family:Unbounded,sans-serif;font-size:1.05rem;font-weight:600;margin-top:8px}
.edu-degree{color:var(--muted);font-size:.92rem;margin-top:6px}

/* ── credentials ── */
.creds{list-style:none;display:grid;gap:12px}
.creds li{display:flex;align-items:flex-start;gap:14px;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:16px 20px}
.cred-star{color:var(--accent);font-weight:700;font-size:1.05rem;margin-top:2px}
.creds strong{font-size:.98rem;font-weight:700}
.cred-meta{display:block;color:var(--muted);font-size:.85rem;margin-top:3px}

/* ── publications ── */
.pubs{list-style:none;display:grid;gap:12px}
.pub{display:flex;justify-content:space-between;align-items:baseline;gap:14px;flex-wrap:wrap;padding:18px 0;border-top:1.5px solid var(--line);font-size:.98rem}
.pub-link{color:var(--navy);font-weight:700;text-decoration:none}
.pub-link:hover{color:var(--accent)}
.pub-meta{color:var(--muted);font-size:.85rem}

/* ── languages ── */
.languages{display:flex;flex-wrap:wrap;gap:10px}
.lang{font-size:.9rem;font-weight:600;border:1.5px solid var(--line);border-radius:100px;padding:9px 17px}

/* ── contact ── */
.bigmail{display:inline-block;font-family:Unbounded,sans-serif;font-size:clamp(1.2rem,3.4vw,2rem);font-weight:600;color:var(--accent);text-decoration:none;margin-right:18px;word-break:break-all}
.bigmail:hover{color:var(--navy)}
.contact-extra{display:inline-block;color:var(--muted);font-weight:600;margin-right:16px}

footer{border-top:1.5px solid var(--ink);margin-top:30px}
.footer-inner{max-width:1120px;margin:0 auto;padding:34px 32px;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:.84rem;font-weight:500}
.footer-inner a:hover{color:var(--accent)}
${REVEAL_CSS}
${PRINT_CSS}
</style>
</head>
<body>
<header class="hero">
  <div class="topbar">
    <span class="mono">✳ ${esc(name.split(/\s+/)[0] || "")}</span>
    <span>portfolio — ${new Date().getFullYear()}</span>
  </div>
  <div class="wrap">
    <div class="hero-grid rv">
      <div>
        <p class="hero-kicker">${esc(role)}</p>
        <h1 class="display">${esc(name)}<span class="swash">.</span></h1>
        <p class="hero-lede">${esc(c.landing.headline)}</p>
        <div class="hero-actions">
          ${c.contact.email ? `<a class="btn btn-solid" href="mailto:${esc(c.contact.email)}">Let's collaborate</a>` : ""}
          ${hasDownload ? `<a class="btn btn-ghost" href="${esc(safeUrl(c.resumeDownload.url))}" target="_blank" rel="noopener noreferrer">Download CV</a>` : ""}
        </div>
        ${socialChips(c.socialLinks)}
      </div>
      ${heroImg ? `<div class="hero-visual"><span class="hero-badge">open<br/>for<br/>work</span><img src="${esc(safeUrl(heroImg))}" alt=""/></div>` : ""}
    </div>
  </div>
</header>
${marqueeItems.length ? `<div class="band"><div class="band-track">${marqueeText}${marqueeText}</div></div>` : ""}
<main class="wrap">${sections}</main>
<footer>
  <div class="footer-inner">
    <span>© ${new Date().getFullYear()} ${esc(name)}</span>
    <span>${esc(c.landing.tagline)}</span>
    <a href="https://portsume.app" style="text-decoration:none">built with portsume</a>
  </div>
</footer>
${REVEAL_JS}
</body>
</html>`;
}

/** Skills rendered as labelled progress bars driven by item counts. */
function skillBarsHtml(groups: { category: string; skills: string[] }[]): string {
  const max = Math.max(1, ...groups.map((g) => g.skills.length));
  return `<div class="skillbars">
    ${groups
      .map((g) => {
        const pct = Math.max(15, Math.round((g.skills.length / max) * 100));
        return `<div class="skillbar">
          <div class="skillbar-top"><span class="skillbar-cat">${esc(g.category)}</span><span class="skillbar-items">${esc(g.skills.join(" · "))}</span></div>
          <div class="skillbar-track"><div class="skillbar-fill" style="width:${pct}%"></div></div>
        </div>`;
      })
      .join("")}
  </div>`;
}
