# v0-usable-trial-workflow Specification

## Purpose
Define the internal V0 trial workflow readiness surface that verifies the six
implemented operator workbenches through protected scoped APIs, recommends the
next useful trial action, and keeps internal usable V0 status separate from
production readiness.
## Requirements
### Requirement: V0 trial workflow readiness is summarized
The workspace SHALL summarize the implemented V0 trial workflow after a trial
session is verified by checking the existing protected list surfaces for
sessions, racket products, knowledge sources, AI review runs, talk-track assets,
and next-session tasks.

#### Scenario: Verified evaluator sees readiness summary
- **WHEN** an evaluator enters or verifies the trial team from the overview or
  trial entry flow
- **THEN** the workspace SHALL show a compact summary for `/sessions`,
  `/rackets`, `/knowledge`, `/ai-review`, `/talk-tracks`, and `/next-actions`
  using scoped protected APIs and SHALL NOT treat static navigation labels as
  proof that protected data loaded

#### Scenario: Readiness summary loads safely
- **WHEN** the readiness summary is loading protected workbench counts
- **THEN** the UI SHALL show an explicit loading or checking state and SHALL
  keep destructive, logout, refresh, and continue actions bounded by the current
  verified trial session state

#### Scenario: Readiness summary fails safely
- **WHEN** one or more readiness list checks fail because of auth, scope,
  network, route, or data availability
- **THEN** the UI SHALL show an operator-facing retry or refresh action without
  rendering raw cookies, session references, database URLs, provider config,
  stack traces, API keys, authorization headers, or raw protected records

### Requirement: V0 trial workflow recommends the next useful action
The workspace SHALL recommend the next workbench based on the earliest
implemented V0 workflow step that has no scoped records, while still allowing
direct access to all implemented workbenches.

#### Scenario: No workflow records exist
- **WHEN** a verified trial evaluator has no scoped records in the implemented
  V0 workbenches
- **THEN** the workspace SHALL recommend starting from `/sessions` and present
  the workflow sequence in operator-facing language

#### Scenario: Some workflow records exist
- **WHEN** one or more earlier V0 workflow steps have scoped records and a later
  step is empty
- **THEN** the workspace SHALL recommend the first empty downstream workbench
  and show existing counts for completed or started steps

#### Scenario: All workflow steps have records
- **WHEN** all six implemented V0 workbenches have at least one scoped record
- **THEN** the workspace SHALL show the trial workflow as filled for V0 and
  offer direct continuation without claiming production readiness

### Requirement: V0 usable release boundary is explicit
The project SHALL distinguish internal usable V0 completion from production
completion in durable documentation and verification.

#### Scenario: Progress is reported
- **WHEN** project progress or completion is summarized
- **THEN** documentation SHALL identify internal usable V0 as the near-term
  release target and separate it from production authentication, HTTPS/domain,
  backups, sensitive data governance, RAG/Q&A, public source discovery, external
  integrations, and production observability

#### Scenario: V0 closeout is verified
- **WHEN** this change is ready to archive
- **THEN** verification SHALL include OpenSpec validation, local route/model
  checks, lint/type/build checks, and Playwright desktop/mobile checks for trial
  entry, workflow summary, next-step navigation, console health, and no
  incoherent text overflow

### Requirement: V0.9 trial readiness stage is summarized
The workspace SHALL combine protected V0 workflow readiness and scoped feedback
evidence into a deterministic internal V0.9 readiness stage after a trial
session is verified.

#### Scenario: Evidence is still sparse
- **WHEN** a verified evaluator has fewer than three scoped feedback records or
  has not completed the implemented V0 workflow path
- **THEN** the workspace SHALL show a collect-evidence stage with the next
  workbench or feedback action and SHALL NOT claim that the V0.9 trial is ready
  for broader internal use

#### Scenario: Blockers are visible
- **WHEN** protected workflow checks fail or scoped feedback evidence includes
  low usefulness, low clarity, real-work blocker signals, or blocker-focused
  recommendations
