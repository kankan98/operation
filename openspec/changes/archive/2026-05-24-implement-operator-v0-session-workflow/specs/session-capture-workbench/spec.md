## MODIFIED Requirements

### Requirement: Sessions route shows a capture workbench
The `/sessions` route SHALL render a live-session capture workbench that lets a
team-scoped V0 operator create, save, list, and submit live-session captures
through protected APIs instead of only previewing static future behavior.

#### Scenario: Operator opens sessions route without session
- **WHEN** an operator opens `/sessions` without a usable auth session cookie
- **THEN** the page shows Chinese sections for entering the local V0 operator
  context and does not show save or submit controls as active protected actions

#### Scenario: Operator opens sessions route with V0 context
- **WHEN** an operator opens `/sessions` with a verified V0 auth session and
  tenant/team context
- **THEN** the page shows Chinese sections for session facts, product order,
  racket explanation checkpoints, customer questions, objections, draft state,
  saved state, and downstream readiness

#### Scenario: Workflow boundary is visible in operator language
- **WHEN** the session capture workbench renders
- **THEN** it uses concise operator-facing copy to distinguish available actions
  from unavailable future actions such as transcript upload, platform sync, and
  direct AI generation

### Requirement: Draft and recovery states are previewed
The session capture workbench SHALL show current draft, save, validation,
conflict, and recovery states for the V0 browser workflow without implying that
transcript upload, AI analysis, or external platform synchronization exists.

#### Scenario: Draft states are displayed
- **WHEN** draft or save states are shown
- **THEN** unsaved changes, saving, saved, missing required fields, long notes,
  stale draft conflict, refresh/reload recovery, and ready-for-review states are
  represented with concise operator-facing text

#### Scenario: Controls are displayed
- **WHEN** save or submit controls are shown
- **THEN** they are enabled only when the verified V0 context and required form
  state allow the action, while import, upload, AI analyze, platform sync, and
  downstream creation controls remain unavailable or boundary-labeled

## ADDED Requirements

### Requirement: Session capture browser workflow consumes protected APIs
The session capture workbench SHALL use existing protected session capture Route
Handlers for browser list, create, draft save, and submit behavior, with explicit
tenant/team scope and the existing session mutation CSRF header.

#### Scenario: List loads after context
- **WHEN** `/sessions` verifies V0 auth and team context
- **THEN** it SHALL call `GET /api/sessions/captures` with explicit tenant/team
  scope and render the returned scoped sessions or an empty state

#### Scenario: Create uses protected API
- **WHEN** the operator creates a session capture from the browser form
- **THEN** the workbench SHALL call `POST /api/sessions/captures` with explicit
  tenant/team scope, the valid session mutation CSRF header, and a payload using
  the accepted session capture domain fields

#### Scenario: Draft save uses protected API
- **WHEN** the operator saves edits to an existing session capture
- **THEN** the workbench SHALL call
  `PATCH /api/sessions/captures/[sessionId]/draft` with explicit tenant/team
  scope, the current draft version, and the valid session mutation CSRF header

#### Scenario: Submit uses protected API
- **WHEN** the operator submits a complete current draft
- **THEN** the workbench SHALL call
  `POST /api/sessions/captures/[sessionId]/submit` with explicit tenant/team
  scope, the current draft version, and the valid session mutation CSRF header,
  then render the returned review-ready status and downstream readiness

### Requirement: Session capture browser workflow handles visible states
The session capture workbench SHALL handle loading, empty, error, saved,
disabled, and conflict states without exposing internal implementation details
or sensitive data.

#### Scenario: Loading state is visible
- **WHEN** the page is verifying context or loading sessions
- **THEN** it SHALL show a stable loading state that does not shift or overlap
  core layout regions

#### Scenario: Empty state is actionable
- **WHEN** the scoped team has no session captures
- **THEN** the page SHALL show an empty state with a create-draft action and
  concise guidance for required fields

#### Scenario: API errors are safe
- **WHEN** a browser API call returns auth, permission, validation, stale draft,
  long input, sensitive review, or unexpected errors
- **THEN** the page SHALL show safe operator-facing messages and SHALL NOT render
  raw cookie values, session references, database URLs, authorization headers, or
  raw sensitive customer data inside error copy

#### Scenario: Form remains accessible
- **WHEN** the session capture form renders on desktop or mobile
- **THEN** inputs, buttons, status messages, and error messages SHALL have
  accessible labels or names, visible focus states, and text that does not
  overflow or incoherently overlap

## REMOVED Requirements

### Requirement: Session capture remains frontend-only
**Reason**: The project now has accepted local-only auth, data foundation, and
protected session capture API runtime. Keeping `/sessions` frontend-only blocks
the internally usable V0 workflow the project needs next.

**Migration**: Replace static-only behavior with the protected browser workflow
defined in `operator-v0-session-workflow` and this delta spec. Transcript
upload, platform integration, direct AI calls, production auth, and new
dependencies remain out of scope.
