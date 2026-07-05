## Context

The current codebase compiles in several places but is not release-ready. The backend runtime migrator uses `backend/drizzle`, while recent SQL files were added under `backend/migrations`; frontend and backend lint both fail; backend tests fail on shared response schema compatibility. The fixes cross deployment, shared contracts, and quality gates, so the change needs a small coordinated design.

## Goals / Non-Goals

**Goals:**

- Make the runtime migration path include all columns used by the current backend schema.
- Keep shared schemas aligned with real backend responses and compatible with older opportunity response shapes.
- Remove current lint/test blockers without broad refactors.
- Verify the critical backend/frontend commands after the fixes.

**Non-Goals:**

- No new product workflow features.
- No scoring, recommendation, AI coaching, analytics, alert, or automation behavior changes.
- No database data migration beyond adding missing schema columns to the existing Drizzle migration stream.
- No large component decomposition in this change.

## Decisions

- Use Drizzle-generated migration artifacts under `backend/drizzle` as the runtime migration source.
  - Rationale: `backend/src/db/migrate.ts` already executes `./drizzle`; fixing that path is safer than adding a second migration runner.
  - Alternative considered: point runtime migration at `backend/migrations`. Rejected because it would bypass existing Drizzle journal metadata.
- Make response schemas tolerant where the backend already returns nullable fields or older response variants.
  - Rationale: shared schemas are used across backend, frontend, and OpenAPI; they must describe real payloads and preserve compatibility tests.
  - Alternative considered: change backend to omit null fields. Rejected as broader and riskier because existing DB/service code and tests already rely on nullable values.
- Keep lint fixes behavioral-neutral.
  - Rationale: the goal is to unblock CI, not redesign state ownership.
  - Alternative considered: rewrite the opportunity detail panel. Rejected for scope.

## Risks / Trade-offs

- Generated Drizzle migration names are not semantically named -> use the generated artifact and keep reviewed legacy SQL files untouched unless later cleanup is requested.
- Schema compatibility can hide missing fields -> keep new recommendation gate support, but only default/optional where compatibility requires it.
- React hook lint fixes may touch state initialization -> preserve existing tests and run focused/full frontend tests.
