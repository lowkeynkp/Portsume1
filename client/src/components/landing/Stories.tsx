import { Reveal } from "../Reveal";
import { Flower, FlowerBlush, Spark } from "../decor";

const STORIES = [
  {
    quote:
      "I uploaded an ugly two-column PDF at midnight. By the time my coffee was done, I had a live portfolio that recruiters kept complimenting.",
    name: "Maya Chen",
    role: "Product Designer",
    color: "bg-peach",
    tilt: -2,
  },
  {
    quote:
      "The AI didn't make up a single thing from my resume — it just made everything I'd written sound better. That's the right line to walk.",
    name: "Sam Okafor",
    role: "Frontend Engineer",
    color: "bg-powder",
    tilt: 1.5,
  },
  {
    quote:
      "I switched themes five times in one afternoon. My content never moved a pixel. It feels like magic until you realize it's just great architecture.",
    name: "Lena Fischer",
    role: "Brand Strategist",
    color: "bg-lavender",
    tilt: -1.5,
  },
  {
    quote:
      "Shared my Portsume link instead of a PDF in a job application. The interviewer opened it live and we talked about my projects for half the call.",
    name: "Diego Ramirez",
    role: "Motion Designer",
    color: "bg-sage",
    tilt: 2,
  },
];

export function Stories() {
  return (
    <section id="stories" className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-cream" aria-hidden="true" />
      <FlowerBlush className="absolute left-[8%] top-16 h-14 w-14 animate-floaty" />
      <Spark className="absolute right-[6%] bottom-24 h-10 w-10 animate-wiggle" />

      <div className="relative mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker text-forest">wall of stories</span>
          <h2 className="mt-4 display-1 text-[clamp(2.2rem,5vw,3.6rem)]">
            People stop sending
            <br />
            <span className="italic text-coral">plain PDFs.</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {STORIES.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.08}>
              <figure
                className={`relative h-full rounded-[1.75rem] border border-navy/10 p-8 ${s.color}`}
                style={{ transform: `rotate(${s.tilt}deg)`, transition: "transform .4s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(0deg)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = `rotate(${s.tilt}deg)`)}
              >
                <svg viewBox="0 0 40 30" className="h-8 w-10 fill-navy/20" aria-hidden="true">
                  <path d="M0 30V16c0-9 4-14 13-16l2 5c-4 2-6 5-6 9h7v16H0Zm20 0V16c0-9 4-14 13-16l2 5c-4 2-6 5-6 9h7v16H20Z" />
                </svg>
                <blockquote className="mt-4 font-display text-xl font-medium leading-snug">
                  {s.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-full border-2 border-navy/20 bg-paper text-sm font-bold`}>
                    {s.name[0]}
                  </span>
                  <div>
                    <div className="text-sm font-bold">{s.name}</div>
                    <div className="text-xs text-navy/60">{s.role}</div>
                  </div>
                  <Flower className="ml-auto h-8 w-8 opacity-70" />
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
