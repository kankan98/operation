## Why

The project can now resolve an opaque app-owned session reference into an
`AuthContext`, but future Route Handlers and Server Actions still have no safe
way to read that reference from a request cookie, issue the cookie header, clear
it on logout, or invalidate the underlying session. This blocks protected
browser save flows for products, sessions, knowledge, AI review runs, talk
tracks, and next-session tasks.

Reliable-source checks shaped the scope:

- Next.js official authentication guidance keeps authorization checks on the
  server and treats the framework request/cookie boundary as the place where
  apps read, set, and delete auth cookies.
- Next.js official `cookies` documentation confirms cookie mutation belongs in
  Server Actions or Route Handlers, not arbitrary rendering code.
- OWASP Session Management guidance reinforces high-entropy server-side session
  identifiers, `HttpOnly`, `Secure`, `SameSite`, explicit expiration,
  invalidation, and avoiding session values in logs.
- NIST SP 800-63B session guidance reinforces explicit session lifecycle,
  timeout, and verifier-controlled session invalidation.
- Auth.js remains a valid future provider candidate, but adopting it now would
  force provider, callback, CSRF, account-linking, and login UX choices before
  the project has a protected workflow ready to expose.

Skill-backed value exploration:

- OpenSpec exploration: the smallest coherent next auth wave is a cookie and
  request bridge over the existing session ledger, not a full provider/login
  implementation.
- Codebase recon: this is a very young repo with auth/data runtime files as the
  risk center; keep changes narrow, script-verified, and provider-neutral.
- Problem framing: operators are not asking for generic account management;
  they need future saved work to happen under the correct team and to stop
  working after logout, expiry, or membership changes.
- Brainstorming/TDD: the product highlight is trust and future unlock, so the
  first deliverable should be a verified runtime boundary rather than visible
  UI chrome.

## What Changes

- Add a local-only, server-only auth cookie runtime that creates safe
  `Set-Cookie` and clearing headers for the existing app-owned session
  reference.
- Add request-cookie parsing and resolver helpers that read the session cookie
  from a standard request header and delegate to the existing auth session
  resolver.
- Add session invalidation/logout helpers that hash the cookie value, update the
  app-owned session ledger, return only safe summaries, and remain idempotent
  for missing cookies.
- Add a rollback verifier and scripts covering cookie issue attributes, request
  resolution, missing cookie denial, expired/revoked session denial, logout
  invalidation, clearing headers, redaction, and transaction rollback.
- Update the auth contract, roadmap, and README status so future agents know
  the project has cookie/request runtime but still lacks provider login,
  middleware protection, invitation flows, team management UI, and public
  protected CRUD.
- Keep existing public static workspace pages unchanged; no new login page,
  provider SDK, OAuth/password/magic-link flow, middleware/proxy gate, or
  business CRUD endpoint is introduced in this change.

## Capabilities

### New Capabilities

- `auth-cookie-runtime`: Local-only cookie issuance, request-cookie resolution,
  logout invalidation, cookie clearing, and verification around the existing
  app-owned auth session ledger.

### Modified Capabilities

- `auth-team-tenant-contract`: Record the implemented cookie/request runtime
  surface and remaining provider/login/middleware/team-management non-goals.

## Impact

- Affected code: `apps/web/src/server/auth/*`, package scripts, and local
  verifier scripts.
- Affected docs: `docs/contracts/auth-team-tenant.md`,
  `docs/architecture/technical-implementation-roadmap.md`,
  `docs/roadmap/ai-continuous-development-goal.md`,
  `docs/roadmap/autonomous-development-roadmap.md`, `README.md`, and
  `apps/web/README.md`.
- No new npm dependency. The implementation uses existing Node/standard web
  APIs, Drizzle/PostgreSQL, Zod, and the current auth session resolver.
- No new database table is expected; this change should reuse the existing
  `auth_sessions` ledger.
- Rollback path: remove the cookie runtime module, verifier script, scripts,
  docs/spec updates, and keep the existing local auth guard/session resolver.
