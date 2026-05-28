## ADDED Requirements

### Requirement: Auth contract records production access transport gate
The auth team tenant contract SHALL record production provider-selection,
team-access, session, CSRF/origin, secure-cookie, and HTTPS transport
requirements before production authentication runtime is implemented.

#### Scenario: Future production auth is proposed
- **WHEN** a future change proposes provider login, public login routes,
  provider callbacks, invitation acceptance, team switching, production session
  runtime, or real sensitive data entry
- **THEN** the agent SHALL start from the production access transport gate and
  auth contract to compare provider options, required access lifecycle, transport
  prerequisites, sensitive-data boundaries, rollback path, and verification
  requirements before installing provider SDKs or creating public login routes

#### Scenario: Local trial auth is insufficient for production
- **WHEN** existing local guard, app-owned sessions, cookie helpers, logout
  route, public trial route gate, internal V0 HTTP preview cookie policy, or
  protected local-only Route Handler consumers are present
- **THEN** the auth contract SHALL continue to classify them as supporting
  evidence rather than production login, production team access, or permission to
  enter real sensitive operational data

#### Scenario: HTTPS is required for production cookies
- **WHEN** production login, session, or protected browser workflow runtime is
  implemented
- **THEN** the contract SHALL require HTTPS-origin access, secure cookie policy,
  CSRF/origin protection, and removal of the internal HTTP preview cookie
  exception from any production entry path
