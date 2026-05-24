# auth-guard-foundation Specification

## Purpose
Define the local-only provider-neutral authorization guard foundation for
resolving app-owned auth context, enforcing role/permission/tenant/team scope,
converting authorized context into repository data access context, surfacing
safe auth decisions, and verifying allowed and denied paths before protected
workflow persistence is introduced.

## Requirements
### Requirement: Auth guard foundation is provider-neutral and local-only
The project SHALL implement the first auth guard runtime as a local-only
provider-neutral foundation that does not expose login, provider callbacks,
protected public routes, or protected workflow persistence.

#### Scenario: Static public page renders without auth provider
- **WHEN** the application renders existing public/static workspace pages
  without an auth provider or session configuration
- **THEN** those pages continue to render from static data and do not attempt an
  auth provider or database-backed session lookup

#### Scenario: Provider runtime is requested later
- **WHEN** a future change introduces Auth.js, OAuth, magic link, password,
  hosted identity, middleware, or provider callbacks
- **THEN** it SHALL start from the provider-neutral auth guard foundation and
  update the auth contract before adding provider-specific runtime behavior

### Requirement: Auth context is resolved from app-owned membership records
The auth guard foundation SHALL resolve an app-owned auth context from existing
tenant, team, user, tenant membership, and team membership records without
treating provider profile data or client-selected team IDs as authorization.

#### Scenario: Active member resolves context
- **WHEN** an active app user has active tenant and team memberships for the
  requested tenant/team
- **THEN** the resolver returns actor, tenant, team, membership, role,
  permissions, request ID, and generated context timestamp

#### Scenario: Inactive membership is requested
- **WHEN** a membership is invited, suspended, removed, expired, archived, or
  otherwise not active
- **THEN** the resolver denies protected access with a structured inactive
  membership decision and no repository data access context

### Requirement: Authorization guard denies unsafe access by default
The auth guard foundation SHALL enforce deny-by-default authorization for
missing actor, missing tenant/team, cross-tenant access, cross-team access,
inactive membership, missing permission, and forbidden role.

#### Scenario: Missing permission
- **WHEN** an actor requests a protected action that requires a permission not
  present in their resolved auth context
- **THEN** the guard denies the action with a safe reason and user-facing
  message

#### Scenario: Cross-team target
- **WHEN** an actor requests a target record whose tenant/team ownership does
  not match the resolved auth context
- **THEN** the guard denies the action and does not expose whether a cross-team
  record exists

### Requirement: Authorized context can enter repository layer
The auth guard foundation SHALL provide a conversion from authorized auth
context to the existing data access context used by repository primitives.

#### Scenario: Repository receives authorized context
- **WHEN** authorization succeeds for a tenant/team-scoped command or query
- **THEN** repository code receives actor ID, tenant ID, team ID, role,
  permissions, and request ID from the authorized auth context

#### Scenario: Authorization fails
- **WHEN** authorization fails for any reason
- **THEN** repository code SHALL NOT receive a data access context for that
  protected operation

### Requirement: Auth errors and views are safe
The auth guard foundation SHALL produce structured errors and decision views
that avoid leaking provider tokens, cookies, session secrets, invitation
secrets, raw provider payloads, customer data, prompts, transcripts, or
cross-team record existence.

#### Scenario: Auth decision is surfaced
- **WHEN** a protected operation is denied
- **THEN** the surfaced decision includes request ID, error code, retryability,
  safe user-facing message, and no sensitive raw payload

### Requirement: Auth guard verification is repeatable
The auth guard foundation SHALL include repeatable local verification that proves
allowed and denied authorization paths without changing public UI behavior.

#### Scenario: Guard check runs against local PostgreSQL
- **WHEN** a developer or agent runs the documented auth guard check with a
  valid local PostgreSQL database
- **THEN** the check verifies allowed access, missing permission denial,
  inactive membership denial, cross-team denial, and transaction rollback

#### Scenario: Local PostgreSQL is unavailable
- **WHEN** local PostgreSQL is unavailable in the current environment
- **THEN** the final report identifies which auth guard integration checks were
  skipped and which command should be rerun when the service is available
