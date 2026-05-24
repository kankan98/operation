# next-session-task-api-runtime Specification

## Purpose
Define the local-only protected Route Handler runtime for source-linked
next-session tasks, task lifecycle progress, checklist and dependency gates,
review closure, feedback signals, auth/session scope, CSRF protection, safe
responses, and rollback verification before browser task UI, notifications,
calendar/export integrations, or production persistence is implemented.
## Requirements
### Requirement: Next-session task API routes expose a protected task workflow
The system SHALL provide local-only protected Route Handlers for creating,
listing, and reading source-linked next-session tasks through the existing auth
cookie/session runtime and next-session task repository.

#### Scenario: Authorized actor creates and reads a scoped task
- **WHEN** an authenticated actor with next-task management permission calls the
  task create route with explicit tenant/team scope and the required mutation
  CSRF header
- **THEN** the route SHALL create the source-linked task through the repository,
  return no-store JSON with the task view, and allow the same team to list and
  read the task detail

#### Scenario: Cross-team task detail is requested
- **WHEN** an authenticated actor requests a next-session task ID that belongs
  to another team or tenant
- **THEN** the route SHALL return a safe not-found style response without
  exposing the task contents or cross-team record existence

#### Scenario: Task mutation is missing CSRF
- **WHEN** a create, status, checklist, dependency, complete, review-result, or
  feedback request omits the next-session task mutation CSRF header
- **THEN** the route SHALL return a forbidden safe JSON response before
  repository access

### Requirement: Next-session task API routes preserve lifecycle and readiness gates
The system SHALL provide local-only protected Route Handlers for task status
transitions, checklist progress, dependency creation/update, completion, and
review result recording while preserving repository state, owner, checklist,
dependency, sensitive-source, and review-required gates.

#### Scenario: Owner progresses assigned task
- **WHEN** an authenticated task owner calls the status route to move their own
  assigned task to in-progress with the current from-status
- **THEN** the route SHALL return no-store JSON with the updated task view
  without requiring broad next-task management permission

#### Scenario: Required checklist blocks completion
- **WHEN** an actor calls complete on an in-progress task while required
  checklist items are still todo or blocked
- **THEN** the route SHALL return a safe unprocessable response and SHALL NOT
  mark the task done, reviewing, or closed

#### Scenario: Pending dependency blocks completion
- **WHEN** an actor calls complete on an in-progress task while a dependency is
  pending or blocked
- **THEN** the route SHALL return a safe unprocessable response and SHALL NOT
  mark the task done, reviewing, or closed

#### Scenario: Review-required task closes through review result
- **WHEN** an in-progress review-required task completes successfully
- **THEN** the complete route SHALL move it to reviewing, and a later authorized
  approve-close review result SHALL move it to closed

### Requirement: Next-session task API routes record feedback as audit-only input
The system SHALL provide a local-only protected Route Handler for recording
task feedback signals without automatically modifying authoritative knowledge,
prompt versions, talk-track assets, or upstream source records.

#### Scenario: Feedback signal is recorded
- **WHEN** an authenticated actor with next-task management permission records
  that a task was completed, reopened, blocked, duplicate, not useful, helped
  the next session, missed its due date, or needs a better source
- **THEN** the route SHALL store the feedback signal through the repository and
  return no-store JSON with the feedback view

#### Scenario: Feedback does not mutate upstream assets
- **WHEN** a feedback signal routes to team review, knowledge review, prompt
  review, workflow review, or none
- **THEN** no knowledge version, prompt, talk-track asset, source record, or task
  source trail SHALL be modified by the feedback route

### Requirement: Next-session task API route verification is rollback based
The system SHALL provide a local verification command that exercises the
next-session task Route Handler workflow against the development PostgreSQL
database and rolls back all seeded records.

#### Scenario: Local next-session task route verifier succeeds
- **WHEN** `pnpm next-actions:route-check` is run with a valid local
  `DATABASE_URL`
- **THEN** it SHALL verify no-cookie denial, missing scope, CSRF blocking,
  authorized create/list/detail/status/checklist/dependency/complete/review/
  feedback workflows, duplicate task rejection, inactive owner rejection,
  missing permission, cross-team isolation, no-store responses, response
  redaction, and transaction rollback

### Requirement: Next-session task API supports V0 browser downstream creation
The existing next-session task API runtime SHALL support V0 browser creation of manual and AI-review-sourced tasks without requiring new database tables or external providers.

#### Scenario: Browser creates AI-review-sourced task
- **WHEN** an authenticated V0 operator calls the task create route with explicit scope, CSRF, AI review source metadata, accepted-section summary, task type, priority, owner where available, and checklist items
- **THEN** the route SHALL create a scoped source-linked task through the existing repository and return safe no-store JSON with the task view

#### Scenario: Browser creates manual task
- **WHEN** an authenticated V0 operator calls the task create route with explicit scope, CSRF, manual task title, summary, and manual source metadata
- **THEN** the route SHALL create a scoped manual follow-up task and SHALL NOT require AI run metadata

#### Scenario: Unsafe task creation is rejected safely
- **WHEN** the browser sends sensitive, duplicate, malformed, invalid assignee, invalid source, or unsupported task data
- **THEN** the route SHALL return the existing safe route error without exposing raw cookies, auth references, database URLs, prompts, provider payloads, raw customer messages, or cross-team records
