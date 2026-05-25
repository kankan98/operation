## ADDED Requirements

### Requirement: AI review workbench records explicit feedback signals
The `/ai-review` workbench SHALL make the operator feedback loop operational by
letting operators mark generated sections with structured quality signals.

#### Scenario: Section feedback controls are available
- **WHEN** a generated AI review section is visible
- **THEN** the section card SHALL provide compact controls for accepted/rejected
  review decisions and explicit missing-knowledge, wrong-source, and
  evidence-weak feedback signals

#### Scenario: Feedback action is pending
- **WHEN** a feedback or review action is being saved
- **THEN** the affected controls SHALL show disabled or loading state and SHALL
  avoid duplicate submission during the pending request

#### Scenario: Feedback action fails
- **WHEN** the feedback route returns a safe error
- **THEN** the workbench SHALL show an operator-facing recovery message without
  exposing implementation details, secrets, prompts, provider payloads, cookies,
  database URLs, or protected cross-team data

### Requirement: AI review workbench summarizes feedback for the selected run
The `/ai-review` workbench SHALL show feedback summary and recent feedback near
the selected run context.

#### Scenario: Feedback summary updates after action
- **WHEN** an operator records a decision, quality signal, or downstream use
- **THEN** the workbench SHALL reload or update the selected run detail so the
  feedback summary and recent feedback reflect the saved signal

#### Scenario: Feedback summary is compact
- **WHEN** feedback summary is shown on desktop or mobile
- **THEN** it SHALL use short Chinese labels, stable dimensions, accessible
  focus states, and no horizontal text overflow or incoherent overlap

### Requirement: AI review workbench distinguishes feedback from facts
The `/ai-review` workbench SHALL distinguish operator feedback, AI suggestions,
human-entered session facts, reviewed knowledge context, and downstream draft
references.

#### Scenario: Feedback references knowledge issue
- **WHEN** a feedback signal marks missing knowledge, wrong source, or weak
  evidence
- **THEN** the UI SHALL indicate that the signal enters review/evaluation
  routing and SHALL NOT imply that product knowledge or published sources were
  automatically changed
