# session-capture-api-runtime Specification

## Purpose
Define the local-only protected session capture Route Handler runtime that exposes
create, list, detail, draft autosave, and submit behavior through existing
app-owned auth cookie/session, explicit tenant/team scope, CSRF-protected
mutations, repository business rules, safe no-store JSON responses, and
rollback-based local verification without introducing login provider, browser
save UI, Server Actions, transcript import, AI/RAG, queue, object storage, or
production persistence.
## Requirements
### Requirement: Session capture API runtime remains local-only and protected
The project SHALL expose session capture workflow behavior through local-only
Route Handlers that require the existing app-owned auth cookie/session runtime,
explicit tenant/team scope, server-side authorization, and existing repository
business rules before returning or mutating session records.

#### Scenario: Public workspace remains static without database config
- **WHEN** existing public workspace pages render without `DATABASE_URL`
- **THEN** they SHALL continue to use static data and SHALL NOT import the session
  capture API runtime or repository modules

#### Scenario: No active login provider is introduced
- **WHEN** the session capture API runtime is implemented
- **THEN** it SHALL NOT add a login provider, provider callback, middleware, team
  management UI, Server Action, browser session form, transcript import, AI review
  trigger, queue, object storage, or production database provider

### Requirement: Session list route resolves authorized scope before repository access
The project SHALL provide `GET /api/sessions/captures` as a no-store JSON Route
Handler that resolves the auth session cookie, validates explicit tenant/team
scope, checks `read_workspace` access through the existing auth runtime, and
delegates listing to the existing session capture repository.

#### Scenario: Missing cookie is denied without database access
- **WHEN** `GET /api/sessions/captures` receives no auth session cookie
- **THEN** the route SHALL return a safe unauthenticated JSON response without
  opening the database or exposing repository data

#### Scenario: Authenticated scoped list succeeds
- **WHEN** `GET /api/sessions/captures` receives a valid auth session cookie and
  explicit authorized tenant/team scope
- **THEN** the route SHALL return only session captures from the actor's authorized
  tenant/team with structured host roles, product order, notes, customer questions,
  objections, draft state, and downstream readiness

#### Scenario: Scope is missing
- **WHEN** `GET /api/sessions/captures` receives an auth session cookie without
  tenant/team scope in query parameters or accepted headers
- **THEN** the route SHALL return a safe invalid-context response and SHALL NOT
  guess a default team

#### Scenario: Cross-team records exist
- **WHEN** another team has matching session capture records
- **THEN** the list route SHALL NOT return those records to the current actor or
  reveal whether they exist

### Requirement: Session detail route returns scoped readiness
The project SHALL provide `GET /api/sessions/captures/[sessionId]` as a no-store
JSON Route Handler that resolves the auth session cookie, validates explicit
tenant/team scope, checks `read_workspace` access through the existing auth
runtime, and delegates detail/readiness lookup to the existing session capture
repository.

#### Scenario: Authenticated scoped detail succeeds
- **WHEN** `GET /api/sessions/captures/[sessionId]` receives a valid auth session
  cookie, explicit authorized tenant/team scope, and a session ID owned by that
  team
- **THEN** the route SHALL return the repository session view with structured host
  roles, product order, notes, customer questions, objections, draft state, and
  downstream readiness

#### Scenario: Missing session ID is explicit
- **WHEN** the detail route is called without a usable session ID
- **THEN** the route SHALL return a safe invalid-context response and SHALL NOT
  query for an unscoped record

#### Scenario: Cross-team detail is not exposed
- **WHEN** a session capture exists in another team
- **THEN** the detail route SHALL NOT return that session to the current actor or
  reveal protected cross-team contents

### Requirement: Session create route protects mutations and delegates business rules
The project SHALL provide `POST /api/sessions/captures` as a no-store JSON Route
Handler that requires a valid mutation CSRF header, resolves the auth session
cookie, validates explicit tenant/team scope, checks `capture_session` access,
parses session JSON, and delegates session creation to the existing session capture
repository.

#### Scenario: Missing CSRF header is blocked without database access
- **WHEN** `POST /api/sessions/captures` receives no valid `x-operation-csrf`
  session mutation header
- **THEN** the route SHALL return a safe forbidden JSON response and SHALL NOT open
  the database or create a session

#### Scenario: Missing cookie is denied
- **WHEN** `POST /api/sessions/captures` receives a valid CSRF header but no auth
  session cookie
- **THEN** the route SHALL return a safe unauthenticated JSON response and SHALL NOT
  create a session

#### Scenario: Authorized session create succeeds
- **WHEN** an actor with `capture_session` posts valid session JSON with explicit
  authorized tenant/team scope and the valid CSRF header
- **THEN** the route SHALL create the session under the actor's authorized
  tenant/team, return the repository session view, and include no-store cache
  headers

#### Scenario: Client-supplied ownership is ignored
- **WHEN** session JSON contains `tenantId`, `teamId`, `actorId`, `createdBy`,
  `updatedBy`, or audit fields that differ from the authorized context
- **THEN** the route SHALL NOT use those fields for ownership or audit metadata and
  SHALL rely on the repository data access context

#### Scenario: Actor lacks capture permission
- **WHEN** an authenticated actor without `capture_session` posts valid session JSON
- **THEN** the route SHALL reject the mutation before writing session, host role,
  product order, note, question, or objection records

### Requirement: Session draft route uses optimistic versioning
The project SHALL provide `PATCH /api/sessions/captures/[sessionId]/draft` as a
no-store JSON Route Handler that requires a valid mutation CSRF header, resolves
the auth session cookie, validates explicit tenant/team scope, checks
`capture_session` access, combines the path session ID with the request body, and
delegates draft autosave to the existing session capture repository.

