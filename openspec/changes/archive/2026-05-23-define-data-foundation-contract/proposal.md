## Why

The next runtime-enabling gap is the data foundation boundary: future products,
sessions, knowledge, AI review runs, Q&A answers, talk tracks, and tasks cannot
be safely persisted until tenant/team ownership, migrations, validation,
repositories, transactions, idempotency, and audit semantics are defined. This
wave creates the contract and accepted specs only; it does not add database
runtime code or dependencies.

Pre-proposal evidence:

- Reliable sources checked:
  - PostgreSQL official docs (`https://www.postgresql.org/docs/current/`) were
    checked for transactions, constraints, indexes, row-level security, and
    full-text search because the accepted architecture uses PostgreSQL as the
    authoritative relational store.
  - Drizzle ORM official docs (`https://orm.drizzle.team/docs`) were checked
    for schema declaration and migrations because future schema changes must be
    migration-managed rather than inferred from UI state.
  - Zod official docs (`https://zod.dev/`) and Drizzle-Zod docs were checked
    because future API inputs, repository boundaries, and AI outputs need typed
    validation before persistence.
  - Next.js official Route Handlers and Server Actions docs
    (`https://nextjs.org/docs/app`) were checked because future persistent
    workflows should use route handlers as reusable API boundaries and keep
    Server Actions thin.
  - OWASP SQL Injection Prevention and Logging guidance were checked because
    future repositories and logs will handle sensitive live-commerce business
    data and must avoid raw payload leakage.
- Relevant skills used:
  - `openspec-explore`: confirmed this should remain a contract/spec wave, not
    database runtime implementation.
  - `openspec-propose`: used to create a governed change before adding data
    foundation artifacts.
  - `roadmap-planning`: confirmed data foundation is the next enabling stage
    after auth/team/tenant and technical blueprint, before AI/RAG runtime.
  - `build-web-apps:supabase-postgres-best-practices`: reinforced planning
    indexes, tenant filters, RLS as defense-in-depth, transaction boundaries,
    and query patterns before implementation.
- User-value check:
  - Target roles: live operator, product owner, reviewer, team lead, and future
    admin.
  - Workflow improved: future saved products, sessions, knowledge sources, AI
    runs, Q&A answers, talk tracks, and tasks will be recoverable, scoped to the
    right team, and auditable.
  - Expected result: operators can later trust saved records and AI outputs
    because every protected record has ownership, validation, version/audit
    metadata, and a clear failure path.
  - Product highlight: future records can show "who changed what, from which
    source/run, under which team" without turning the UI into developer tooling.

## What Changes

- Add a `data-foundation` contract draft under `docs/contracts/` covering:
  - runtime non-implementation status and stage gates,
  - PostgreSQL/Drizzle/Zod/repository boundary,
  - tenant-scoped records, audit fields, migrations, transactions,
    idempotency, pagination, soft archive, validation schemas, and data access
    policies,
  - command/query shapes and common error cases,
  - authorization, sensitive data, logging, audit metadata, and verification.
- Update `docs/contracts/README.md` so `data-foundation` is part of the current
  contract baseline.
- Update roadmap and goal documents so future data runtime starts from this
  contract and not from ad hoc tables or UI state.
- Update the technical roadmap so stage 3 has a data-foundation contract gate
  before adding Drizzle schema, migrations, repositories, or persistent records.
- Update OpenSpec specs to require the data foundation contract before
  database-backed protected workflows.
- No PostgreSQL service, Drizzle package, Zod package, database URL, migration,
  table, repository code, route handler, Server Action, Docker deployment, or
  public preview change is introduced.

## Capabilities

### New Capabilities

- `data-foundation-contract`: Defines the future PostgreSQL, Drizzle migration,
  schema validation, repository, transaction, idempotency, tenant/team
  ownership, audit, soft archive, sensitive data, and verification contract.

### Modified Capabilities

- `continuous-improvement-roadmap`: Adds `data-foundation` as the next
  runtime-enabling contract before database-backed product, session, knowledge,
  AI, Q&A, talk-track, task, feedback, or export workflows.
- `technical-architecture-foundation`: Adds explicit data foundation contract
  requirements before Drizzle schema, migrations, repositories, API persistence,
  protected records, or tenant-scoped data access.
- `technical-blueprint`: Records that data foundation implementation must
  follow stage 3, the auth/team/tenant boundary, repository ownership, and
  verification gates.

## Impact

- Affected documentation: `docs/contracts/data-foundation.md`,
  `docs/contracts/README.md`,
  `docs/architecture/technical-implementation-roadmap.md`,
  `docs/roadmap/ai-continuous-development-goal.md`, and
  `docs/roadmap/autonomous-development-roadmap.md`.
- Affected OpenSpec specs after archive: new `data-foundation-contract` and
  updated `continuous-improvement-roadmap`,
  `technical-architecture-foundation`, and `technical-blueprint`.
- Affected runtime: none.
- Dependencies: none.
- Verification: `openspec validate define-data-foundation-contract`, markdown
  hygiene checks, and `openspec validate --all`. Playwright and Docker deploy
  are skipped because this is a contract/specification wave with no rendered UI
  or runtime preview change.
