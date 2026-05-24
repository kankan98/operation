# auth-session-runtime Specification

## Purpose
Define the local-only, provider-neutral auth session runtime that stores
app-owned session ledger records, hashes opaque session references, resolves
usable sessions into existing `AuthContext`, delegates tenant/team
authorization to the guard foundation, and verifies session lifecycle and
redaction before public protected workflows are introduced.
## Requirements
### Requirement: Auth session runtime is local-only and provider-neutral
The project SHALL implement the first auth session runtime as a local-only,
server-only, provider-neutral boundary that resolves opaque application session
references into existing app-owned authorization context without introducing a
login provider, public protected route, middleware gate, or browser cookie
mutation flow.

#### Scenario: Public workspace renders without session lookup
- **WHEN** existing public/static workspace pages render without a login provider
  or cookie configuration
- **THEN** they continue to render from static data and SHALL NOT attempt a
  database-backed session lookup

#### Scenario: Future provider runtime is requested
- **WHEN** a future change introduces Auth.js, OAuth, magic link, password,
  hosted identity, provider callbacks, or middleware protection
- **THEN** it SHALL start from the local auth session runtime and update the
  auth contract before adding provider-specific behavior

### Requirement: Auth sessions have an app-owned ledger
The project SHALL persist application auth session ledger records with explicit
lifecycle state, user ownership, expiry, verification timestamp, optional
provider session reference, and invalidation reason.

#### Scenario: Active session exists
- **WHEN** a session record belongs to an active app user, has `active` status,
  and has not reached `expiresAt`
- **THEN** the session runtime can use it as the actor source for an auth
  context resolution request

#### Scenario: Session is no longer usable
- **WHEN** a session is expired, revoked, invalidated, archived, missing, or
  owned by an inactive user
- **THEN** the session runtime SHALL deny protected access with a structured
  safe auth error and SHALL NOT return repository data access context

### Requirement: Session references are secret-safe
The auth session runtime SHALL use high-entropy opaque session references, store
only hashed references, and avoid exposing raw session references, cookies,
provider session identifiers, tokens, or secrets in returned objects, errors,
logs, or verification output.

#### Scenario: Session reference is stored
- **WHEN** a local session reference is created for verifier or future adapter
  use
- **THEN** only the hash is persisted in the auth session ledger and the raw
  reference is not returned by session lookup or auth context views

#### Scenario: Session resolution fails
- **WHEN** session resolution rejects a request containing session, cookie,
  token, provider, password, or secret-shaped metadata
- **THEN** the surfaced error details SHALL redact those values

### Requirement: Session resolver delegates authorization to existing guard
The auth session runtime SHALL validate session state first and then delegate
actor, tenant, team, membership, permission, role, and target scope checks to
the existing auth guard path.

#### Scenario: Active session resolves authorized context
- **WHEN** an active session maps to an active app user with active tenant and
  team memberships, the required permission, and an in-scope target
- **THEN** the resolver returns `AuthContext` plus a safe session summary and
  allows conversion into repository `DataAccessContext`

#### Scenario: Session actor lacks membership or permission
- **WHEN** a valid session maps to a user with inactive membership, missing
  permission, forbidden role, or cross-team/cross-tenant target scope
- **THEN** the resolver SHALL deny through the same structured auth guard error
  semantics used by the existing guard foundation

### Requirement: Auth session verification is repeatable
The auth session runtime SHALL include repeatable local verification that proves
session lifecycle, authorization delegation, redaction, and rollback behavior
without changing public UI behavior.

#### Scenario: Session check runs against local PostgreSQL
- **WHEN** a developer or agent runs the documented auth session check with a
  valid local PostgreSQL database
- **THEN** the check verifies active session resolution, expired/revoked/
  invalidated denial, inactive membership denial, cross-team denial, missing
  permission denial, redaction, and transaction rollback

#### Scenario: Local PostgreSQL is unavailable
- **WHEN** local PostgreSQL is unavailable in the current environment
- **THEN** the final report identifies which auth session checks were skipped
  and which command should be rerun when the service is available
