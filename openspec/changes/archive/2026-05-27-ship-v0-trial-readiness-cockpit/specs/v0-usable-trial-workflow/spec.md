## ADDED Requirements

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

