## Context

The repository now has a static Next.js operator workspace plus contract drafts
for racket products, sessions, knowledge, AI review runs, Q&A answers,
auth/team/tenant, data foundation, talk tracks, and next-session tasks. The
next roadmap item is stage 3 data foundation runtime, but there is still no
database connection, schema, migration workflow, validation package, repository
boundary, or local database verification path.

The auth provider is not implemented. That creates an important boundary: this
wave may implement local data infrastructure and tenant/team-aware primitives,
but it must not expose real protected business persistence through UI or API
routes. Repository methods can accept a project-owned auth/data context in
tests and future services; they cannot depend on provider SDK objects or trust
client-provided tenant IDs.

Research and skill exploration affected the design:

- Next.js Route Handlers remain the future BFF/API boundary, but this wave does
  not need public routes yet. That keeps the database client away from UI code.
- PostgreSQL constraints, foreign keys, indexes, transactions, and RLS support
  the accepted data model, but RLS should be treated as defense-in-depth until
  the app has a real auth/session runtime and tested policy context.
- Drizzle migrations fit the accepted architecture by producing reviewed,
  checked-in SQL migration artifacts rather than ad hoc schema changes.
- Zod fits the validation boundary for API/repository inputs and later AI
  output, but Drizzle table types still own database shape.
- Supabase/Postgres best-practice guidance reinforced indexing tenant/team,
  owner, state, and foreign-key columns early, and keeping connection behavior
  explicit.

## Goals / Non-Goals

**Goals:**

- Implement a local-only PostgreSQL + Drizzle data foundation for the web app.
- Add explicit migration, schema, validation, repository, audit, idempotency,
  error, and environment boundaries.
- Add base tables for tenants, teams, app users, tenant/team memberships, audit
  events, and idempotency records because these are prerequisites for protected
  records.
- Keep all database access server-only and behind repository helpers.
- Provide local verification scripts or commands for migration and repository
  smoke checks.
- Update the data foundation contract and roadmap documents to reflect partial
  local runtime implementation and remaining limits.

**Non-Goals:**

- No auth provider is selected or implemented.
- No real product/session/knowledge/AI/talk-track/task CRUD is exposed.
- No user-facing UI saves records.
- No production database provider, connection pooler, backup service, queue,
  object storage, observability provider, analytics, AI provider, or RAG runtime
  is adopted.
- No public Docker preview redeploy is required unless later implementation
  changes rendered frontend behavior.

## Decisions

### Decision 1: Scope is local-only stage 3, not production persistence

Implementation should add local database runtime primitives and tests, while
keeping public preview and user-facing pages static. `DATABASE_URL` is required
only for local migration/repository verification. Missing database config must
fail closed for database scripts and must not break static public pages.

Alternatives considered:

- Jump directly to product/session persistence: rejected because auth runtime is
  not implemented and protected business records would risk unclear ownership.
- Keep writing more contracts only: rejected because the core workflow contracts
  are now complete and the next blocker is executable data infrastructure.

### Decision 2: Drizzle + PostgreSQL is implemented through app-owned modules

Use `drizzle-orm`, `drizzle-kit`, and a PostgreSQL driver behind
`apps/web/src/server/db/*`. `drizzle.config.ts` should be repository-owned, but
schema and runtime modules live with `apps/web` because the first app owns the
current data runtime. UI imports from `src/server/db` must be avoided.

Alternatives considered:

- Raw SQL files only: transparent, but loses TypeScript schema integration and
  repeats accepted Drizzle decision work.
- Prisma: mature, but conflicts with accepted Drizzle migration baseline.
- SQLite/local file storage: easier, but conflicts with accepted PostgreSQL
  tenant/team, transaction, full-text, and future pgvector needs.

### Decision 3: Base schema starts with identity, ownership, audit, and idempotency

The first migration should define tenant/team/app-user/membership primitives,
role permissions where needed, audit events, and idempotency records. It should
not create every workflow table at once. Workflow tables land in later stage-4
OpenSpec changes using their contracts.

