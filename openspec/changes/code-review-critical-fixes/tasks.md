## 1. Migration Path

- [x] 1.1 Generate or add Drizzle runtime migrations for opportunity decision trace and action outcome columns.
- [x] 1.2 Verify the configured backend migration path contains the columns used by `backend/src/db/schema.ts`.

## 2. Shared Schema Compatibility

- [x] 2.1 Update shared product response schema to accept backend nullable response fields.
- [x] 2.2 Preserve compatibility for opportunity responses without recommendation gate while accepting recommendation gate when present.
- [x] 2.3 Add or update focused schema tests for the compatibility cases.

## 3. Lint Blockers

- [x] 3.1 Fix backend opportunities route lint error without changing query behavior.
- [x] 3.2 Fix frontend Opportunities React hook lint errors without changing decision/action outcome behavior.

## 4. Specs, Docs, and Validation

- [x] 4.1 Sync accepted requirements into main specs and update current change status.
- [x] 4.2 Run backend build, backend lint, backend tests, frontend build, frontend lint, frontend tests, OpenSpec validation, active-change check, and diff whitespace validation.
