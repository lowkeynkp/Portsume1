import { Flower, Spark, FlowerBlush } from "../decor";

const WORDS = [
  "Upload", "Parse", "Polish", "Theme", "Publish", "Share",
  "Own it", "Go live", "Stand out", "Get found",
];

export function MarqueeBand() {
  const row = [...WORDS, ...WORDS];
  return (
    <section className="relative overflow-hidden border-y-2 border-navy bg-butter py-4" aria-hidden="true">
      <div className="marquee-track items-center gap-8 pr-8">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-8 whitespace-nowrap">
            <span className="font-display text-xl font-semibold tracking-tight text-navy md:text-2xl">{w}</span>
            {i % 3 === 0 ? (
              <Flower className="h-6 w-6" />
            ) : i % 3 === 1 ? (
              <Spark className="h-5 w-5" />
            ) : (
              <FlowerBlush className="h-6 w-6" />
            )}
          </span>
        ))}
      </div>
    </section>
  );
}
