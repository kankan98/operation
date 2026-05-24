## Why

All workflow contracts now exist, but the application still has no database
runtime, migration path, repository boundary, or validation layer. The next
smallest useful wave is to implement a local-only stage-3 data foundation so
future product/session/knowledge/AI/task persistence can be built on stable,
tested tenant/team-scoped data primitives instead of page-local state.

Pre-proposal evidence:

- Reliable sources checked:
  - Next.js Route Handlers docs
    (`https://nextjs.org/docs/app/getting-started/route-handlers`) were checked
    because the project needs application-owned API/BFF boundaries rather than
    UI components calling database clients directly.
  - PostgreSQL current docs for constraints and row-level security
    (`https://www.postgresql.org/docs/current/ddl-constraints.html`,
    `https://www.postgresql.org/docs/current/ddl-rowsecurity.html`) were checked
    because tenant/team ownership, uniqueness, foreign keys, and optional RLS
    defense-in-depth must be modeled at the database layer.
  - Drizzle ORM migration docs (`https://orm.drizzle.team/docs/migrations`) were
    checked because the accepted architecture uses Drizzle migrations and the
    first runtime wave needs a repeatable generate/migrate workflow.
  - Zod JSON Schema docs (`https://zod.dev/json-schema`) were checked because
    API input, repository input, and later AI output boundaries need explicit
    TypeScript-compatible runtime validation.
  - Supabase Postgres best-practice skill guidance was checked for index,
    foreign-key, RLS-performance, and connection-management risks that should be
    captured before writing schema code.
- Relevant skills used:
  - `openspec-explore`: confirmed this must be a stage-3 proposal before code,
    with no UI persistence or provider shortcut.
  - `openspec-propose`: used to create governed OpenSpec artifacts before
    adding dependencies, schema, migration, repository, or local database tools.
  - `roadmap-planning`: confirmed this wave belongs after contract completion
    and before AI review/Q&A runtime because later features need stable record
    IDs, tenant/team scope, audit, and idempotency.
  - `build-web-apps:supabase-postgres-best-practices`: reinforced indexing
    foreign keys, indexing filter columns, keeping RLS as defense-in-depth, and
    treating connection policy as an explicit design decision.
- User-value check:
  - Target roles: live operator, host/assistant, product owner, reviewer, and
    team lead, indirectly through reliable future save/review/recover flows.
  - Workflow improved: future product library, session capture, knowledge,
    talk-track, AI review, Q&A, and next-session task persistence can share one
    data boundary instead of each page inventing incompatible storage.
  - Expected result: operators eventually get save, restore, audit, review, and
    task handoff without cross-team leakage or untraceable AI output.
  - Product highlight: invisible but valuable trust foundation: every future
    saved record can carry source, actor, tenant/team, audit, and validation
    evidence from day one.

## What Changes

- Add a local-only stage-3 data foundation runtime under the web app:
  - Drizzle/PostgreSQL configuration and migration workflow.
  - Zod validation boundary for shared data commands and queries.
  - Server-only database client and repository boundary.
  - Base schema for tenants, teams, app users, memberships, audit events, and
    idempotency records needed before protected workflow persistence.
  - Tenant/team-scoped repository helpers, pagination/idempotency/audit
    primitives, and redacted error shapes.
  - Local verification scripts and documentation for migration and repository
    checks.
- Update the data foundation contract and roadmaps so the contract status and
  runtime limits are clear after implementation.
- Keep this wave non-user-facing:
  - No `/api` route is exposed for real business CRUD.
  - No UI page saves real records.
  - No auth provider, AI provider, RAG, queue, object storage, analytics, or
    production database provider is adopted.
  - No public Docker preview deployment is required unless later code changes
    affect public frontend behavior.

## Capabilities

### New Capabilities

- `data-foundation-runtime`: Defines the first stage-3 runtime implementation
  for local PostgreSQL, Drizzle migrations, Zod validation, server-only database
  access, repository primitives, tenant/team ownership, audit/idempotency
  records, safe errors, and verification.

### Modified Capabilities

- `data-foundation-contract`: Updates the data foundation contract from
  runtime-not-implemented to partially implemented local-only runtime once the
  schema, migration, repository, and validation primitives are in place.
- `continuous-improvement-roadmap`: Records that data foundation runtime is the
  current prerequisite before workflow persistence and AI/RAG runtime.
- `technical-architecture-foundation`: Adds explicit requirements for local
  database runtime boundaries, dependency usage, and no direct UI database
  access.

## Impact

- Affected code: `apps/web` server-only data modules, root/app package scripts,
  Drizzle config, generated migrations, local database verification scripts, and
  documentation.
- Affected docs/specs: `docs/contracts/data-foundation.md`,
  `docs/architecture/technical-implementation-roadmap.md`,
  `docs/roadmap/ai-continuous-development-goal.md`,
  `docs/roadmap/autonomous-development-roadmap.md`, and the OpenSpec specs
  listed above.
- Dependencies to evaluate/add in implementation design:
  - Runtime: `drizzle-orm`, PostgreSQL driver (`postgres` or equivalent).
  - Development: `drizzle-kit`, `zod`, and a minimal repository test runner if
    needed.
- Affected runtime: local/stage-3 only. No production provider, no public user
  data, no UI save flow, and no AI/RAG calls.
- Verification: `openspec validate implement-data-foundation-runtime`, package
  install lockfile update, lint/typecheck/build, migration generation check,
  local migration/repository verification where a local PostgreSQL service is
  available, sensitive-log checks, and `openspec validate --all` after archive.
