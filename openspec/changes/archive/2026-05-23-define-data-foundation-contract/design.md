## Context

The project has contract drafts for core workflows and has accepted a technical
blueprint that stages runtime work. Auth/team/tenant is defined as the stage 2
boundary, and data foundation is the next stage 3 prerequisite before any
protected workflow can persist real records.

The current app still has no PostgreSQL service, Drizzle schema, Zod schemas,
repositories, migrations, API routes, Server Actions, or runtime persistence.
This change therefore defines the data foundation contract and spec gates only.
It deliberately avoids creating tables or installing packages until a later
implementation OpenSpec can evaluate environment, secrets, provider, and test
setup.

Research and skill exploration affected the design:

- PostgreSQL official docs support modeling transactions, constraints, indexes,
  row-level security, and full-text search as part of data integrity and access
  design.
- Drizzle official docs support using schema declaration and migrations as the
  source of truth for future database shape.
- Zod official docs and Drizzle-Zod docs support explicit runtime validation at
  API, repository, and AI output boundaries.
- Next.js official docs reinforce Route Handlers as reusable API boundaries and
  Server Actions as UI mutation boundaries, not a place to bury domain or
  repository logic.
- OWASP guidance reinforces parameterized queries, sensitive log minimization,
  and careful error reporting for future repositories.
- `roadmap-planning` keeps the work sequenced before AI/RAG runtime because
  future AI outputs need stable record IDs, snapshots, and audit trails.

## Goals / Non-Goals

**Goals:**

- Define the future data foundation contract before database runtime begins.
- Fix shared concepts for tenant-scoped records, audit fields, migrations,
  validation schemas, repository transactions, idempotency, pagination, soft
  archive, data access policies, and sensitive logging.
- Require future persistent records to use domain names from badminton
  live-commerce workflows instead of generic `item`/`content` models.
- Define command/query shapes and error cases that future product/session/
  knowledge/AI/Q&A/talk-track/task repositories must follow.
- Update roadmaps and specs so data foundation is the next stage gate before
  real persistence.

**Non-Goals:**

- No PostgreSQL instance, managed database provider, database URL, credentials,
  migration file, Drizzle schema file, Zod package, repository implementation,
  route handler, Server Action, seed data, or tests are added.
- No auth provider selection.
- No RLS policy implementation; RLS can be evaluated later as defense-in-depth,
  but application-level authorization remains mandatory.
- No UI change, public preview update, Docker deployment, or Playwright run.

## Decisions

### Decision 1: Contract before schema files

The project will define `docs/contracts/data-foundation.md` before adding
Drizzle schema or migrations. This lets every future workflow use the same
tenant/team, audit, transaction, validation, and repository concepts.

Alternatives considered:

- Start with Drizzle tables now: faster, but would force schema decisions before
  the repository, auth, and workflow contract boundaries are fully connected.
- Let each workflow define its own persistence rules: flexible, but likely to
  create inconsistent ownership, audit, pagination, and soft-delete behavior.

### Decision 2: Repository layer is the data access boundary

Future UI, pages, and components must not call SQL/ORM clients. Route Handlers,
thin Server Actions, or domain services call repositories with `AuthContext`,
tenant/team scope, request IDs, and transaction options.

Alternatives considered:

- Put queries directly in Route Handlers: simpler at first but hard to reuse,
  test, authorize, and audit across workflows.
- Put queries in Server Actions: risks mixing UI mutation state with data,
  authorization, and transactions.

### Decision 3: Tenant/team and audit fields are default for protected records

Every protected business record should include tenant/team ownership, actor
audit fields, timestamps, archive state, and optional source/run references.
Public reference data must be explicitly marked public rather than silently
omitting ownership.

Alternatives considered:

- Add tenant/team later: unsafe because retrofitting ownership after real data
  exists is high-risk and could leak cross-team records.
- Use database RLS only: useful later, but not enough by itself; application
  guards and repository filters remain required.

### Decision 4: Validation sits at every boundary

Future runtime work should validate external input before domain/repository
logic, validate persisted/shared shapes before returning view models, and
validate AI-generated data before saving. Zod is the default direction because
it fits the TypeScript stack; implementation still needs dependency review.

Alternatives considered:

- TypeScript-only types: compile-time only; they do not protect runtime inputs,
  malformed AI output, or external payloads.
- Ad hoc validation inside handlers: inconsistent and hard to audit.

### Decision 5: Migrations and transactions are part of product behavior

Drizzle migrations must be repeatable, reviewed, rollback-aware, and tested
against empty and existing schemas. Repository write operations that create
related records, audit events, idempotency records, or state transitions must
use explicit transaction semantics.

Alternatives considered:

- Auto-sync schema from runtime code: risky for production and audit.
- Ignore idempotency until later: acceptable for static UI, but wrong for
  saves, AI runs, imports, retries, and webhook-like future integrations.

## Risks / Trade-offs

- Documentation before visible product value -> Mitigation: this contract is a
  prerequisite for safely saving the operator workflows already shaped in UI.
- Data model may still change during real implementation -> Mitigation: keep
  this contract at boundary level and require future implementation OpenSpec to
  update it if concrete schemas reveal better shapes.
- RLS could be over- or under-used later -> Mitigation: define it as
  defense-in-depth to evaluate, while keeping application authorization
  mandatory.
- Zod dependency is not installed in this wave -> Mitigation: record it as
  default direction; future runtime OpenSpec must handle dependency rationale,
  install, and verification.
- Long text and AI output storage can become expensive or sensitive ->
  Mitigation: require input limits, snapshot references, redaction, archive
  policy, and sensitive log blocking before persistence.

## Migration Plan

1. Add OpenSpec requirements for `data-foundation-contract` and related roadmap
   and architecture gates.
2. Add `docs/contracts/data-foundation.md`.
3. Update contract index, technical roadmap, AI goal, and autonomous roadmap.
4. Validate the change and markdown hygiene.
5. Archive the change and validate all accepted specs.

Rollback is documentation-only: revert the contract, roadmap, and spec updates.
No runtime data, dependency, migration, database, Docker image, or public
behavior changes.

## Open Questions

- Which managed PostgreSQL provider, connection pooling approach, and backup
  plan will be selected when runtime implementation begins.
- Whether the first implementation should create auth/team core tables first or
  a narrow product/session workflow with stubbed auth context in local tests.
- Whether PostgreSQL RLS should be enabled in the first database runtime slice
  or deferred until application guards are stable.
- Exact retention periods for audit events, archived records, AI snapshots, and
  idempotency keys.
- Concrete text limits for session notes, transcripts, AI outputs, and source
  extraction records.
