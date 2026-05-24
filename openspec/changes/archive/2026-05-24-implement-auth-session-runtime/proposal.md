## Why

Current protected repositories can verify actor, tenant, team, role, and scope
only when a trusted `actorId` is handed to the local guard. Before browser
save/API flows are opened, the project needs a local-only session runtime that
turns an opaque session reference into the existing `AuthContext` without
exposing cookie or provider secrets.

Reliable-source checks shaped the scope:

- Next.js official authentication guidance keeps authorization checks on the
  server side and treats middleware as a routing helper, not the full data
  access boundary.
- Auth.js official session-strategy guidance confirms that database-backed
  sessions are a normal choice when server-side revocation matters, while the
  provider must remain swappable.
- OWASP Session Management guidance reinforces HttpOnly/Secure/SameSite cookie
  boundaries, expiration, invalidation, and avoiding session identifiers in
  logs.
- NIST SP 800-63B session guidance reinforces explicit session lifecycle,
  timeout, and reauthentication/invalidation decisions.
- DeepSeek official docs confirm the user-supplied AI base URL/model direction,
  but this auth slice does not call the model or store the API key.

JTBD/value exploration: live operators, reviewers, and team leads do not need a
generic login feature for its own sake. They need the confidence that saved
products, session notes, AI review runs, talk tracks, and next-session tasks are
created under the right team, can be revoked when membership changes, and can be
audited without leaking secrets. This is aligned with the badminton
live-commerce operations goal because it removes the prerequisite blocker for
real protected workflows.

## What Changes

- Add a local-only app-owned auth session runtime behind the existing auth
  boundary.
- Add PostgreSQL/Drizzle schema and migration support for application auth
  session ledger records.
- Add server-only session reference helpers that create high-entropy opaque
  references, store only hashes, and redact session metadata from errors/logs.
- Add an `AuthPort`-style resolver that accepts a safe session reference plus
  requested tenant/team/permission and returns the existing `AuthContext` after
  session, user, membership, role, permission, and scope checks.
- Add a repeatable `auth:session-check` rollback verifier covering active,
  expired, revoked, invalidated, inactive membership, cross-team, permission
  denial, and redaction paths.
- Update the auth contract, technical roadmap, README files, and autonomous
  roadmap to record the local-only session runtime status and remaining
  non-goals.
- No login page, provider SDK, OAuth callback, password/magic-link flow,
  middleware protection, cookie mutation route, production auth provider, or
  public protected CRUD is introduced in this change.

## Capabilities

### New Capabilities

- `auth-session-runtime`: Local-only app-owned auth session ledger and
  `AuthPort` resolver that maps opaque session references to existing
  server-side auth context.

### Modified Capabilities

- `auth-team-tenant-contract`: Record the implemented local-only session
  runtime surface, remaining provider/login non-goals, and verification
  requirements for future protected workflows.

## Impact

- Affected code: `apps/web/src/server/db/schema.ts`,
  `apps/web/src/server/auth/*`, local verifier scripts, and package scripts.
- Affected docs: `docs/contracts/auth-team-tenant.md`,
  `docs/architecture/technical-implementation-roadmap.md`,
  `docs/roadmap/ai-continuous-development-goal.md`,
  `docs/roadmap/autonomous-development-roadmap.md`, `README.md`, and
  `apps/web/README.md`.
- New database migration for auth session ledger records. The migration is
  local-only and does not imply production credentials, provider selection, or
  public login availability.
- No new npm dependency. Node `crypto`, existing Drizzle/PostgreSQL, Zod, and
  the existing guard/repository patterns are sufficient.
- Rollback path: remove the session runtime module, migration, script, and
  contract status update; existing auth guard foundation and public static pages
  remain usable.
