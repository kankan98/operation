# ai-review-feedback-learning-loop Specification

## Purpose
TBD - created by archiving change improve-ai-review-feedback-learning-loop. Update Purpose after archive.
## Requirements
### Requirement: AI review feedback learning loop records operator quality signals
The system SHALL let an authenticated V0 operator record auditable quality
signals from AI review output without treating those signals as authoritative
knowledge.

#### Scenario: Decision records feedback signal
- **WHEN** an operator accepts or rejects a generated AI review section from
  `/ai-review`
- **THEN** the browser SHALL record the human decision and a matching feedback
  signal with run ID, section ID, signal type, review priority, routing target,
  actor metadata, and safe reason text

#### Scenario: Operator marks knowledge or evidence issue
- **WHEN** an operator marks a section as missing knowledge, wrong source, or
  weak evidence
- **THEN** the system SHALL store a section-scoped feedback signal routed to
  knowledge review or prompt review according to the signal type and SHALL NOT
  modify published knowledge, source records, prompts, or downstream artifacts

#### Scenario: Downstream use records feedback
- **WHEN** an accepted section is used to create a downstream draft reference
- **THEN** the system SHALL record a downstream-used feedback signal routed to
  the future evaluation set and SHALL keep the downstream artifact in draft or
  reviewable state

### Requirement: AI review feedback learning loop shows run-level feedback state
The `/ai-review` workbench SHALL summarize feedback signals for the selected run
so operators can see whether the AI output is trusted, rejected, knowledge-gap
related, evidence-weak, or reused downstream.

#### Scenario: Feedback summary is displayed
- **WHEN** a selected AI review run has feedback signals
- **THEN** the workbench SHALL show compact counts for accepted, rejected,
  missing-knowledge, wrong-source, evidence-weak, downstream-used, and routed
  review signals

#### Scenario: Recent feedback is displayed
- **WHEN** feedback signals include reasons or review priorities
- **THEN** the workbench SHALL show recent feedback using concise Chinese labels
  without exposing raw cookies, session references, provider keys, prompt text,
  provider payloads, full transcripts, database URLs, or cross-team data

#### Scenario: No feedback exists
- **WHEN** a selected AI review run has no feedback signals
- **THEN** the workbench SHALL show an empty feedback state that tells the
  operator to review generated sections before downstream reuse

### Requirement: AI review feedback learning loop stays review-only
Feedback learning SHALL route quality signals to future evaluation, knowledge
review, or prompt review workflows and SHALL NOT automatically publish facts,
revise racket knowledge, change source trust, or complete tasks.

#### Scenario: Missing knowledge is routed
- **WHEN** a feedback signal indicates missing knowledge or wrong source
- **THEN** the stored signal SHALL use a knowledge-review route and remain a
  reviewable signal rather than an authoritative knowledge update

#### Scenario: Weak evidence is routed
- **WHEN** a feedback signal indicates weak evidence
- **THEN** the stored signal SHALL use a prompt-review or evaluation route and
  remain separate from published knowledge

### Requirement: AI review feedback learning loop is verifiable without live provider calls
The project SHALL provide repeatable verification for the V0 feedback learning
loop without calling live DeepSeek or any external provider by default.

#### Scenario: Local verification runs
- **WHEN** the AI review route or V0 verifier runs against local PostgreSQL
- **THEN** it SHALL verify feedback recording, run detail feedback visibility,
  downstream-used feedback, auth/scope/CSRF boundaries, safe redaction, and
  rollback or deterministic cleanup

#### Scenario: Browser verification runs before archive
- **WHEN** the change is ready to archive
- **THEN** Playwright SHALL verify `/ai-review` feedback controls, feedback
  summary visibility, representative desktop/mobile layout, console health, and
  absence of incoherent overlap or horizontal overflow
