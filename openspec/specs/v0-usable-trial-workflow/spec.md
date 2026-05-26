# v0-usable-trial-workflow Specification

## Purpose
TBD - created by archiving change harden-v0-usable-trial-workflow. Update Purpose after archive.
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

