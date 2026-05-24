## Context

The project already has a local-only auth guard foundation:

- `createAuthGuardRepository()` resolves an `AuthContext` from app-owned
  user/tenant/team/membership rows.
- `requireAuthorizedDataAccess()` enforces permission, role, and target scope,
  then converts the result into repository `DataAccessContext`.
- Protected domain repositories already rely on tenant/team-scoped contexts,
  but there is no runtime that resolves a browser/session reference into an
  actor. A caller can only pass `actorId` directly.

This change is stage 2 auth runtime prework. It intentionally stays local-only:
it prepares the session boundary required before public API/Server Action save
flows, without selecting Auth.js/OAuth/password/magic-link, adding login pages,
or mutating cookies.

External source conclusions used for the design:

- Next.js official authentication guide:
  `https://nextjs.org/docs/app/guides/authentication`
  - Auth checks for protected data must remain server-side.
  - Middleware can help route users but is not the whole authorization boundary.
- Auth.js official session strategies:
  `https://authjs.dev/concepts/session-strategies`
  - Database sessions are a valid strategy when server-side revocation and
    lifecycle control matter.
  - Provider/session strategy should not leak into business authorization.
- OWASP Session Management Cheat Sheet:
  `https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html`
  - Session IDs must be protected with secure cookie attributes, expiration,
    invalidation, and log redaction.
- NIST SP 800-63B:
  `https://pages.nist.gov/800-63-3/sp800-63b.html`
  - Session lifecycle and timeout decisions must be explicit and verifiable.
- DeepSeek official docs:
  `https://api-docs.deepseek.com/zh-cn/`
  - Confirms the user-supplied base URL/model direction for AI provider work.
    This change does not call DeepSeek and does not persist the API key.

Skill-backed value exploration:

- OpenSpec exploration: this is the smallest coherent auth wave because all
  protected workflow repositories are blocked by missing session resolution.
- Jobs-to-be-Done: operators are trying to save team work safely, not to manage
  auth settings. The feature reduces the risk of saving under the wrong actor or
  continuing access after a role/membership change.
- Brainstorming constraint: the product highlight is operational trust, not
  visible decoration. The runtime will produce safe, audit-ready session and
  authorization outcomes that can later power clear UI states.

## Goals / Non-Goals

**Goals:**

- Add a local app-owned `auth_sessions` ledger with explicit lifecycle states.
- Store only a hash of opaque session references; never store or return the raw
  session reference.
- Add server-only helpers for creating and hashing high-entropy local session
  references.
- Add an `AuthPort`-style resolver that accepts a session reference plus
  requested tenant/team/permission, validates the session, and delegates to the
  existing guard for app-owned authorization.
- Return/throw only safe metadata that redacts session, cookie, token, provider,
  password, and secret-shaped fields.
- Add a rollback verifier that proves valid and denied paths without changing
  public UI behavior.
- Update durable docs so future agents know this is local session prework, not a
  complete production login provider.

**Non-Goals:**

- No login page, signup, logout route, callback route, password, magic link,
  OAuth, Auth.js/Clerk/Auth0/Descope SDK, or hosted provider.
- No middleware protection, public Route Handler, Server Action, browser cookie
  mutation, or protected CRUD.
- No real AI provider call and no storage of the user-provided DeepSeek key.
- No invitation delivery, team management UI, step-up authentication, MFA, or
  production session policy.
- No new npm dependency.

## Decisions

### 1. App-owned session ledger before provider selection

Use a local `auth_sessions` table owned by the application:

- `id`
- `userId`
- `sessionReferenceHash`
- `providerSessionId` nullable reference field
- `status`: `active`, `expired`, `revoked`, `invalidated`, `archived`
- `issuedAt`, `expiresAt`, `lastVerifiedAt`
- `invalidatedReason`: nullable enum covering logout, membership removal, role
  change, security event, provider revocation, expiration, and unknown
- `createdAt`, `updatedAt`

Alternative considered: adopt Auth.js database adapter now. Rejected for this
wave because provider choice, callback flows, cookie mutation, CSRF behavior,
and login UX remain unresolved. The app-owned ledger preserves the future
adapter path while keeping business authorization provider-neutral.

### 2. Hash opaque references, not raw session tokens

Generate session references with Node `crypto.randomBytes(32).toString("base64url")`
and store `sha256` hashes. The raw reference is returned only by the local
helper that creates it and is never persisted, included in errors, or returned
from the resolver.

Alternative considered: store provider session IDs as the primary lookup key.
Rejected because it would couple protected repositories to a future provider
shape and make local verification weaker.

### 3. Resolver delegates to existing guard

The new resolver will validate the session and user first, then call the
existing `requireAuthContext()` path with:

- request ID
- session user ID as `actorId`
- requested tenant/team
- required permission
- allowed roles and target scope when present

This keeps membership, permission, role, and target-scope behavior in one
existing path instead of duplicating authorization logic.

Alternative considered: return `DataAccessContext` directly from session
runtime. Rejected because callers may need the full auth view, session summary,
and guard decision before entering a repository.

### 4. Local verifier acts as the first test suite

The current project uses rollback verifier scripts instead of a dedicated test
runner for server-only repository slices. This change follows the same pattern
with `auth:session-check` and uses TDD by adding the verifier before production
runtime.

The verifier must cover:

- active session resolves context
- expired session is denied
- revoked session is denied
- invalidated session is denied
- inactive membership is denied after session resolution
- cross-team target is denied
- missing permission is denied
- redaction does not expose raw session/provider/cookie/token data
- transaction rollback

Alternative considered: add Vitest/Jest. Rejected for this wave because it
would introduce new tooling and dependencies for a pattern the repository
already verifies through focused rollback scripts.

### 5. Cookie options are documented but not wired

The runtime may expose a pure `authSessionCookieOptions` constant for future
Route Handler/Server Action use: HttpOnly, Secure, SameSite=Lax, Path=/, and an
explicit max age. It will not set cookies in this wave.

Alternative considered: implement a login/logout route now. Rejected because it
would require provider/login UX decisions and browser verification outside the
smallest local runtime slice.

## Risks / Trade-offs

- Session runtime could be mistaken for production login -> Docs and specs mark
  it local-only and list remaining provider/login non-goals.
- Raw session references could leak in errors -> Store only hashes and extend
  redaction checks to session/provider/cookie/token-shaped fields.
- Authorization logic could drift -> Delegate role, permission, membership, and
  target-scope checks to the existing guard path.
- Expired session cleanup is not implemented -> Deny expired sessions now;
  cleanup/retention remains a later productionization task.
- SHA-256 hashing depends on high-entropy references -> Generate 32-byte random
  base64url references and never accept predictable references in verifier
  fixtures.
- Migration churn in a dirty worktree -> Keep schema/migration changes scoped to
  auth session tables and avoid touching unrelated domain tables.

## Migration Plan

1. Add schema enums/table and generate a Drizzle migration.
2. Add server-only auth session types/helpers/repository.
3. Add `auth:session-check` scripts at web and root levels.
4. Update docs and specs.
5. Run `openspec validate implement-auth-session-runtime`, local verifier, and
   project checks.

Rollback:

- Remove the `auth_sessions` migration/schema/runtime/script/docs updates.
- Existing public pages and local guard foundation continue to work.

## Open Questions

- The first real provider/login runtime remains undecided.
- Cookie issuance, logout, CSRF strategy, middleware, and browser UI states are
  intentionally deferred.
- Session retention length and cleanup/archive policy require production
  operational decisions.
- Step-up authentication rules for exports, member management, and high-risk
  AI/provider settings remain future work.
