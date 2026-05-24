## 1. Proposal Validation

- [x] 1.1 Validate the OpenSpec change artifacts before implementation.

## 2. Test-First Verification Surface

- [x] 2.1 Add a rollback-style `rackets:check` verification script that describes the expected persistence behavior before production implementation exists.
- [x] 2.2 Run `pnpm rackets:check` and observe the expected failure before adding the repository and schema implementation.

## 3. Schema And Migration

- [x] 3.1 Add racket product and alias enums/tables to the Drizzle schema with tenant/team ownership, audit fields, scoped unique constraints, and indexes.
- [x] 3.2 Generate and review the Drizzle migration for the racket product persistence schema.

## 4. Repository Runtime

- [x] 4.1 Add server-only racket repository types, validation, normalization, safe domain errors, permission checks, product creation, alias creation, scoped list queries, and downstream readiness mapping.
- [x] 4.2 Wire root and web package scripts for `rackets:check`.

## 5. Documentation

- [x] 5.1 Update the racket product library contract to reflect the partial local-only product and alias persistence runtime.
- [x] 5.2 Update roadmap/goal notes with the new current state, next-step sequencing, and Docker cadence if needed.

## 6. Verification

- [x] 6.1 Apply local migrations and run `pnpm rackets:check`, `pnpm db:check`, and `pnpm auth:check` against local PostgreSQL.
- [x] 6.2 Run `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `openspec validate implement-racket-product-persistence`.
- [x] 6.3 Review the implementation against the active OpenSpec and record skipped public Docker/Playwright verification with reason.
