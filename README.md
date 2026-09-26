# Learnity

AI-powered adaptive learning platform — monorepo containing the Next.js 15 frontend (`apps/web`) and the Node/TypeScript backend (`apps/api`).

## Stack

| App         | Tech                                                                 |
| ----------- | -------------------------------------------------------------------- |
| `apps/web`  | Next.js 15 (App Router), React 19, Tailwind v4, Zustand, TanStack Query, Framer Motion, GSAP, Lenis, tsParticles |
| `apps/api`  | Fastify, Prisma + PostgreSQL 16 (pgvector), Redis 7, BullMQ, Socket.IO, Anthropic Claude, Zod |

## Quickstart

```bash
cp .env.example .env          # fill in secrets (Anthropic key optional in dev)
docker compose up -d postgres redis
npm install
npm run db:migrate            # prisma migrate dev
npm run db:seed               # Algebra I concept DAG + curated item bank
npm run dev:api               # http://localhost:4000
npm run dev:web               # http://localhost:3000
```

## Architecture

```
Diagnostic (CAT/IRT) → Learner model (BKT per concept)
  → DAG-aware gap detection → Learning path recompute (BullMQ job)
  → Adaptive quiz (live theta) → learner model update → …
```

- **Learner model is the product**: per-concept `masteryProbability` (BKT) + `abilityEstimate` (2PL IRT theta).
- **Gap detection walks the prerequisite DAG backward** — the actionable gap is the prerequisite, not the downstream concept.
- **Every recommendation carries a cached rationale string** (AI-generated, keyed on concept + difficulty band + misconception signature).
- **Highest-risk math (IRT, BKT, SM-2, gap detection) is unit-tested with known input/output pairs** — see `apps/api/src/engines/*.test.ts`.

## Key entry points

- `apps/api/src/server.ts` — Fastify app + Socket.IO tutor namespace
- `apps/api/src/engines/` — IRT, BKT, CAT, gap detection, learning path, SM-2
- `apps/api/src/services/ai/` — Claude integration, cache, tutor socket service
- `apps/web/src/app/` — route groups per spec: `(root)`, `(auth)`, `(dashboard)`, `(learn)`, `(social)`, `(educator)`
- `apps/web/src/components/features/` — QuizEngine, DiagnosticAssessment, LearningPathTree, MasteryHeatmap, AITutorOverlay, …

## Status

Scaffold — all modules are typed stubs with documented interfaces, ready for phased implementation per the execution checklists in each spec.
