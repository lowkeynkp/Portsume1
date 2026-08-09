import { Reveal } from "../Reveal";
import { DoodleCircle, Tape } from "../decor";

const PLANS = [
  {
    name: "Doodle",
    price: "₹0",
    period: "forever",
    blurb: "For your first portfolio, absolutely free.",
    features: ["1 published portfolio", "All 6 themes", "portsume.app subdomain", "AI polish pass", "Community support"],
    cta: "Start doodling",
    highlight: false,
    color: "bg-powder",
  },
  {
    name: "Studio",
    price: "₹499",
    period: "per month",
    blurb: "For creators who take their presence seriously.",
    features: [
      "Unlimited portfolios",
      "Custom domain support",
      "AI resume rewriting",
      "Version history & undo",
      "Visitor analytics",
      "Priority processing",
    ],
    cta: "Start free trial",
    highlight: true,
    color: "bg-butter",
  },
  {
    name: "Collective",
    price: "Let's talk",
    period: "per team",
    blurb: "For agencies, cohorts and career services.",
    features: ["Team workspaces", "White-label publishing", "Bulk resume import", "API access", "Dedicated success manager"],
    cta: "Talk to us",
    highlight: false,
    color: "bg-lavender",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden py-24 md:py-32">
      <div className="notebook-lines absolute inset-0 opacity-30" aria-hidden="true" />
      <DoodleCircle className="absolute right-[4%] top-20 hidden h-28 w-28 md:block" />

      <div className="relative mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker text-coral">pricing, but make it cute</span>
          <h2 className="mt-4 display-1 text-[clamp(2.2rem,5vw,3.6rem)]">
            Cheap enough to <em className="italic text-forest">always</em> say yes
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.1} className={p.highlight ? "lg:-translate-y-4" : ""}>
              <article
                className={`relative flex h-full flex-col rounded-[2rem] border p-8 shadow-soft ${
                  p.highlight ? "border-navy bg-navy text-cream shadow-lift" : `border-navy/10 ${p.color}`
                }`}
              >
                {p.highlight && <Tape className="-top-3 left-1/2 -translate-x-1/2" />}
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-semibold">{p.name}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      p.highlight ? "bg-butter text-navy" : "bg-paper/70 text-navy/70"
                    }`}
                  >
                    {p.highlight ? "most loved" : "keep it simple"}
                  </span>
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="display-1 text-5xl">{p.price}</span>
                  <span className={`text-sm ${p.highlight ? "text-cream/60" : "text-navy/50"}`}>{p.period}</span>
                </div>
                <p className={`mt-2 text-sm ${p.highlight ? "text-cream/70" : "text-navy/60"}`}>{p.blurb}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${
                          p.highlight ? "bg-forest text-cream" : "bg-paper text-forest"
                        }`}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      <span className={p.highlight ? "text-cream/85" : "text-navy/75"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button className={p.highlight ? "btn-primary mt-8 w-full" : "btn-ghost mt-8 w-full"}>
                  {p.cta}
                </button>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
