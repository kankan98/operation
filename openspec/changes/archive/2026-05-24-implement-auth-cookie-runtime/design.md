## Context

The project currently has three auth layers:

- `auth-guard-foundation`: resolves app-owned users, tenants, teams,
  memberships, roles, permissions, and target scope into `AuthContext`.
- `auth-session-runtime`: validates an opaque app-owned session reference,
  stores only a hash in `auth_sessions`, and delegates to the auth guard.
- Static public workspace pages: no login page, no provider callback, no
  cookie mutation, no middleware/proxy gate, and no protected business CRUD.

The missing boundary is the request-facing bridge: future Route Handlers and
thin Server Actions need a standard way to read the session reference from a
cookie, issue the cookie safely after a future login/provider callback, clear
it during logout, and invalidate the app-owned session ledger.

External source conclusions used for this design:

- Next.js official authentication and cookie docs:
  `https://nextjs.org/docs/app/guides/authentication` and
  `https://nextjs.org/docs/app/api-reference/functions/cookies`
  - Authentication and authorization checks stay server-side.
  - Cookie mutation belongs in Server Actions or Route Handlers.
  - Route protection helpers do not replace data-layer authorization.
- OWASP Session Management Cheat Sheet:
  `https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html`
  - Session identifiers require enough entropy, secure cookie attributes,
    expiration, invalidation, and log redaction.
- NIST SP 800-63B session guidance:
  `https://pages.nist.gov/800-63-4/sp800-63b.html`
  - Session lifecycle, timeout, and verifier-controlled invalidation must be
    explicit.
- Auth.js official docs:
  `https://authjs.dev/reference/nextjs`
  - Auth.js remains a possible future provider adapter, but adopting it now
    would introduce provider and callback semantics outside this smallest
    prerequisite slice.

Skill-backed value exploration:

- OpenSpec exploration: all protected browser flows need this bridge, but the
  current evidence does not justify provider/login UI yet.
- Codebase recon: the repository is young and centralized around auth/data
  runtime files, so the change should be narrow and verifier-driven.
- Problem framing: the user-facing problem is not "add login" in isolation; it
  is "saved work must be tied to the right actor/team and stop after logout or
  invalid session state."
- TDD: add/extend a rollback verifier first and watch it fail before adding the
  runtime helpers.

## Goals / Non-Goals

**Goals:**

- Provide a server-only cookie runtime over the existing app-owned session
  ledger.
- Serialize the session cookie with explicit `HttpOnly`, `Secure`,
  `SameSite=Lax`, `Path=/`, and max-age attributes.
- Parse the session reference from a standard request `Cookie` header without
  exposing raw cookie values through safe return types.
- Resolve `AuthContext` from a request cookie by delegating to the existing
  session resolver and auth guard.
- Invalidate/logout a session by hashing the cookie value and updating the
  existing `auth_sessions` row with status, reason, verification timestamp, and
  update timestamp.
- Return only safe session summaries and safe auth errors.
- Add a local rollback verifier that proves cookie issue/clear/request/logout
  behavior without changing public pages.
- Update durable docs to distinguish cookie/request runtime from complete login
  provider work.

**Non-Goals:**

- No Auth.js, OAuth, password, magic link, SSO, hosted identity provider, CSRF
  callback flow, account linking, provider account table, or provider SDK.
- No public login/logout route, login page, team switcher UI, invite flow,
  middleware/proxy protection, or protected business CRUD.
- No changes to public static workspace rendering.
- No production auth policy, MFA, step-up auth, session cleanup job, device
  management, or browser UX for auth states.
- No new npm dependency and no new database table.

## Decisions

### 1. Add a focused `auth/cookie.ts` module

Create a server-only module that owns cookie serialization/parsing and
request-cookie resolution. Keep it separate from `auth/session.ts` so the
existing session resolver remains provider-neutral and reusable by future
non-cookie adapters.

Alternative considered: put cookie helpers directly in `session.ts`. Rejected
because the current session runtime is a lower-level ledger/resolver boundary;
cookie handling is an HTTP/request concern.

### 2. Use standards-based cookie parsing and serialization locally

Use simple, typed helpers over standard `Cookie` and `Set-Cookie` header shapes:

