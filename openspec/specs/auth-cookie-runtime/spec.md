# auth-cookie-runtime Specification

## Purpose
Define the local-only, server-only auth cookie runtime that serializes and
clears app-owned session cookies, resolves request cookies through the existing
auth session resolver and authorization guard, invalidates sessions on logout,
and verifies cookie safety before public login or protected browser workflows
are introduced.
## Requirements
### Requirement: Auth cookie runtime issues secret-safe session cookies
The project SHALL provide a local-only, server-only auth cookie runtime that
serializes the existing app-owned session reference into explicit `Set-Cookie`
headers without persisting raw cookie values or introducing a login provider.

#### Scenario: Session cookie is issued
- **WHEN** the runtime creates a cookie header for an app-owned session
  reference
- **THEN** the header uses the configured auth cookie name, contains the session
  reference only as the cookie value, and includes `HttpOnly`, `Secure`,
  `SameSite=Lax`, `Path=/`, and explicit `Max-Age` attributes

#### Scenario: Cookie header is cleared
- **WHEN** the runtime creates a clear-cookie header for logout or local
  invalidation
- **THEN** the header uses the configured auth cookie name, includes `HttpOnly`,
  `Secure`, `SameSite=Lax`, `Path=/`, and an expiration/max-age value that
  removes the browser cookie

### Requirement: Auth cookie runtime resolves request cookies through existing auth boundaries
The auth cookie runtime SHALL resolve protected request context from a request
cookie by reading the cookie header, extracting the app-owned session reference,
and delegating session lifecycle and authorization checks to the existing auth
session resolver and auth guard.

#### Scenario: Request cookie resolves authorized context
- **WHEN** a request contains a valid auth session cookie for an active session
  whose user has active tenant/team membership and the required permission
- **THEN** the runtime returns the existing `AuthContext` and safe
  `AuthSessionSummary` without returning the raw cookie value

#### Scenario: Request cookie is missing
- **WHEN** a protected request does not contain the auth session cookie
- **THEN** the runtime denies access with a structured safe auth error and does
  not call protected repository code

#### Scenario: Request cookie points to unusable session
- **WHEN** a request cookie maps to an expired, revoked, invalidated, archived,
  missing, inactive-user, inactive-membership, forbidden-role, missing-
  permission, or cross-team session path
- **THEN** the runtime denies access through the existing safe auth error
  semantics and does not expose cross-team record existence

### Requirement: Auth cookie runtime invalidates sessions on logout
The auth cookie runtime SHALL support logout/invalidation by hashing the cookie
session reference, updating the existing app-owned session ledger, and returning
only safe invalidation results.

#### Scenario: Active cookie session is logged out
- **WHEN** logout receives a request containing an active auth session cookie
- **THEN** the runtime marks the matching `auth_sessions` row as no longer
  usable with invalidation reason `logout`, records update/verification time,
  and returns a clear-cookie header plus safe session summary

#### Scenario: Logout request has no usable cookie
- **WHEN** logout receives a request with no auth cookie or a cookie that does
  not map to a known session
- **THEN** the runtime returns an idempotent clear-cookie result without
  exposing raw cookie values or failing the caller solely because the session is
  already absent

#### Scenario: Logged-out cookie is reused
- **WHEN** a previously logged-out cookie is used for a later protected request
- **THEN** the runtime denies access because the ledger session is no longer
  active

### Requirement: Auth cookie runtime verification is repeatable
The auth cookie runtime SHALL include repeatable local verification that proves
cookie issuance, request resolution, invalidation, redaction, and rollback
behavior without changing public UI rendering.

#### Scenario: Auth cookie check runs against local PostgreSQL
- **WHEN** a developer or agent runs the documented auth cookie check with a
  valid local PostgreSQL database
- **THEN** the check verifies issue header attributes, request-cookie context
  resolution, missing-cookie denial, unusable-session denial, logout
  invalidation, clear-cookie behavior, redaction, and transaction rollback

#### Scenario: Local PostgreSQL is unavailable
- **WHEN** local PostgreSQL is unavailable in the current environment
- **THEN** the final report identifies which auth cookie checks were skipped and
  which command should be rerun when the service is available
