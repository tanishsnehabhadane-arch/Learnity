import { HeroSection } from "@/components/features/HeroSection";

const FEATURES = [
  {
    title: "Concept-level diagnostics",
    body: "A computerized adaptive test pinpoints your level per subject — it stops when it knows you, not after a fixed question count.",
  },
  {
    title: "DAG-aware gap detection",
    body: "Failed quadratics? The real gap might be distributing negatives. Learnity walks your prerequisite graph backward to the root cause.",
  },
  {
    title: "Explainable recommendations",
    body: "Every item on your learning path carries a reason — no opaque algorithm, just a clear why for what's next.",
  },
  {
    title: "Spaced repetition built in",
    body: "Mastered concepts get scheduled reviews before they decay, interleaved into your path automatically.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <section aria-labelledby="features-heading" className="mx-auto max-w-7xl px-4 py-24">
        <h2 id="features-heading" className="font-display text-4xl font-black uppercase">
          The loop that learns you
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="border-2 border-black bg-white p-6 shadow-brutal dark:border-white dark:bg-neutral-900"
            >
              <h3 className="font-tech text-lg font-bold uppercase">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed opacity-80">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
