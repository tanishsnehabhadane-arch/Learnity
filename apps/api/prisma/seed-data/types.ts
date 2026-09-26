/**
 * Seed-data contracts shared by the per-subject data files.
 * Concept slugs are the primary DAG keys (kebab-case, per the seed spec).
 */
export interface SeedQuestion {
  slug: string;
  /** IRT difficulty: easy (b ≈ -1.5..-0.5), medium (b ≈ -0.5..0.5), hard (b ≈ 0.5..1.5). */
  band: "easy" | "medium" | "hard";
  type: "mcq" | "short_answer" | "numeric";
  body: string;
  choices?: string[];
  answerKey: string;
  explanation: string;
}

export interface SeedConcept {
  slug: string;
  name: string;
  description: string;
  /** Concept slugs that must be mastered first (DAG edges). */
  prerequisites: string[];
  questions: SeedQuestion[];
}

export interface SeedTopic {
  name: string;
  concepts: SeedConcept[];
}

export interface SeedSubject {
  /** Kebab-case subject slug (aoa | coa | fsjp | maths). */
  slug: string;
  name: string;
  topics: SeedTopic[];
}