#### Scenario: Authorized draft autosave succeeds
- **WHEN** an actor with `capture_session` patches a valid draft body with the
  current `draftVersion`, explicit authorized tenant/team scope, and the valid CSRF
  header
- **THEN** the route SHALL update the draft through the repository, increment
  `draftVersion`, return the updated session view, and include no-store cache
  headers

#### Scenario: Stale draft version is rejected
- **WHEN** an actor patches a draft with an older `draftVersion`
- **THEN** the route SHALL return a safe stale-draft conflict response and SHALL
  NOT overwrite the newer draft

#### Scenario: Path session ID controls the mutation target
- **WHEN** the autosave body contains a different `sessionId`, `tenantId`,
  `teamId`, `actorId`, or audit fields
- **THEN** the route SHALL use the authorized tenant/team context and path
  `sessionId` as the mutation target

#### Scenario: Missing CSRF header blocks autosave
- **WHEN** the draft route receives no valid `x-operation-csrf` session mutation
  header
- **THEN** the route SHALL return a safe forbidden JSON response and SHALL NOT open
  the database or update a draft

### Requirement: Session submit route derives downstream readiness
The project SHALL provide `POST /api/sessions/captures/[sessionId]/submit` as a
no-store JSON Route Handler that requires a valid mutation CSRF header, resolves
the auth session cookie, validates explicit tenant/team scope, checks
`capture_session` access, combines the path session ID with the request body, and
delegates submission to the existing session capture repository.

#### Scenario: Authorized submit succeeds
- **WHEN** an actor with `capture_session` submits a complete draft or autosaved
  session with the current `draftVersion`, explicit authorized tenant/team scope,
  and the valid CSRF header
- **THEN** the route SHALL move the session to the repository's review-ready state,
  return downstream readiness, and include no-store cache headers

#### Scenario: Stale submit version is rejected
- **WHEN** an actor submits using an older `draftVersion`
- **THEN** the route SHALL return a safe stale-draft conflict response and SHALL
  NOT submit the session

#### Scenario: Incomplete session is not submitted
- **WHEN** a session is missing required host roles, product order, or other
  repository readiness requirements
- **THEN** the route SHALL return a safe missing-required-field response and SHALL
  NOT move the session to review-ready state

#### Scenario: Sensitive data review blocks submit
- **WHEN** a session or customer question requires sensitive data review
- **THEN** the route SHALL return a safe review-required response and SHALL NOT echo
  sensitive text

#### Scenario: Missing CSRF header blocks submit
- **WHEN** the submit route receives no valid `x-operation-csrf` session mutation
  header
- **THEN** the route SHALL return a safe forbidden JSON response and SHALL NOT open
  the database or submit the session

### Requirement: Session capture API errors are safe and cache-safe
The session capture API runtime SHALL map auth, validation, long-input, conflict,
redaction, stale draft, state, not-found, and unexpected failures to safe HTTP JSON
responses that do not expose secrets, session references, provider payloads, raw
authorization headers, database credentials, internal membership records, or
protected cross-team business data.

#### Scenario: Malformed JSON is safe
- **WHEN** a create request body is malformed JSON
- **THEN** the route SHALL return a safe validation error JSON response and SHALL
  NOT persist partial session records

#### Scenario: Invalid input is safe
- **WHEN** a request violates session capture input validation
- **THEN** the route SHALL return a safe validation error JSON response and SHALL
  NOT persist partial session records

#### Scenario: Long input is reported safely
- **WHEN** session summary, note, question, objection, or answer text exceeds the
  current repository limit
- **THEN** the route SHALL return a safe long-input JSON response without echoing
  the raw operator/customer text

#### Scenario: Duplicate session label is reported as conflict
- **WHEN** an authorized actor creates a session whose normalized title already
  exists for the same tenant/team on the same day
- **THEN** the route SHALL return a safe duplicate-label conflict response and
  SHALL NOT create a second session

#### Scenario: Invalid state transition is safe
- **WHEN** a repository operation rejects a draft autosave or submit because the
  current session state does not allow that transition
- **THEN** the route SHALL return a safe invalid-state response without exposing
  internal state transition details beyond the route error code and user message

#### Scenario: Sensitive data review blocker is safe
- **WHEN** repository validation rejects a create request because sensitive data
  requires review
- **THEN** the route SHALL return a safe review-required response without echoing
  the sensitive text

#### Scenario: Sensitive metadata is redacted
- **WHEN** route handling fails because of auth, cookie, provider-shaped,
  token-shaped, repository, or unexpected error paths
- **THEN** the response JSON SHALL avoid raw cookies, session references, provider
  tokens, authorization headers, database URLs, invitation secrets, and protected
  cross-team session data

#### Scenario: API responses are not cached
- **WHEN** either session capture API route returns JSON
- **THEN** the response SHALL include `Cache-Control: no-store`

### Requirement: Session capture API verification is repeatable
The project SHALL include repeatable local verification for the session capture
API runtime that uses the local PostgreSQL database, runs inside rollback
transactions for test data, and proves Route Handler behavior without changing
public UI rendering.

#### Scenario: Route check runs against local PostgreSQL
- **WHEN** local PostgreSQL is migrated and `pnpm sessions:route-check` runs with a
  valid `DATABASE_URL`
- **THEN** it SHALL verify missing cookie denial, missing scope, CSRF blocking,
  authorized create/list/detail/autosave/submit, stale draft rejection, duplicate
  label rejection, validation failure, long-input handling, missing permission
  rejection, cross-team isolation, no-store headers, response redaction, and
  transaction rollback

#### Scenario: Existing checks still pass
- **WHEN** the session capture API runtime is completed
- **THEN** existing OpenSpec validation, auth route check, session repository check,
  product API route check, typecheck, lint, and build verification SHALL remain
  passing
