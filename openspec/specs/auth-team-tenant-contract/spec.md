# auth-team-tenant-contract Specification

## Purpose
Define the contract-first boundary for future authentication, team membership,
tenant isolation, roles, invitations, sessions, provider adapters, server-side
authorization, sensitive data handling, audit metadata, and verification.
## Requirements
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

### Requirement: Auth team tenant contract records guard runtime status
The auth team tenant contract SHALL be updated when the local provider-neutral
auth guard foundation is implemented so future agents can distinguish
contract-only planning from partially implemented local authorization runtime.

#### Scenario: Local guard runtime is implemented
- **WHEN** the project adds provider-neutral auth context resolution,
  authorization guard helpers, safe decision/error shapes, repository context
  conversion, and local guard verification
- **THEN** `docs/contracts/auth-team-tenant.md` records the implemented local
  guard surface, remaining non-goals, and the fact that login/provider runtime
  remains blocked until future OpenSpec changes

#### Scenario: Future provider runtime is selected
- **WHEN** a future change implements Auth.js, OAuth, magic link, password,
  hosted identity, middleware, provider callbacks, invitation delivery, or team
  management UI
- **THEN** the agent starts from the updated auth contract and updates it if
  provider, session, cookie, invitation, membership, role, audit, or sensitive
  data assumptions change

### Requirement: Auth team tenant contract records session runtime status
The auth team tenant contract SHALL be updated when the local-only app-owned
auth session runtime is implemented so future agents can distinguish
contract-only planning, local guard foundation, and local session runtime from a
complete provider/login system.

#### Scenario: Local session runtime is implemented
- **WHEN** the project adds an app-owned auth session ledger, session reference
  hashing, provider-neutral session resolver, and local session verification
- **THEN** `docs/contracts/auth-team-tenant.md` records the implemented local
  session surface, remaining non-goals, sensitive data rules, and the fact that
  provider login, cookies, middleware, and public protected CRUD remain blocked
  until future OpenSpec changes

#### Scenario: Future protected workflow runtime is proposed
- **WHEN** a future change proposes protected Route Handlers, protected Server
  Actions, browser save flows, AI/RAG calls from user context, exports, or team
  management
- **THEN** the agent starts from the updated auth contract and verifies whether
  the local session runtime is sufficient or whether provider login, cookie,
  middleware, invitation, role, audit, or sensitive data assumptions must change

### Requirement: Auth team tenant contract records cookie runtime status
The auth team tenant contract SHALL be updated when the local-only auth cookie
runtime is implemented so future agents can distinguish contract-only planning,
local guard foundation, local session runtime, and request-cookie runtime from
a complete provider/login system.

#### Scenario: Local cookie runtime is implemented
- **WHEN** the project adds safe auth cookie serialization, request-cookie
  resolution, logout invalidation, cookie clearing, and local cookie
  verification
- **THEN** `docs/contracts/auth-team-tenant.md` records the implemented cookie
  runtime surface, remaining non-goals, sensitive data rules, and the fact that
  provider login, middleware/proxy protection, team management, and public
  protected CRUD remain blocked until future OpenSpec changes

#### Scenario: Future login or protected browser workflow is proposed
- **WHEN** a future change proposes provider login, login/logout routes,
  middleware/proxy protection, protected Route Handlers, protected Server
  Actions, browser save flows, AI/RAG calls from user context, exports, or team
  management
- **THEN** the agent starts from the updated auth contract and verifies whether
  the cookie runtime is sufficient or whether provider, CSRF, middleware,
  invitation, team switching, role, audit, or sensitive data assumptions must
  change

### Requirement: Auth team tenant contract records route runtime status
The auth team tenant contract SHALL be updated when the local-only auth Route
Handler runtime is implemented so future agents can distinguish contract-only
planning, local guard foundation, local session runtime, cookie/request runtime,
and public auth route runtime from a complete provider/login system.

#### Scenario: Local auth route runtime is implemented
- **WHEN** the project adds public `GET /api/auth/session` and
  `POST /api/auth/logout` Route Handlers over the existing app-owned
  cookie/session runtime
- **THEN** `docs/contracts/auth-team-tenant.md` records the implemented route
  surface, safe response shape, logout CSRF header requirement, remaining
  provider/login/middleware/team-management non-goals, and the fact that
  protected business CRUD remains blocked until future OpenSpec changes

#### Scenario: Future protected browser workflow is proposed
- **WHEN** a future change proposes protected product, session, knowledge, AI,
  Q&A, talk-track, task, export, team, or member Route Handlers or Server
  Actions
- **THEN** the agent starts from the updated auth contract and verifies whether
  the auth route runtime is sufficient or whether provider login, middleware,
  team switching, CSRF/origin checks, invitation, role, audit, or sensitive data
  assumptions must change

### Requirement: Auth team tenant contract records public trial auth foundation status
The auth team tenant contract SHALL be updated when public trial route protection and trial entry are implemented so future agents can distinguish internal V0 bootstrap, public trial access, and later production auth provider work.

#### Scenario: Public trial auth foundation is implemented
- **WHEN** the project adds a public trial entry route, protected workspace route gate, team context status, and route-decision verification over the existing app-owned auth runtime
- **THEN** `docs/contracts/auth-team-tenant.md` SHALL record the implemented public trial surface, route protection boundary, safe session behavior, remaining provider-login exclusions, and verification commands

#### Scenario: Future production auth provider work is proposed
- **WHEN** a future change proposes Auth.js, OAuth, magic link, password login, hosted identity provider, invitation acceptance, team administration, production HTTPS rollout, or real sensitive data entry
- **THEN** the agent SHALL start from the updated auth contract and verify whether public trial access is sufficient or whether provider, session lifecycle, CSRF/origin, invitation, team switching, role, audit, backup, observability, or sensitive data assumptions must change

### Requirement: Route-level protection is not authoritative authorization
The auth team tenant contract SHALL require any public trial route gate or middleware to be treated as an optimistic access gate while server-side tenant/team authorization remains authoritative.

#### Scenario: Protected page route is allowed by route gate
- **WHEN** a protected workspace page request has the app-owned session cookie and passes the route-level gate
- **THEN** protected business data SHALL still require existing server Route Handler, session resolver, permission, membership, tenant/team, and record-ownership checks before it is returned

#### Scenario: Route gate lacks database context
- **WHEN** middleware or another lightweight route gate cannot validate membership state, role, session expiry, or tenant/team ownership from the database
- **THEN** it SHALL only decide whether to redirect to trial entry and SHALL NOT be documented or implemented as the final authorization layer

