/**
 * Seed runner — data-driven from prisma/seed-data/*.ts.
 * Concept slugs are the DAG keys; questions upsert by slug (idempotent).
 * Difficulty mapping: easy → b ≈ -1.0, medium → 0, hard → +1.0 with slight
 * in-band spread so the CAT engine has distinct item difficulties.
 *
 * Subjects seeded: AOA (complete). COA/FSJP/MATHS data files slot into the
 * SUBJECTS array as they're authored — no runner changes needed.
 */
import { PrismaClient } from "../src/generated/prisma/index.js";
import { scryptSync, randomBytes } from "node:crypto";
import { aoa } from "./seed-data/aoa.ts";
import type { SeedSubject } from "./seed-data/types.ts";

const prisma = new PrismaClient();

const SUBJECTS: SeedSubject[] = [aoa];

/** Deterministic in-band difficulty from the question slug hash. */
function bFor(band: "easy" | "medium" | "hard", slug: string): number {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const spread = ((hash >>> 0) % 100) / 100; // 0..1
  const base = band === "easy" ? -1.0 : band === "medium" ? 0 : 1.0;
  return Number((base + (spread - 0.5) * 0.8).toFixed(3));
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

async function seedSubject(subject: SeedSubject): Promise<void> {
  const s = await prisma.subject.upsert({
    where: { slug: subject.slug },
    update: { name: subject.name },
    create: { slug: subject.slug, name: subject.name },
  });

  const conceptIdBySlug = new Map<string, string>();
  let questionCount = 0;

  // Pass 1: topics + concepts (no prerequisite edges yet)
  for (const [topicIndex, topic] of subject.topics.entries()) {
    const t = await prisma.topic.upsert({
      where: { subjectId_name: { subjectId: s.id, name: topic.name } },
      update: { order: topicIndex },
      create: { subjectId: s.id, name: topic.name, order: topicIndex },
    });

    for (const [conceptIndex, concept] of topic.concepts.entries()) {
      const c = await prisma.concept.upsert({
        where: { slug: concept.slug },
        update: { name: concept.name, description: concept.description },
        create: {
          slug: concept.slug,
          topicId: t.id,
          name: concept.name,
          description: concept.description,
          curriculumOrder: topicIndex * 100 + conceptIndex,
        },
      });
      conceptIdBySlug.set(concept.slug, c.id);

      for (const q of concept.questions) {
        const payload = q.type === "mcq" ? { choices: q.choices ?? [] } : {};
        await prisma.question.upsert({
          where: { slug: q.slug },
          update: {
            body: q.body,
            payload: payload as object,
            answerKey: q.answerKey,
            explanation: q.explanation,
            difficulty: bFor(q.band, q.slug),
            conceptId: c.id,
          },
          create: {
            slug: q.slug,
            conceptId: c.id,
            difficulty: bFor(q.band, q.slug),
            discrimination: 1.2,
            type: q.type,
            body: q.body,
            payload: payload as object,
            answerKey: q.answerKey,
            explanation: q.explanation,
            generatedBy: "curated",
          },
        });
        questionCount += 1;
      }
    }
  }

  // Pass 2: wire prerequisite DAG edges (all concepts now exist)
  for (const topic of subject.topics) {
    for (const concept of topic.concepts) {
      const conceptId = conceptIdBySlug.get(concept.slug);
      if (!conceptId) continue;
      const prereqIds = concept.prerequisites
        .map((slug) => conceptIdBySlug.get(slug))
        .filter((id): id is string => id !== undefined);
      await prisma.concept.update({
        where: { id: conceptId },
        data: { prerequisites: { set: prereqIds.map((id) => ({ id })) } },
      });
    }
  }

  console.log(
    `[${subject.slug}] ${subject.topics.length} topics, ${conceptIdBySlug.size} concepts, ${questionCount} questions`,
  );
}

async function main(): Promise<void> {
  console.log("Seeding Learnity…");
  for (const subject of SUBJECTS) {
    await seedSubject(subject);
  }

  for (const badge of [
    { key: "first-steps", name: "First Steps", description: "Complete your first quiz question" },
    { key: "streak-7", name: "Week Warrior", description: "Maintain a 7-day streak" },
    { key: "mastery-1", name: "Concept Conqueror", description: "Master your first concept" },
    { key: "mastery-10", name: "DAG Dominator", description: "Master 10 concepts" },
  ]) {
    await prisma.badge.upsert({ where: { key: badge.key }, update: {}, create: badge });
  }

  // Demo educator + cohort + student (documented dev credentials)
  const educator = await prisma.educator.upsert({
    where: { email: "teacher@learnity.dev" },
    update: {},
    create: {
      email: "teacher@learnity.dev",
      name: "Demo Educator",
      passwordHash: hashPassword("educator123"),
    },
  });
  const cohort = await prisma.cohort.upsert({
    where: { id: "demo-cohort" },
    update: {},
    create: { id: "demo-cohort", name: "Period 2", educatorId: educator.id },
  });
  const student = await prisma.student.upsert({
    where: { email: "student@learnity.dev" },
    update: {},
    create: {
      email: "student@learnity.dev",
      name: "Demo Student",
      passwordHash: hashPassword("student123"),
      cohorts: { create: [{ cohortId: cohort.id }] },
    },
  });

  console.log(`Demo accounts: student@learnity.dev / student123 · teacher@learnity.dev / educator123 (cohort ${cohort.id})`);
  console.log(`Seeded student: ${student.email}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
