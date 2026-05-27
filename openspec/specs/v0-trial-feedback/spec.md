# v0-trial-feedback Specification

## Purpose
Define the local-only V0 trial feedback workflow that lets verified demo
evaluators submit scoped, safe, low-friction feedback from the trial cockpit and
uses that feedback as evidence for subsequent V0/V1 prioritization.
## Requirements
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

### Requirement: V0 trial feedback evidence is summarized
The V0 trial feedback workflow SHALL provide a tenant/team-scoped evidence
summary that helps evaluators and team leads decide the next V0 prioritization
focus.

#### Scenario: Feedback evidence summary is returned
- **WHEN** a verified evaluator lists V0 trial feedback for an authorized
  tenant/team
- **THEN** the response SHALL include a no-store evidence summary with total
  scoped feedback count, included feedback count, low-usefulness count,
  low-clarity count, real-work signal distribution, top issue types, top
  workbenches, hotspot groups, recent representative notes, and a deterministic
  next-focus recommendation

#### Scenario: Sparse feedback recommends more evidence
- **WHEN** fewer than three scoped feedback records are available for evidence
  review
- **THEN** the summary SHALL explicitly recommend collecting more complete trial
  path feedback before making broad V0/V1 prioritization decisions

#### Scenario: Feedback evidence remains scoped
- **WHEN** feedback exists for another tenant or team
- **THEN** the evidence summary SHALL NOT include cross-tenant or cross-team
  counts, notes, hotspots, signals, or recommendations

### Requirement: V0 trial feedback cockpit shows evidence review
The trial and overview cockpit SHALL show compact scoped feedback evidence after
the V0 trial session is verified.

#### Scenario: Evidence panel is ready
- **WHEN** a verified trial session has loaded feedback evidence
- **THEN** the cockpit SHALL show Chinese operator-facing metrics, top friction
  categories, recent notes, and the recommended next focus without requiring a
  page refresh

#### Scenario: Evidence panel has no data
- **WHEN** no scoped feedback has been collected
- **THEN** the cockpit SHALL show an empty evidence state that asks evaluators to
  complete trial paths and submit concise feedback

#### Scenario: Evidence panel updates after submission
- **WHEN** an evaluator submits valid feedback successfully
- **THEN** the evidence panel SHALL refresh or update so the latest counts,
  recent note, and next-focus recommendation reflect the submitted feedback

#### Scenario: Evidence panel remains restrained
- **WHEN** the cockpit renders on desktop or mobile
- **THEN** the evidence panel SHALL use the existing workspace design language,
  stable dimensions, accessible labels, and concise copy without marketing-style
  hero content, decorative charts, or incoherent text overflow

### Requirement: V0 trial feedback evidence guides roadmap decisions
The project SHALL treat the summarized trial evidence as the immediate decision
input for V0 usable-version acceleration.

#### Scenario: Roadmap records evidence review status
- **WHEN** this change is completed
- **THEN** roadmap documentation SHALL state that V0 feedback evidence review is
  the current gate for choosing between experience polish, sample data, AI
  quality, source trust, downstream workflow, production auth/readiness, or
  collecting more feedback

#### Scenario: Evidence review is verified before archive
- **WHEN** this change is ready to archive
- **THEN** verification SHALL include OpenSpec validation, local feedback
  summary checks, affected trial/auth checks, lint, typecheck, build, and
  Playwright desktop/mobile checks for evidence rendering, update-after-submit,
  console health, and no incoherent text overflow

### Requirement: Feedback evidence informs V0.9 readiness
The V0 trial feedback evidence summary SHALL be usable as an input to the V0.9
trial readiness cockpit without exposing unscoped or sensitive feedback content.

#### Scenario: Evidence drives readiness focus
- **WHEN** scoped feedback evidence includes a recommendation, hotspot
  workbench, hotspot issue type, low-rating counts, or real-work blocker signals
- **THEN** the readiness cockpit SHALL use those signals to choose the next
  evaluation focus and SHALL keep the recommendation deterministic

#### Scenario: Sparse evidence is not overclaimed
- **WHEN** fewer than three scoped feedback records are available
- **THEN** the readiness cockpit SHALL treat feedback evidence as insufficient
  for broad V0/V1 prioritization and SHALL recommend collecting more complete
  trial path feedback

#### Scenario: Feedback safety boundaries are preserved
- **WHEN** feedback evidence appears in the readiness cockpit
- **THEN** the workspace SHALL NOT render raw cookies, session references,
  database URLs, provider configuration, API keys, authorization headers, stack
  traces, raw transcripts, raw prompts, or cross-team feedback

### Requirement: V0 trial feedback can link to trial run evidence
The V0 trial feedback workflow SHALL allow feedback to be associated with an
optional scoped trial run and trial run step without requiring every feedback
record to be linked.

#### Scenario: Feedback is submitted for a run step
- **WHEN** a verified evaluator submits feedback from a guided trial run step
- **THEN** the system SHALL store the feedback with the associated trial run and
  step identifiers after verifying that both belong to the current actor,
  tenant, and team scope

#### Scenario: Loose feedback remains supported
- **WHEN** a verified evaluator submits feedback without a trial run or step
  identifier
- **THEN** the system SHALL continue to persist the scoped feedback as a loose
  feedback record and SHALL NOT require trial run evidence for the existing
  feedback workflow

#### Scenario: Cross-scope trial run link is rejected
- **WHEN** a feedback submission references a trial run or step from another
  tenant, team, or actor scope
- **THEN** the system SHALL reject the request with a safe operator-facing
  message and SHALL NOT create the feedback record

### Requirement: V0 trial feedback summary distinguishes complete-path evidence
The V0 trial feedback evidence summary SHALL distinguish feedback linked to
complete trial runs from loose notes where scoped run evidence is available.

#### Scenario: Linked complete-run feedback exists
- **WHEN** scoped feedback includes records linked to completed trial runs
- **THEN** the evidence summary SHALL expose safe counts or labels that indicate
  complete-path feedback exists without leaking raw protected run metadata

#### Scenario: Only loose feedback exists
- **WHEN** scoped feedback exists but none is linked to a completed trial run
- **THEN** the evidence summary SHALL keep the existing feedback metrics and
  SHALL recommend collecting guided trial run evidence before broad V0/V1
  prioritization

#### Scenario: Feedback safety boundaries are preserved
- **WHEN** feedback is linked to run evidence or summarized with run evidence
- **THEN** the workflow SHALL NOT render raw cookies, session references,
  database URLs, provider configuration, API keys, authorization headers, stack
  traces, raw transcripts, raw prompts, or cross-team feedback

