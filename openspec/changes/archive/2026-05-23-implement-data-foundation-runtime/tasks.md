## 1. Dependency And Local Database Setup

- [x] 1.1 Add data runtime dependencies and scripts for Drizzle, PostgreSQL driver, Zod, server-only boundary, and local verification tooling.
- [x] 1.2 Add local database environment documentation and example configuration without committing secrets.
- [x] 1.3 Add a local PostgreSQL development service or documented local database command that does not affect public Docker preview deployment.

## 2. Schema And Migration

- [x] 2.1 Add Drizzle configuration for the web app and keep migration output under a predictable checked-in path.
- [x] 2.2 Implement base schema for tenants, teams, app users, tenant memberships, team memberships, role permissions, audit events, and idempotency records.
- [x] 2.3 Add constraints and indexes for tenant/team scope, foreign keys, status filters, membership lookups, audit targets, and idempotency keys.
- [x] 2.4 Generate and check in the first reviewed Drizzle migration.

## 3. Runtime Boundary

- [x] 3.1 Add server-only database environment validation and client modules that fail closed when database config is missing.
- [x] 3.2 Add explicit data/auth context types for repository commands and queries without depending on an auth provider SDK.
- [x] 3.3 Add repository primitives for audit events, idempotency records, transactions or transaction-ready helpers, pagination shape, and tenant/team scope enforcement.
- [x] 3.4 Add structured data errors and redaction helpers so database failures do not leak secrets, SQL internals, prompts, transcripts, or customer data.

## 4. Verification

- [x] 4.1 Add local schema/repository verification scripts or tests that can run against a local PostgreSQL database.
- [x] 4.2 Run package install/update and verify lockfile changes are intentional.
- [x] 4.3 Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- [x] 4.4 Run migration generation or repeatability checks and local repository verification when PostgreSQL is available.
- [x] 4.5 Run `openspec validate implement-data-foundation-runtime`.

## 5. Documentation And Roadmap

- [x] 5.1 Update `docs/contracts/data-foundation.md` to mark the local runtime surface as partially implemented while keeping user-facing workflow persistence out of scope.
- [x] 5.2 Update `docs/architecture/technical-implementation-roadmap.md` with the implemented stage-3 pieces and remaining stage gates.
- [x] 5.3 Update `docs/roadmap/ai-continuous-development-goal.md` and `docs/roadmap/autonomous-development-roadmap.md` with the new current state and next candidate wave.
- [x] 5.4 Update app/root README documentation for local database setup and verification commands.

## 6. Archive

- [x] 6.1 Archive the completed OpenSpec change after implementation and verification pass.
- [x] 6.2 Run `openspec validate --all` after archive.
