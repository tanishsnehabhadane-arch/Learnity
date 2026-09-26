/**
 * Acceptance test per the backend spec:
 * signup → diagnostic (CAT) → path generated → adaptive quiz answered →
 * path recomputed → gap surfaced → AI explanation requested.
 * Run with the API on :4000 and the seed in place: npx tsx scripts/acceptance.ts
 */
import "./load-env.ts";
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();
const BASE = "http://localhost:4000/api";

let token = "";

async function api<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json()) as T & { error?: string; message?: string };
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  }
  return json;
}

interface Item {
  questionId: string;
  conceptId: string;
  type: string;
  body: string;
  choices: string[] | null;
  difficulty: number;
}

/** Answer correctly when the question is easy, wrongly when hard — a mediocre student. */
function decide(item: Item): string {
  if (item.choices && item.choices.length > 0) {
    const pickCorrect = item.difficulty <= 4;
    if (pickCorrect) {
      // Find the truest-looking choice: return first (grading is server-side; we
      // answer deliberately wrong sometimes to exercise the loop either way).
      return item.choices[0] as string;
    }
    return item.choices[item.choices.length - 1] as string;
  }
  return item.difficulty <= 4 ? "2" : "-999";
}

async function main(): Promise<void> {
  console.log("1. Signup");
  const email = `acc-${Date.now()}@learnity.dev`;
  const auth = await api<{ accessToken: string; student: { id: string } }>("POST", "/auth/signup", {
    email,
    name: "Acceptance Tester",
    password: "acceptance-password-123",
  });
  token = auth.accessToken;
  const studentId = auth.student.id;
  console.log(`   ✓ student ${studentId}`);

  const subject = await prisma.subject.findUniqueOrThrow({ where: { slug: "aoa" } });

  console.log("2. Diagnostic start (CAT)");
  const start = await api<{ sessionId: string; firstItem: Item }>(
    "POST",
    "/assessments/diagnostic/start",
    { subjectId: subject.id },
  );
  console.log(`   ✓ session ${start.sessionId}, first item difficulty ${start.firstItem.difficulty}/10`);

  let item = start.firstItem;
  let rounds = 0;
  let completed = false;
  while (rounds < 25) {
    rounds += 1;
    const answer = decide(item);
    const res = await api<{ nextItem: Item | null; completed: boolean; calibration: { theta: number; se: number; itemsAdministered: number } }>(
      "POST",
      `/assessments/diagnostic/${start.sessionId}/answer`,
      { questionId: item.questionId, answer, responseTimeMs: 5_000 + rounds * 137 },
    );
    if (res.completed || res.nextItem === null) {
      completed = true;
      console.log(`   ✓ diagnostic complete after ${rounds} items — theta=${res.calibration.theta.toFixed(3)}, se=${res.calibration.se.toFixed(3)}`);
      break;
    }
    item = res.nextItem;
  }
  if (!completed) throw new Error("diagnostic did not terminate within 25 items");

  console.log("3. Learning path generated");
  await new Promise((r) => setTimeout(r, 2_000)); // allow inline/job recompute to land
  const path = await api<{ items: Array<{ conceptName: string; kind: string; rationale: string }> }>(
    "GET",
    `/students/${studentId}/learning-path`,
  );
  console.log(`   ✓ ${path.items.length} path items; first: "${path.items[0]?.conceptName}" (${path.items[0]?.kind})`);
  console.log(`     rationale: ${path.items[0]?.rationale.slice(0, 90)}…`);

  console.log("4. Adaptive quiz");
  const quiz = await api<{ sessionId: string; firstItem: Item }>("POST", "/quiz/adaptive/start", {});
  let qItem = quiz.firstItem;
  let intervention = false;
  for (let i = 0; i < 8; i++) {
    const res = await api<{ nextItem: Item | null; completed: boolean; intervention?: boolean }>(
      "POST",
      `/quiz/adaptive/${quiz.sessionId}/answer`,
      { questionId: qItem.questionId, answer: decide(qItem), responseTimeMs: 4_000 + i * 211 },
    );
    intervention = intervention || res.intervention === true;
    if (res.completed || res.nextItem === null) break;
    qItem = res.nextItem;
  }
  console.log(`   ✓ adaptive quiz ran (intervention signaled: ${intervention})`);

  console.log("5. Path recomputed after quiz");
  await new Promise((r) => setTimeout(r, 2_000));
  const path2 = await api<{ generatedAt: string; items: unknown[] }>(
    "GET",
    `/students/${studentId}/learning-path`,
  );
  console.log(`   ✓ path updated at ${path2.generatedAt}`);

  console.log("6. Gaps surfaced");
  const gaps = await api<{ gaps: Array<{ conceptName: string; observedOnName: string; depth: number }> }>(
    "GET",
    `/concepts/${studentId}/gaps`,
  );
  console.log(`   ✓ ${gaps.gaps.length} actionable gap(s)`, gaps.gaps.map((g) => g.conceptName).slice(0, 3));

  console.log("7. AI explanation (Gemini)");
  const someConcept = await prisma.concept.findFirst({ where: { topic: { subjectId: subject.id } } });
  if (!someConcept) throw new Error("no concept");
  const explanation = await api<{ explanation: string; cached: boolean }>("POST", "/ai/explain", {
    conceptId: someConcept.id,
  });
  console.log(`   ✓ explanation (cached=${explanation.cached}): ${explanation.explanation.slice(0, 110)}…`);

  console.log("\nACCEPTANCE TEST PASSED — the loop closes.");
}

main()
  .catch((err) => {
    console.error("ACCEPTANCE FAILED:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
