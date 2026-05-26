## ADDED Requirements

### Requirement: V0 trial feedback is persisted with safe scope
The system SHALL persist V0 trial feedback as local-only, tenant/team/actor
scoped records for verified trial evaluators.

#### Scenario: Evaluator submits valid feedback
- **WHEN** a verified trial evaluator submits feedback with evaluator role,
  workbench, usefulness rating, clarity rating, issue type, concise note, and
  optional real-work signal
- **THEN** the system SHALL create a feedback record scoped to the authenticated
  actor, tenant, and team and SHALL return a no-store safe JSON response with
  the created feedback summary

#### Scenario: Feedback list is scoped
- **WHEN** a verified evaluator lists V0 trial feedback for a tenant/team
- **THEN** the system SHALL return only feedback records owned by the evaluator's
  authorized tenant/team scope and SHALL NOT return records from another team or
  tenant

#### Scenario: Feedback input is invalid
- **WHEN** feedback is missing required fields, has a rating outside the allowed
  range, has an unknown evaluator role, has an unknown workbench, has an unknown
  issue type, or exceeds the concise note length limit
- **THEN** the system SHALL reject the request with an operator-facing safe
  validation message and SHALL NOT create a feedback record

### Requirement: V0 trial feedback API protects auth and mutation boundaries
The system SHALL expose protected Route Handlers for V0 trial feedback that use
the existing app-owned session cookie, explicit tenant/team scope, no-store
responses, and custom CSRF protection for mutations.

#### Scenario: Missing session is rejected
- **WHEN** a feedback list or create request lacks a usable app-owned session
  cookie
- **THEN** the API SHALL reject it with an unauthenticated safe JSON response
  and SHALL NOT connect the UI to unscoped feedback data

#### Scenario: Missing tenant team scope is rejected
- **WHEN** a feedback list or create request lacks explicit tenant/team scope
- **THEN** the API SHALL reject it with an operator-facing scope error and SHALL
  NOT infer scope from client-only local storage

#### Scenario: Missing mutation CSRF is rejected
- **WHEN** a feedback create request lacks the required custom CSRF header
- **THEN** the API SHALL reject it before creating any record

#### Scenario: API errors are safe
- **WHEN** auth, validation, route, or persistence failures occur
- **THEN** the API SHALL return safe JSON and SHALL NOT render raw cookies,
  session references, database URLs, provider config, API keys, authorization
  headers, stack traces, raw transcripts, raw prompts, or protected cross-team
  records

### Requirement: V0 trial feedback protects sensitive note content
The V0 trial feedback workflow SHALL keep feedback notes focused on workflow
friction and SHALL prevent obvious secret or infrastructure markers from being
stored.

#### Scenario: Sensitive marker is submitted
- **WHEN** a feedback note includes obvious sensitive markers such as API key
  prefixes, authorization bearer tokens, raw cookie/session labels, or database
  connection URLs
- **THEN** the system SHALL reject the feedback with a safe operator-facing
  message and SHALL NOT store the submitted note

#### Scenario: UI asks for concise friction
- **WHEN** the feedback form is shown
- **THEN** the UI SHALL ask evaluators to describe the friction or usefulness in
  concise operator-facing language and SHALL remind them not to paste real
  customer, order, private message, or full transcript content

### Requirement: Trial cockpit includes low-friction feedback entry
The trial and overview cockpit SHALL provide a compact feedback entry surface
for verified V0 trial evaluators without turning the workspace into a marketing
or survey landing page.

#### Scenario: Feedback form is ready
- **WHEN** the trial session is verified
- **THEN** the cockpit SHALL show a compact feedback form with evaluator role,
  workbench, usefulness rating, clarity rating, issue type, real-work signal,
  note field, and submit action

#### Scenario: Feedback form is not ready
- **WHEN** no trial session is verified or session verification fails
- **THEN** the cockpit SHALL keep feedback submission disabled and SHALL prompt
  the evaluator to enter or refresh the trial session first

#### Scenario: Feedback submission succeeds
- **WHEN** feedback is created successfully
- **THEN** the UI SHALL show a concise success state and update the recent
  scoped feedback list without requiring a full page refresh

#### Scenario: Feedback submission fails
- **WHEN** feedback creation fails because of validation, auth, scope, network,
  route, or persistence errors
- **THEN** the UI SHALL show an operator-facing retry or correction message and
  SHALL NOT expose implementation details or sensitive payloads

### Requirement: V0 trial feedback guides subsequent roadmap work
The project SHALL treat structured V0 trial feedback as the evidence input for
the next V0/V1 prioritization wave.

#### Scenario: Roadmap is updated
- **WHEN** this change is completed
- **THEN** roadmap documentation SHALL identify V0 trial feedback as the next
  evidence source for deciding whether to prioritize experience polish,
  production auth, AI quality, RAG/Q&A, source trust, or downstream workflow
  improvements

#### Scenario: Change is verified before archive
- **WHEN** this change is ready to archive
- **THEN** verification SHALL include OpenSpec validation, local feedback
  repository/API checks, existing trial/auth checks affected by the change,
  lint, typecheck, build, and Playwright desktop/mobile checks for feedback
  entry, submission states, console health, and no incoherent text overflow
