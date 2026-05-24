## ADDED Requirements

### Requirement: Local V0 operator entry creates a safe team-scoped session
The project SHALL provide a local-only operator V0 entry path that can seed or
reuse one internal operator, tenant, and live-operations team, issue an app-owned
HttpOnly session cookie through the existing auth session runtime, and return the
tenant/team context needed by browser workflows.

#### Scenario: Bootstrap is gated
- **WHEN** the V0 operator entry route is called while neither local development
  mode nor the explicit bootstrap enablement flag is active
- **THEN** the route SHALL return a safe disabled response, SHALL NOT create a
  user, tenant, team, membership, or auth session, and SHALL NOT return a
  `Set-Cookie` header

#### Scenario: Bootstrap requires custom CSRF header
- **WHEN** the V0 operator entry route is called without the valid custom
  bootstrap CSRF header
- **THEN** the route SHALL return a safe forbidden response, SHALL NOT open the
  database, and SHALL NOT issue a session cookie

#### Scenario: Bootstrap succeeds
- **WHEN** the V0 operator entry route is enabled and called with the valid
  custom bootstrap CSRF header
- **THEN** the route SHALL ensure the internal V0 tenant, team, operator,
  tenant membership, and team membership exist, create a fresh active app-owned
  auth session ledger row, return a `Set-Cookie` header through the existing
  auth cookie runtime, and return a safe JSON body containing tenant/team/actor
  display context without raw session references

#### Scenario: Bootstrap is idempotent for context
- **WHEN** the V0 operator entry route is called more than once
- **THEN** it SHALL reuse deterministic internal tenant/team/operator ownership
  records, create a fresh auth session for the new browser entry, and SHALL NOT
  fail due to duplicate seed records

### Requirement: Browser workflow resolves auth and team context before session data
The `/sessions` browser workflow SHALL resolve the V0 operator auth/team context
before listing, creating, saving, or submitting protected session capture data.

#### Scenario: Operator has no usable session
- **WHEN** an operator opens `/sessions` without a usable auth session cookie
- **THEN** the page SHALL show a concise local V0 entry action and SHALL NOT call
  protected session capture list, create, draft, or submit endpoints until the
  operator enters a team-scoped session

#### Scenario: Operator enters V0 context
- **WHEN** the operator activates the local V0 entry action
- **THEN** the browser SHALL call the bootstrap route with the custom CSRF
  header, receive the safe tenant/team context, verify `/api/auth/session` with
  explicit scope, and then load the scoped session capture list

#### Scenario: Existing context loads
- **WHEN** an operator already has a valid auth session and known tenant/team
  context
- **THEN** `/sessions` SHALL verify the context through `/api/auth/session` and
  load only session captures scoped to that tenant/team

#### Scenario: Context failure is actionable
- **WHEN** auth session verification, team scope resolution, or protected list
  loading fails
- **THEN** the page SHALL show an operator-facing error state with a retry or
  re-enter action and SHALL NOT expose raw cookie values, session references,
  database credentials, authorization headers, or protected cross-team data

### Requirement: Browser workflow creates and saves session captures
The `/sessions` browser workflow SHALL let an authenticated V0 operator create
and save live-session capture drafts through the existing protected session
capture API.

#### Scenario: Empty state starts a draft
- **WHEN** the scoped session list is empty
- **THEN** the page SHALL show an empty state with a create-draft action and
  SHALL keep save/submit actions disabled until required draft fields are
  available

#### Scenario: Draft creation succeeds
- **WHEN** the operator fills the required V0 fields and creates a session
  capture
- **THEN** the browser SHALL call `POST /api/sessions/captures` with explicit
  tenant/team scope and the existing session capture mutation CSRF header, then
  show the returned session, draft version, saved timestamp/readiness state, and
  list entry

#### Scenario: Draft save succeeds
- **WHEN** the operator edits summary, notes, customer questions, or objections
  for an existing draft
- **THEN** the browser SHALL call `PATCH /api/sessions/captures/[sessionId]/draft`
  with explicit tenant/team scope, current draft version, and the existing
  mutation CSRF header, then show the returned updated draft version and saved
  state

#### Scenario: Draft save conflict is safe
- **WHEN** a draft save returns a stale draft version or invalid state response
- **THEN** the page SHALL keep the operator's visible form values, show a concise
  conflict message, and offer refresh/reload without silently overwriting the
  newer server draft

### Requirement: Browser workflow submits complete captures to review readiness
The `/sessions` browser workflow SHALL let an authenticated V0 operator submit a
complete session capture and display downstream readiness returned by the
existing protected API.

#### Scenario: Incomplete draft blocks submit
- **WHEN** required title, session date, host role, product order, or readiness
  prerequisites are missing
- **THEN** the submit action SHALL remain disabled or return an actionable
  missing-field message without moving the session to review-ready state

#### Scenario: Submit succeeds
- **WHEN** the operator submits a complete current draft
- **THEN** the browser SHALL call `POST /api/sessions/captures/[sessionId]/submit`
  with explicit tenant/team scope, current draft version, and the existing
  mutation CSRF header, then show the returned review-ready state and downstream
  readiness for AI review, talk tracks, next actions, and knowledge gap flows

#### Scenario: Submit failure is safe
- **WHEN** submit fails due to stale draft, sensitive data review, validation,
  auth, permission, or repository error
- **THEN** the page SHALL show a safe operator-facing error, SHALL NOT echo
  sensitive raw customer text in the error message, and SHALL NOT claim the
  session is review-ready

### Requirement: V0 workflow verification is repeatable
The project SHALL include repeatable verification for the operator V0 session
workflow across local route behavior and rendered browser behavior.

#### Scenario: Local workflow check passes
- **WHEN** local PostgreSQL is available and the V0 workflow check command runs
- **THEN** it SHALL verify bootstrap disabled behavior, CSRF blocking,
  successful bootstrap, safe session view, scoped session create/list/draft/save,
  submit readiness, no-store responses where applicable, secret redaction, and
  cleanup or deterministic rollback behavior

#### Scenario: Browser verification runs before archive
- **WHEN** the V0 session workflow is ready to archive
- **THEN** Playwright SHALL verify `/sessions` on desktop and mobile for the
  entry state, authenticated workflow state, create/save/submit interactions
  where the local environment allows them, absence of console errors, and no
  incoherent text overflow or overlap