- `createAuthSessionSetCookieHeader(sessionReference, options?)`
- `createAuthSessionClearCookieHeader(options?)`
- `readAuthSessionReferenceFromCookieHeader(cookieHeader)`
- `resolveAuthContextFromRequestCookie(repository, requestLike, request)`
- `invalidateAuthSessionFromRequestCookie(repository, requestLike, request)`

`requestLike` only needs a `headers.get("cookie")`-compatible surface so the
verifier can use native `Request` and future Route Handlers can pass
`NextRequest` or standard `Request`.

Alternative considered: import Next.js `cookies()` directly. Rejected for this
wave because it would make verifier scripts depend on an App Router request
context. Future Server Actions/Route Handlers can wrap these pure helpers.

### 3. Keep raw cookie values transient only

The raw session reference necessarily exists inside the browser cookie and
incoming `Cookie` header, but the runtime will:

- never store it in the database,
- never include it in `AuthSessionSummary`,
- never include it in thrown error details,
- redact cookie/session/provider/token-shaped metadata,
- hash it before database lookup or invalidation.

Alternative considered: return the parsed cookie reference to callers for
manual resolution. Rejected because that spreads secret handling across future
Route Handlers.

### 4. Add invalidation to the session repository

Extend the existing session repository with a method that invalidates a session
by reference hash. The method should be idempotent for missing sessions and
return a small result such as:

- `invalidated: true` plus safe session summary when a row changed.
- `invalidated: false` and code `missing_cookie` / `session_not_found` when
  there is nothing to invalidate.

Use `revoked` with invalidation reason `logout` for explicit logout, and allow
other existing invalidation reasons for future membership/security events.

Alternative considered: only clear the browser cookie. Rejected because clearing
the client cookie does not revoke a stolen or copied session reference.

### 5. Verifier-first implementation

Add `auth:cookie-check` before production runtime. Run it and confirm failure
from missing exports/helpers, then implement the runtime until it passes. The
check should cover:

- Set-Cookie issue header includes expected security attributes.
- Cookie header resolves to an auth context.
- Missing cookie denies with `UNAUTHENTICATED`.
- Expired/revoked/invalidated session cookies deny.
- Logout invalidates the ledger and returns a clear-cookie header.
- Reusing a logged-out cookie is denied.
- Sensitive cookie/session/provider/token-shaped metadata stays redacted.
- The transaction rolls back.

Alternative considered: browser-only verification. Rejected because there is no
auth UI surface yet and the risk is server-side cookie/session behavior.

## Risks / Trade-offs

- Cookie helper could be mistaken for complete login → Contract, roadmap, and
  specs state provider/login/UI/middleware are still missing.
- Raw cookie could leak through errors → Only pass raw values internally and
  expand verifier redaction checks.
- `Secure` cookies make local HTTP manual tests awkward → Keep `Secure` as the
  default because public preview and future production need safe defaults; local
  Route Handler wrappers can decide explicit dev behavior through OpenSpec if
  required.
- No CSRF strategy yet → Do not add browser mutation routes in this change; a
  real login/logout/API change must define CSRF behavior separately.
- No session cleanup job → Logout and request resolution handle active paths;
  retention/cleanup remains a later productionization task.
- No middleware/proxy gate → Future pages can still render public/static
  content. Protected data remains guarded at Route Handler/repository level.

## Migration Plan

1. Add failing `auth-cookie-check` verifier and package scripts.
2. Add `auth/cookie.ts` request/cookie helpers.
3. Extend `auth/session.ts` with safe session invalidation by reference.
4. Export the new runtime through `auth/index.ts`.
5. Update auth contract, roadmap, README, and accepted spec deltas.
6. Run OpenSpec validation, local auth verifier scripts, typecheck, lint, and
   build.

Rollback:

- Remove `auth/cookie.ts`, invalidation helper additions, verifier script,
  package scripts, docs/spec deltas, and README updates. The existing local
  guard and session resolver continue to work.

## Open Questions

- Which provider/login approach should issue the session reference after real
  identity verification?
- Should future logout be a Route Handler, Server Action, or both?
- Which browser routes should eventually require middleware/proxy redirects
  versus data-layer authorization only?
- Should local development ever allow non-`Secure` cookies, or should all auth
  browser tests use HTTPS/public preview once login UI exists?
