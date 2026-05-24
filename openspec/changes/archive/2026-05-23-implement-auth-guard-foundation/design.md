## Context

The app now has a local-only data foundation with tenants, teams, app users,
memberships, role permissions, audit events, and idempotency records. The auth
contract exists, but there is still no runtime boundary that can turn those
records into an authorization decision before future workflow repositories are
called.

The project must not save protected product, session, knowledge, AI, talk-track,
or task records until server-side tenant/team authorization exists. It also must
not bind UI, domain, repository, AI, or integration code directly to an auth
provider SDK. This wave therefore implements the app-owned guard surface first
and defers provider session, OAuth, magic link, password, invitation delivery,
middleware, and login UI decisions.

Research and skill exploration affected the design:

- Next.js App Router authentication guidance supports keeping authorization
  checks close to server data access and protected server surfaces.
- OWASP authorization guidance supports deny-by-default and least-privilege
  decisions for each protected operation.
- OWASP session guidance supports keeping session identifiers opaque and
  avoiding sensitive token/cookie leakage in logs.
- Auth.js Drizzle integration remains a plausible future provider route, but
  adopting it now would introduce provider tables, callback/session behavior,
  and credentials before the app-owned authorization guard is verified.

## Goals / Non-Goals

**Goals:**

- Implement a provider-neutral, local-only auth guard foundation under
  `apps/web/src/server/auth`.
- Resolve an app-owned `AuthContext` from existing tenant/team/user/membership
  rows without depending on provider SDK types.
- Enforce active tenant/team membership, role, permission, and tenant/team
  scope before repository code can receive a data access context.
- Provide typed and Zod-validated request, context, decision, and safe error
  shapes.
- Add local verification that proves allowed access, missing permission,
  inactive membership, and cross-team access are denied inside a rollback
  transaction.
- Update contract and roadmap docs to distinguish this partial guard runtime
  from real login/provider runtime.

**Non-Goals:**

- No auth provider SDK, Auth.js, OAuth, password login, magic link, email
  provider, SSO, or hosted identity service is selected.
- No login page, logout button, middleware, invitation UI, team management UI,
  protected route handler, or public API is exposed.
- No provider account, session, invitation, or workflow-specific migration is
  added unless implementation proves the existing base schema cannot support
  the guard checks.
- No RLS policy, production auth service, production database provider, cookie
  strategy, CSRF strategy, or step-up auth runtime is claimed.
- No protected business workflow records are saved.

## Decisions

### Decision 1: Implement the guard before selecting a provider

Add app-owned auth modules that can resolve and authorize application users from
the existing local data foundation records. A future provider adapter can call
the same resolver after it validates a session.

Alternatives considered:

- Auth.js first: useful later, but it would lock in provider/session tables and
  callback behavior before the application authorization boundary is tested.
- Docs-only provider decision: lower risk, but it does not remove the current
  blocker for protected workflow repositories.
- UI-only role banners: rejected because UI controls are not an authorization
  boundary.

### Decision 2: Keep the runtime local-only and server-only

All modules live under `src/server/auth` and import `server-only` where runtime
code can touch auth or database state. Static pages must still render without
auth or database environment variables.

Alternatives considered:

- Add middleware now: rejected because there is no provider session or protected
  route surface yet, and global middleware could accidentally turn static pages
  into auth-dependent routes.
- Add route handlers now: rejected because no user-facing workflow CRUD should
  be exposed before the guard is verified.

### Decision 3: Use explicit authorization requests and decisions

The guard receives a request containing request ID, actor ID, requested
tenant/team, target action, required permission, and optional target ownership.
It returns an `AuthContext` or throws/returns a structured `AuthorizationDecision`
with a safe user-facing message.

Alternatives considered:

- Let repositories infer permissions from role strings: rejected because it
  spreads authorization logic across repositories and makes auditing harder.
- Trust a client-selected team ID: rejected by the security and contract rules.

### Decision 4: Map authorized context to existing repository context

After authorization succeeds, helper code converts `AuthContext` to the existing
`DataAccessContext` shape so current and future repositories can share one
tenant/team/actor context.

Alternatives considered:

- Duplicate repository context types in auth: rejected because it creates two
  similar but divergent shapes.
- Make data foundation parse provider sessions: rejected because auth/provider
  concerns belong in the auth boundary.

### Decision 5: Verification uses a local rollback smoke script

Add an auth check script that creates fixture tenants, teams, users,
memberships, and roles in a transaction, exercises allowed and denied paths, and
rolls back. This matches the existing data foundation verification pattern
without adding a test runner yet.

Alternatives considered:

- Add a new test runner now: deferred until more runtime modules exist.
- Manual verification only: rejected because authorization regressions need
  repeatable negative-path evidence.

## Risks / Trade-offs

- Guard runtime without provider can be mistaken for full login support ->
  Mitigation: docs, specs, and README must mark provider/login runtime as out of
  scope.
- Role policy drift between docs and code -> Mitigation: keep role permission
  mapping in one auth module and verify representative roles.
- Existing role_permissions table may duplicate code mapping -> Mitigation:
  this wave can use code-owned policy for deterministic local checks; a later
  provider/team-management wave can decide whether to seed/persist policy.
- No middleware yet means pages are still public -> Mitigation: this wave does
  not expose protected data; future protected routes must add middleware or
  route-level guards under a new OpenSpec.
- Local verification depends on PostgreSQL -> Mitigation: final reports must
  distinguish DB-backed checks from non-DB static checks and document rerun
  commands when PostgreSQL is unavailable.

## Migration Plan

1. Add server-only auth types, permission policy, errors, guard, resolver, and
   exports under `apps/web/src/server/auth`.
2. Add an auth guard verification script and root/app package scripts.
3. Run local PostgreSQL verification against the existing data foundation
   schema; avoid generating a new migration unless the guard truly requires one.
4. Update auth contract, technical roadmap, continuous roadmap, and README docs.
5. Validate OpenSpec and run lint/typecheck/build.

Rollback path:

- Remove `src/server/auth/**`, auth check scripts, package script additions, and
  docs/spec updates. No production provider or production data rollback is
  required because this wave does not expose login or protected workflow CRUD.

## Open Questions

- Which provider should satisfy `AuthPort` later: Auth.js, a database-backed
  custom session adapter, Clerk/Auth0/Descope, or another option.
- Whether the first real login should use OAuth, email magic link, password, or
  another method.
- Which high-risk actions require step-up auth when team management and exports
  exist.
- Whether role permissions should remain code-owned, be seeded into
  `role_permissions`, or support both with audit metadata.
