## ADDED Requirements

### Requirement: V0 acceptance package is derived from scoped trial evidence
The system SHALL derive an internal V0 acceptance package from the existing
scoped workflow readiness summary, scoped trial run evidence, scoped feedback
evidence, and configured production gate list without calling new providers or
reading unscoped data.

#### Scenario: Package uses existing evidence inputs
- **WHEN** a verified trial evaluator has workflow readiness, trial run evidence,
  and feedback evidence loaded for the current tenant and team
- **THEN** the package SHALL summarize only those scoped inputs and SHALL NOT use
  static navigation labels, raw protected records, external analytics, AI calls,
  RAG, source discovery, or unscoped team data as proof of acceptance

#### Scenario: Package handles missing evidence
- **WHEN** one or more scoped evidence inputs are missing, loading, or below the
  minimum acceptance threshold
- **THEN** the package SHALL keep the decision in evidence collection or blocker
  repair and SHALL NOT claim that internal V0 is accepted

### Requirement: V0 acceptance decision is explicit
The V0 acceptance package SHALL expose a deterministic release decision that
answers whether to collect more evidence, fix blockers, expand internal trial,
or prepare production gates.

#### Scenario: Evidence is incomplete
- **WHEN** the six-workbench workflow is incomplete, no complete guided trial run
  exists, or fewer than three scoped feedback records exist
- **THEN** the decision SHALL tell evaluators to collect more evidence and SHALL
  name the most useful next evidence action

#### Scenario: Blockers exist
- **WHEN** protected workflow checks fail, a guided run step is marked issue or
  skipped, scoped feedback contains low usefulness, low clarity, real-work no
  signals, or blocker-focused recommendations
- **THEN** the decision SHALL tell evaluators to fix blockers and SHALL point to
  the highest-priority blocker workbench when one is known

#### Scenario: Internal V0 can expand
- **WHEN** all six workbenches have scoped records, a guided run has completed
  all six steps without issue or skipped blockers, at least three scoped
  feedback records exist, and no severe blocker signal is present
- **THEN** the decision SHALL allow continued internal trial expansion without
  claiming production readiness

#### Scenario: Production gate planning is separate
- **WHEN** internal V0 evidence is complete and feedback recommends production
  readiness planning
- **THEN** the decision SHALL mark production gate planning as the next stage and
  SHALL continue to list production login, HTTPS, backup/restore, sensitive-data
  governance, RAG/Q&A evaluation, and observability as future gates

### Requirement: V0 acceptance evidence is explainable and safe
The V0 acceptance package SHALL show concise evidence status lines for workflow
completion, guided trial run completion, feedback coverage, and risk/blocker
posture.

#### Scenario: Evidence statuses are shown
- **WHEN** the acceptance package is rendered
- **THEN** it SHALL show Chinese operator-facing evidence labels, values,
  statuses, and short rationale for workflow, trial run, feedback, and
  risk/blocker posture

#### Scenario: Sensitive evidence is redacted
- **WHEN** acceptance evidence references feedback, AI quality, source trust,
  session records, or production gates
- **THEN** it SHALL NOT expose raw feedback notes, raw transcripts, raw prompts,
  provider payloads, API keys, cookies, session references, authorization
  headers, database URLs, stack traces, or cross-team records

### Requirement: V0 acceptance package recommends the next action
The V0 acceptance package SHALL include a next action that matches the release
decision and remains usable when there is no safe workbench link.

#### Scenario: Next action has a safe link
- **WHEN** the release decision can be advanced by visiting a known V0 workbench
- **THEN** the package SHALL provide that workbench path and an operator-facing
  action label

#### Scenario: Next action has no safe link
- **WHEN** the release decision requires collecting more feedback, starting a
  run from the existing panel, or planning production gates without a dedicated
  route
- **THEN** the package SHALL provide an operator-facing label without inventing a
  route or enabling an unsafe action
