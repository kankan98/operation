## MODIFIED Requirements

### Requirement: Auth cookie runtime issues secret-safe session cookies
The project SHALL provide a local-only, server-only auth cookie runtime that
serializes the existing app-owned session reference into explicit `Set-Cookie`
headers without persisting raw cookie values or introducing a login provider.
The runtime SHALL remain secure by default and SHALL allow non-`Secure` cookies
only through an explicit internal V0 preview policy.

#### Scenario: Session cookie is issued
- **WHEN** the runtime creates a cookie header for an app-owned session
  reference under the default policy
- **THEN** the header uses the configured auth cookie name, contains the session
  reference only as the cookie value, and includes `HttpOnly`, `Secure`,
  `SameSite=Lax`, `Path=/`, and explicit `Max-Age` attributes

#### Scenario: Cookie header is cleared
- **WHEN** the runtime creates a clear-cookie header for logout or local
  invalidation under the default policy
- **THEN** the header uses the configured auth cookie name, includes `HttpOnly`,
  `Secure`, `SameSite=Lax`, `Path=/`, and an expiration/max-age value that
  removes the browser cookie

#### Scenario: Internal preview cookie is issued
- **WHEN** the runtime creates a cookie header through the explicit internal V0
  preview policy
- **THEN** the header SHALL still use the configured auth cookie name, contain
  only the session reference, include `HttpOnly`, `SameSite=Lax`, `Path=/`, and
  explicit `Max-Age`, and SHALL omit `Secure` only for that preview policy

#### Scenario: Internal preview cookie is cleared
- **WHEN** the runtime creates a clear-cookie header through the explicit
  internal V0 preview policy
- **THEN** the header SHALL use matching cookie attributes for the preview
  policy so a browser on the HTTP preview can remove the V0 session cookie

### Requirement: Auth cookie runtime verification is repeatable
The auth cookie runtime SHALL include repeatable local verification that proves
cookie issuance, request resolution, invalidation, redaction, preview policy,
and rollback behavior without changing public UI rendering.

#### Scenario: Auth cookie check runs against local PostgreSQL
- **WHEN** a developer or agent runs the documented auth cookie check with a
  valid local PostgreSQL database
- **THEN** the check verifies issue header attributes, request-cookie context
  resolution, missing-cookie denial, unusable-session denial, logout
  invalidation, clear-cookie behavior, redaction, and transaction rollback

#### Scenario: Preview cookie policy is checked
- **WHEN** the auth cookie verifier exercises the explicit internal V0 preview
  policy
- **THEN** it SHALL verify default secure behavior remains unchanged, preview
  cookies omit `Secure` only under the explicit policy, preview clear headers
  match the preview policy, and raw session references are not exposed in safe
  outputs

#### Scenario: Local PostgreSQL is unavailable
- **WHEN** local PostgreSQL is unavailable in the current environment
- **THEN** the final report identifies which auth cookie checks were skipped and
  which command should be rerun when the service is available
