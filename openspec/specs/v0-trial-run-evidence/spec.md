# v0-trial-run-evidence Specification

## Purpose
TBD - created by archiving change capture-v0-trial-run-evidence. Update Purpose after archive.
## Requirements
### Requirement: V0 trial runs are persisted with scoped step evidence
The system SHALL persist local-only V0 trial runs and ordered step evidence for
verified trial evaluators using explicit tenant, team, and actor scope.

#### Scenario: Evaluator starts a trial run
- **WHEN** a verified trial evaluator starts a V0 trial run
- **THEN** the system SHALL create one active run scoped to the evaluator's
  actor, tenant, and team and SHALL create six pending step evidence records for
  live sessions, racket products, knowledge sources, AI review, talk-track
  assets, and next-session tasks

#### Scenario: Trial run list is scoped
- **WHEN** a verified evaluator lists V0 trial runs for an authorized tenant and
  team
- **THEN** the system SHALL return only runs and step evidence in that
  authorized tenant/team scope and SHALL NOT return records from another tenant
  or team

#### Scenario: Step evidence is updated
- **WHEN** a verified evaluator marks a trial run step as passed, issue, or
  skipped
- **THEN** the system SHALL update only that scoped step evidence record with
  the selected status, optional friction type, concise note, and completed
  timestamp when applicable

#### Scenario: Issue or skipped step requires context
- **WHEN** a verified evaluator marks a step as issue or skipped
- **THEN** the system SHALL require a concise note explaining the friction or
  reason and SHALL reject empty notes with a safe validation message

### Requirement: V0 trial run API protects auth, scope, and mutation boundaries
The system SHALL expose protected Route Handlers for V0 trial run evidence that
use the existing app-owned session cookie, explicit tenant/team scope, no-store
responses, and custom CSRF protection for mutations.

#### Scenario: Missing session is rejected
- **WHEN** a trial run list, detail, create, update, or step update request lacks
  a usable app-owned session cookie
- **THEN** the API SHALL reject it with a safe unauthenticated JSON response and
  SHALL NOT create, update, or return unscoped trial run evidence

#### Scenario: Missing tenant team scope is rejected
- **WHEN** a trial run request lacks explicit tenant/team scope
- **THEN** the API SHALL reject it with an operator-facing scope error and SHALL
  NOT infer scope from client-only local storage

#### Scenario: Missing mutation CSRF is rejected
- **WHEN** a trial run create, run update, or step update request lacks the
  required custom CSRF header
- **THEN** the API SHALL reject it before creating or modifying any trial run
  evidence

#### Scenario: Linked ids are scope checked
- **WHEN** a request references a run id, step id, or feedback id
- **THEN** the server SHALL verify that the referenced record belongs to the
  current actor, tenant, and team scope before returning or mutating it

#### Scenario: API errors are safe
- **WHEN** auth, validation, route, or persistence failures occur
- **THEN** the API SHALL return safe JSON and SHALL NOT render raw cookies,
  session references, database URLs, provider config, API keys, authorization
  headers, stack traces, raw transcripts, raw prompts, or protected cross-team
  records

### Requirement: V0 trial run notes protect sensitive content
The V0 trial run evidence workflow SHALL keep run and step notes focused on
workflow friction and SHALL prevent obvious sensitive markers from being stored.

#### Scenario: Sensitive marker is submitted
- **WHEN** a run summary note or step note includes obvious sensitive markers
  such as API key prefixes, authorization bearer tokens, raw cookie/session
  labels, or database connection URLs
- **THEN** the system SHALL reject the submitted note with a safe
  operator-facing message and SHALL NOT store the sensitive note

#### Scenario: Long note is submitted
- **WHEN** a run summary note or step note exceeds the configured concise length
  limit
- **THEN** the system SHALL reject it with a safe validation message and SHALL
  NOT store the oversized note

### Requirement: V0 trial run evidence summary is derived
The system SHALL derive a deterministic tenant/team-scoped V0 trial run evidence
summary from persisted runs and steps without computing a numeric usability
score.

#### Scenario: Run evidence summary is returned
- **WHEN** a verified evaluator lists V0 trial runs
- **THEN** the response SHALL include a no-store evidence summary with total
  runs, active runs, completed runs, latest active run, step coverage counts,
  issue or skipped counts by step, representative friction notes, and a next
  recommended action

#### Scenario: No run exists
- **WHEN** no scoped V0 trial run exists
- **THEN** the evidence summary SHALL recommend starting a guided trial run and
  SHALL NOT claim that V0.9 has complete trial evidence

#### Scenario: Run is incomplete
- **WHEN** the latest scoped run has pending steps
- **THEN** the evidence summary SHALL identify the next pending step and SHALL
  link to the corresponding V0 workbench

#### Scenario: Run is complete with blockers
- **WHEN** a completed run includes issue or skipped steps
- **THEN** the evidence summary SHALL route the next action to the highest
  priority blocker step instead of production readiness

#### Scenario: Run is complete without blockers
- **WHEN** at least one scoped run is completed and all steps are passed
- **THEN** the evidence summary SHALL mark complete internal trial run evidence
  as available while still keeping production readiness as a separate gate

### Requirement: Trial cockpit exposes guided run evidence
The trial and overview cockpit SHALL provide a compact guided run evidence panel
for verified V0 trial evaluators without turning the workspace into a marketing
or survey landing page.

#### Scenario: Run panel is ready
- **WHEN** the trial session is verified
- **THEN** the cockpit SHALL show a compact "本次试用运行" panel with start or
  resume action, six ordered step rows, per-step workbench links, step status
  controls, concise note input for issue or skipped steps, and a run completion
  action

#### Scenario: Run panel is not ready
- **WHEN** no trial session is verified or session verification fails
- **THEN** the cockpit SHALL keep trial run actions disabled and SHALL prompt
  the evaluator to enter or refresh the trial session first

#### Scenario: Step update succeeds
- **WHEN** a step update succeeds
- **THEN** the UI SHALL show a concise saved state and update the run evidence
  summary without requiring a full page refresh

#### Scenario: Step update fails
- **WHEN** a step update fails because of validation, auth, scope, network,
  route, or persistence errors
- **THEN** the UI SHALL show an operator-facing retry or correction message and
  SHALL NOT expose implementation details or sensitive payloads

#### Scenario: Run panel remains usable on desktop and mobile
- **WHEN** the cockpit renders on desktop or mobile
- **THEN** the guided run panel SHALL use existing workspace styles, stable row
  dimensions, accessible labels, visible focus states, concise Chinese copy, and
  no incoherent text overflow or horizontal scrolling
