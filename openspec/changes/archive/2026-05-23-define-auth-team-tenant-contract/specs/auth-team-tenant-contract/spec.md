## ADDED Requirements

### Requirement: Auth team tenant contract exists
The project SHALL provide an `auth-team-tenant` contract draft before
implementing auth provider integration, login pages, middleware, protected API
routes, protected Server Actions, team management, tenant-scoped repositories,
or persistent protected business records.

#### Scenario: Future auth runtime work is proposed
- **WHEN** a future change proposes authentication, protected routes, provider
  SDK integration, team membership, RBAC, tenant isolation, or protected data
  persistence
- **THEN** the agent starts from `docs/contracts/auth-team-tenant.md` and
  updates it if provider, schema, lifecycle, authorization, session, audit, or
  verification assumptions change

#### Scenario: Contract is read
- **WHEN** an agent opens the auth team tenant contract
- **THEN** it can identify current status, runtime boundary, use case, domain
  entities, commands, queries, request shape, response shape, state machines,
  error cases, provider boundary, authorization, sensitive data, audit metadata,
  verification, and open questions

### Requirement: Auth provider is isolated behind a project boundary
The auth team tenant contract SHALL define a provider-neutral `AuthPort` or
equivalent boundary so UI, domain services, repositories, AI code, and
integration code do not depend directly on a provider SDK.

#### Scenario: Provider identity is linked
- **WHEN** a future implementation receives a provider user, account, callback,
  token, or session
- **THEN** it maps provider metadata to application-owned user, tenant,
  membership, role, and audit records without treating provider profile data as
  business authorization

#### Scenario: Provider is replaced
- **WHEN** a future change replaces an auth provider or changes session
  strategy
- **THEN** application authorization, tenant/team ownership, role checks, and
  audit metadata remain behind the project auth boundary or the contract is
  updated before code changes

### Requirement: Tenant and team authorization is enforced server-side
The auth team tenant contract SHALL require server-side authorization for every
protected command, query, route handler, server action, repository operation,
AI/RAG run, source review, and export.

#### Scenario: Actor accesses a protected record
- **WHEN** an actor creates, reads, updates, deletes, reviews, exports, analyzes,
  or grounds a protected product, session, knowledge, AI review, Q&A, talk-track,
  or task record
- **THEN** the future runtime verifies authenticated actor, tenant ID, team ID,
  membership state, role, permission, and target record ownership on the server

#### Scenario: Actor crosses tenant or team boundary
- **WHEN** an actor attempts to access data outside their authorized tenant or
  team
- **THEN** the runtime rejects the request regardless of hidden UI controls or
  client-selected team state

#### Scenario: Membership is inactive
- **WHEN** an actor's membership is invited, suspended, removed, expired, or
  archived
- **THEN** protected commands and queries for that team are denied until an
  active membership is restored

### Requirement: Roles, permissions, invitations, and sessions have lifecycle states
The auth team tenant contract SHALL define lifecycle states and allowed
transitions for users, provider accounts, tenants, teams, memberships, role
assignments, invitations, sessions, and authorization decisions.

#### Scenario: Team invitation is managed
- **WHEN** an admin invites, resends, accepts, revokes, or expires a team
  invitation
- **THEN** the contract records invited email or external identifier, inviter,
  target role, tenant/team, token status, expiration, accepted actor, and audit
  event without exposing invitation secrets in logs

#### Scenario: Role changes
- **WHEN** an admin changes an actor's role or permission scope
- **THEN** the contract records previous role, new role, actor, reason,
  timestamp, affected tenant/team, and whether active sessions require
  revalidation

#### Scenario: Session changes
- **WHEN** a user signs in, signs out, refreshes, expires, is suspended, or has
  membership removed
- **THEN** the contract represents session state, invalidation reason,
  provider session reference, and user-facing authorization result shape

### Requirement: Auth data and logs protect secrets and business data
The auth team tenant contract SHALL classify provider identifiers, tokens,
cookies, session references, invitation secrets, audit events, customer data,
business records, prompts, and AI outputs as sensitive where appropriate.

#### Scenario: Auth or authorization event is logged
- **WHEN** login, logout, callback, invitation, role change, session
  invalidation, permission denial, or provider error is logged
- **THEN** logs avoid raw tokens, cookies, secrets, full customer data, full
  prompts, full transcripts, and unnecessary protected payloads

#### Scenario: User profile is stored
- **WHEN** future runtime persists a user profile or provider account link
- **THEN** it stores the minimum application-required profile, separates
  provider metadata from app authorization, and records tenant/team membership
  through application-owned records

### Requirement: Auth contract defines verification before runtime adoption
The auth team tenant contract SHALL define verification requirements before
runtime auth, provider SDK, protected persistence, or team-scoped workflows are
considered complete.

#### Scenario: Runtime implementation is proposed
- **WHEN** future code implements authentication, middleware, login/logout,
  invitations, role checks, tenant-scoped repositories, or protected workflows
- **THEN** verification covers unauthenticated access, expired sessions,
  invalid provider callback, cross-tenant access, cross-team access, inactive
  membership, forbidden role, invitation expiration/revocation, role change,
  session invalidation, audit metadata, sensitive log redaction, and browser
  states when UI changes
