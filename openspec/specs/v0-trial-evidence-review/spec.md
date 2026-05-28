# v0-trial-evidence-review Specification

## Purpose
TBD - created by archiving change improve-v0-trial-evidence-review-workflow. Update Purpose after archive.
## Requirements
### Requirement: V0 trial evidence review is derived from existing scoped signals
The system SHALL derive a V0 trial evidence review digest from existing
workflow readiness, scoped trial run evidence, scoped feedback evidence, and the
internal V0 acceptance package without adding a new persistence source.

#### Scenario: Review digest uses available evidence
- **WHEN** a verified trial evaluator has workflow readiness, feedback evidence,
  trial run evidence, and an acceptance package loaded
- **THEN** the system SHALL derive a review digest from those existing signals
  and SHALL NOT require a new database table, external analytics event, AI
  generation, or full page refresh

#### Scenario: Review digest handles missing evidence
- **WHEN** workflow readiness, feedback evidence, or trial run evidence is
  missing or still loading
- **THEN** the review digest SHALL show a collect-evidence or checking state
  without inventing completion, feedback, run, or production readiness

### Requirement: V0 trial evidence review prioritizes next actions
The V0 trial evidence review digest SHALL expose a bounded priority list that
helps team leads decide the next V0 action.

#### Scenario: Blocker action is first
- **WHEN** workflow checks fail, a trial run step is issue or skipped, or
  feedback evidence contains severe blocker signals
- **THEN** the first review action SHALL direct the evaluator to the relevant
  workbench or retry action and SHALL keep the release decision out of
  production-gate planning

#### Scenario: Missing complete-path evidence is first
- **WHEN** no blocker exists but the six-step trial run evidence is missing or
  incomplete
- **THEN** the first review action SHALL tell the evaluator to start or continue
  the guided V0 trial path before using feedback for broad V0/V1 decisions

#### Scenario: Internal V0 can expand
- **WHEN** workflow readiness is complete, trial run evidence is complete, and
  feedback evidence has enough low-risk signals
- **THEN** the review digest SHALL recommend expanding internal trial or
  freezing internal V0 before adding unrelated V1 features

### Requirement: V0 trial evidence review distinguishes evidence strength
The V0 trial evidence review digest SHALL distinguish complete-path evidence
from loose feedback and SHALL summarize evidence strength in concise
operator-facing language.

#### Scenario: Complete-path evidence is visible
- **WHEN** the latest scoped trial run has all six steps completed without issue
  or skipped steps
- **THEN** the review digest SHALL identify the complete path as strong evidence
  and show the six-step completion state

#### Scenario: Loose feedback is not over-weighted
- **WHEN** scoped feedback exists but no completed trial run evidence exists
- **THEN** the review digest SHALL state that feedback is not yet complete-path
  evidence and SHALL recommend guided run evidence before broad prioritization

#### Scenario: Linked feedback improves confidence
- **WHEN** scoped feedback includes records linked to completed trial run
  evidence
- **THEN** the review digest SHALL show that linked feedback strengthens the
  review signal without exposing raw sensitive notes or raw protected records

### Requirement: V0 trial evidence review remains safe and operational
The V0 trial evidence review digest SHALL remain an internal trial decision
surface that is safe for desktop and mobile trial evaluators.

#### Scenario: Review copy preserves V0 boundary
- **WHEN** the review digest recommends expanding internal V0 or planning
  production gates
- **THEN** the digest SHALL keep production login, HTTPS, backups, sensitive
  data governance, RAG/Q&A evaluation, and observability separate from internal
  V0 completion

#### Scenario: Review UI is accessible and bounded
- **WHEN** the review digest renders on `/` or `/trial`
- **THEN** it SHALL use existing workspace styles, concise Chinese copy,
  visible status labels, accessible status updates, responsive cards, and no
  incoherent horizontal overflow or marketing-style hero content

### Requirement: V0 trial evidence review hands off to V1 production gate workflow
The V0 trial evidence review SHALL hand off strong internal V0 evidence to the
dedicated V1 production gate workflow rather than treating the internal V0
cockpit as production readiness.

#### Scenario: Strong V0 evidence recommends V1 gate review
- **WHEN** the V0 trial evidence review stage is `prepare_production_gate`
- **THEN** the review action SHALL point to V1 production gate planning as the
  next workflow and SHALL preserve the message that internal V0 completion does
  not equal production readiness

#### Scenario: Weak V0 evidence does not recommend V1 gate review
- **WHEN** the V0 trial evidence review is missing complete-path evidence,
  missing feedback evidence, or contains blocker evidence
- **THEN** the review action SHALL continue to prioritize V0 evidence collection
  or blocker repair before V1 production gate planning

#### Scenario: Gate handoff avoids provider claims
- **WHEN** the V0 evidence review lists or links production gates
- **THEN** it SHALL NOT claim that production login, HTTPS/domain, backup/restore,
  observability, production AI/RAG evaluation, or real-data handling has been
  implemented unless the dedicated V1 gate workflow reports those gates as
  accepted and verified