Alternatives considered:

- Create all workflow tables now: rejected because it would turn contract
  drafts into database shape before runtime slices prove exact needs.
- Create only a generic tenant-scoped-record table: rejected because it would
  flatten important domain and authorization concepts.

### Decision 4: Repository context is explicit and testable

Repository helpers should accept a validated data/auth context containing
`requestId`, `actorId`, `tenantId`, `teamId`, role/permissions, and optional
transaction. Tests can use fixture contexts. Later AuthPort runtime can produce
the same context without changing repository call sites.

Alternatives considered:

- Let repositories read global session state: easier in Next.js, but couples
  data access to auth provider implementation and makes tests fragile.
- Trust tenant/team IDs from request body: rejected by security rules.

### Decision 5: Zod validates boundaries, Drizzle owns database schema

Use Zod for environment validation, repository command/query inputs, pagination
shape, idempotency input, and redacted error response shapes. Drizzle schema and
migrations remain the database source of truth.

Alternatives considered:

- Validate only with TypeScript: insufficient at runtime.
- Generate all Zod schemas from Drizzle immediately: useful later, but optional
  for the first wave and may add unnecessary dependency surface.

### Decision 6: RLS is deferred until policy context can be tested

The schema should preserve tenant/team columns and indexes needed for RLS, but
the first runtime should not claim RLS security until auth/session context and
policy tests exist. Application guard and repository filters are mandatory from
the start; RLS can be added as defense-in-depth in a later change.

Alternatives considered:

- Enable RLS immediately with placeholder policies: can create false confidence
  and hard-to-debug local behavior without real session context.
- Never use RLS: misses PostgreSQL defense-in-depth value for protected data.

## Risks / Trade-offs

- Database runtime without auth can be misused for protected data -> Mitigation:
  no UI/API persistence, local-only scripts, explicit repository context, and
  docs stating that protected workflow CRUD waits for auth/runtime changes.
- Adding dependencies increases maintenance surface -> Mitigation: use the
  already accepted stack choices, record why each dependency is required, and
  verify lint/type/build after install.
- Migrations may drift from docs -> Mitigation: generated migrations are checked
  in, reviewed, and tied to `drizzle.config.ts` and validation scripts.
- Local Postgres may not be available in every environment -> Mitigation:
  provide a local Docker profile or documented fallback; mark DB integration
  checks as skipped only when the service is unavailable.
- Tenant/team indexes can be missed early -> Mitigation: schema tasks explicitly
  require indexes for foreign keys, tenant/team filters, status, and common
  list queries.
- RLS deferred can look weaker than expected -> Mitigation: document it as a
  later defense-in-depth gate, not as current protection.

## Migration Plan

1. Add dependencies and scripts for Drizzle, PostgreSQL driver, Zod, and local
   verification tooling.
2. Add local environment documentation and fail-closed env validation.
3. Add Drizzle config, schema modules, and first generated migration.
4. Add server-only database client and repository primitives.
5. Add data errors, redaction helpers, audit/idempotency helpers, and tests or
   smoke checks.
6. Run package, type, build, migration, and repository verification.
7. Update data foundation contract, roadmap, and accepted specs before archive.

Rollback path:

- Revert dependency and lockfile changes, `drizzle.config.ts`, migrations,
  `src/server/db/*`, scripts, and documentation updates.
- No production data migration or public deployment rollback is required because
  this wave does not touch a production database or public UI behavior.

## Open Questions

- Whether the implementation should add a new test runner or use the smallest
  possible TypeScript smoke scripts for repository verification.
- Whether local Postgres should be added to the existing `docker-compose.yml`
  behind a profile or documented as a separate command.
- Whether the first schema should include role-permission seed data or only the
  tables needed to store it.
- Whether a later auth runtime should use database-backed sessions or an
  adapter from a provider; this wave must preserve both options.