- **THEN** the workspace SHALL show a fix-blockers stage with the highest-priority
  focus and SHALL NOT suggest production preparation

#### Scenario: Internal trial is ready
- **WHEN** all six implemented workbenches have scoped records, at least three
  scoped feedback records exist, and no severe feedback blockers are present
- **THEN** the workspace SHALL show an internal V0.9 readiness stage that
  invites continued internal trial runs without claiming production readiness

#### Scenario: Production gate is only a planning signal
- **WHEN** the workflow path is complete, feedback evidence has no severe
  blockers, and the evidence recommendation is production readiness
- **THEN** the workspace SHALL show production-gate preparation as a planning
  signal and SHALL list production login, HTTPS, backups, sensitive-data
  governance, RAG/Q&A, and observability as separate future gates

### Requirement: V0.9 trial run checklist guides evaluators
The workspace SHALL show a compact operator-facing checklist for the implemented
trial path so evaluators know what to run and what evidence to submit.

#### Scenario: Checklist is shown after verification
- **WHEN** a trial session is verified on the overview or trial entry surface
- **THEN** the workspace SHALL show the six implemented workbench steps in order:
  live sessions, racket products, knowledge sources, AI review, talk-track
  assets, and next-session tasks

#### Scenario: Checklist explains what each step proves
- **WHEN** a checklist item is rendered
- **THEN** it SHALL include concise Chinese copy describing the operator task,
  the evidence the step proves, and the feedback focus to capture after trying
  the step

#### Scenario: Checklist remains bounded
- **WHEN** the cockpit renders on desktop or mobile
- **THEN** the checklist SHALL use existing workspace styles, stable row
  dimensions, accessible labels, and concise copy without marketing-style hero
  content, decorative charts, or incoherent text overflow

### Requirement: V0.9 readiness uses trial run evidence
The V0.9 trial readiness cockpit SHALL incorporate scoped trial run evidence in
addition to protected workbench counts and scoped feedback evidence.

#### Scenario: No complete trial run exists
- **WHEN** a verified evaluator has no completed scoped trial run evidence
- **THEN** the readiness cockpit SHALL recommend starting or resuming a guided
  trial run and SHALL NOT claim that V0.9 has complete internal trial evidence

#### Scenario: Trial run has pending steps
- **WHEN** the latest scoped trial run has pending steps
- **THEN** the readiness cockpit SHALL show the next pending step as the
  immediate trial action before broad V0/V1 prioritization

#### Scenario: Trial run includes blockers
- **WHEN** scoped trial run evidence includes issue or skipped steps
- **THEN** the readiness cockpit SHALL surface the blocker step and SHALL keep
  the stage in fix-blockers or collect-evidence instead of production-gate
  preparation

#### Scenario: Trial run is complete
- **WHEN** a scoped trial run has all six steps completed and no issue or
  skipped blockers
- **THEN** the readiness cockpit MAY use that run as complete internal trial
  evidence while still requiring scoped feedback evidence and production gates
  before any production readiness claim

### Requirement: Trial checklist reflects run status
The V0.9 trial checklist SHALL show run step status when scoped trial run
evidence is available.

#### Scenario: Checklist has run evidence
- **WHEN** a verified evaluator has an active or recent scoped trial run
- **THEN** each checklist row SHALL show whether its step is pending, passed,
  issue, or skipped and SHALL keep the step's task, evidence, and feedback focus
  visible

#### Scenario: Checklist has no run evidence
- **WHEN** no scoped trial run exists
- **THEN** the checklist SHALL keep the existing task guidance and SHALL prompt
  the evaluator to start a run before treating the checklist as completed

#### Scenario: Checklist remains bounded
- **WHEN** run status is shown in the checklist
- **THEN** the cockpit SHALL remain operator-facing, concise, responsive, and
  free of marketing-style hero content or decorative charts

