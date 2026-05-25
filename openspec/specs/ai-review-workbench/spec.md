# ai-review-workbench Specification

## Purpose
Define the frontend-only AI review workbench that previews how badminton racket
live-commerce session facts, reviewed knowledge, structured AI analysis,
operator review actions, feedback signals, and downstream operational artifacts
will connect before AI provider calls, persistence, review queues, or external
fetching are implemented.
## Requirements
### Requirement: AI review route shows a workbench
The `/ai-review` route SHALL render an AI review workbench that can operate in
the authenticated local V0 team context and connect review-ready session
captures to AI review run preparation, V0 fake-provider execution, output
inspection, and human review decisions.

#### Scenario: Operator opens AI review route
- **WHEN** an operator opens `/ai-review`
- **THEN** the page shows Chinese sections for V0 team entry, review-ready session selection, session input quality, review context, structured analysis output, human review actions, validation states, and downstream draft affordances

#### Scenario: V0 boundary is visible
- **WHEN** the AI review workbench renders
- **THEN** it clearly uses operator-facing language to distinguish local V0 fake-provider review from production AI provider execution, RAG, public source discovery, automatic task creation, and authoritative knowledge publishing

#### Scenario: Authenticated context enables actions
- **WHEN** the operator has a valid local V0 auth session and team scope
- **THEN** the page enables loading scoped sessions and AI review runs while keeping prepare, execute, and review actions disabled until their prerequisites are met

### Requirement: Review preview separates facts, sources, and inferences
The AI review workbench SHALL distinguish human-entered facts, reviewed
knowledge references, and future AI inferences.

#### Scenario: Human facts are shown
- **WHEN** sample session input metadata is displayed
- **THEN** it is labeled as operator-entered sample facts rather than AI output

#### Scenario: Knowledge grounding is shown
- **WHEN** source-backed references are displayed
- **THEN** each reference includes source type, confidence or review state, intended use, and a freshness or boundary label

#### Scenario: AI inferences are shown
- **WHEN** analysis suggestions are displayed
- **THEN** they are labeled as future AI suggestion previews and remain editable, rejectable, or regenerable only as non-persistent affordances in this slice

### Requirement: Structured analysis outcomes are previewed
The AI review workbench SHALL preview the operational artifacts expected from a
future AI review run.

#### Scenario: Analysis sections are displayed
- **WHEN** the workbench shows analysis output categories
- **THEN** it includes live recap, product explanation diagnosis, customer question clusters, objection patterns, talk-track improvements, short-video topic ideas, and next-session task drafts

#### Scenario: Validation states are displayed
- **WHEN** schema or quality checks are shown
- **THEN** empty input, low evidence, malformed output, timeout, refusal, and stale-source states are represented as future failure states rather than active errors from a live AI call

### Requirement: Operator feedback loop is visible
The AI review workbench SHALL show how operator review decisions become future
auditable feedback signals.

#### Scenario: Feedback signals are shown
- **WHEN** the page displays feedback categories
- **THEN** accepted, edited, rejected, regenerated, source-missing, evidence-weak, and downstream-used signals are represented as future auditable inputs

#### Scenario: Feedback does not overwrite knowledge
- **WHEN** a feedback signal references a knowledge issue
- **THEN** the UI indicates that future feedback can trigger review or refresh and does not automatically overwrite authoritative knowledge

### Requirement: AI review workbench uses protected V0 runtime safely
The AI review workbench SHALL use existing protected API routes and the local V0 fake-provider route for browser actions, preserving auth, explicit scope, CSRF, no-store, and safe error boundaries.

#### Scenario: Browser calls protected APIs with scope
- **WHEN** the page loads sessions, lists AI review runs, prepares a run, executes V0 review, or records a decision
- **THEN** each request SHALL include explicit tenant/team scope and required CSRF headers for mutation routes

#### Scenario: Loading and error states are operator-facing
- **WHEN** an API request is pending or fails
- **THEN** the page SHALL show concise loading or error states in Chinese without exposing raw cookies, auth references, provider keys, prompts, provider payloads, database URLs, or protected cross-team data

#### Scenario: Mobile and desktop remain usable
- **WHEN** `/ai-review` renders on desktop and mobile viewports
- **THEN** primary controls, session lists, generated sections, validation messages, and review actions SHALL remain readable without text overflow, layout overlap, or controls resizing unpredictably

### Requirement: AI review workbench can start downstream draft creation
The `/ai-review` workbench SHALL help operators continue from accepted suggestions into downstream work without turning AI output into authoritative facts.

#### Scenario: Accepted section shows downstream next step
- **WHEN** an AI review run has accepted or edited sections eligible for downstream use
- **THEN** each eligible section SHALL show a concise downstream action and link target that explains whether it can become a talk-track draft, short-video hook draft, or next-session task

#### Scenario: Downstream action calls protected AI review route
- **WHEN** the operator starts downstream creation from `/ai-review`
- **THEN** the browser SHALL call the protected AI review downstream artifact route with explicit tenant/team scope and the AI review mutation CSRF header before directing the operator to the downstream workbench

#### Scenario: AI output remains reviewable
- **WHEN** downstream actions are visible on `/ai-review`
- **THEN** the UI SHALL still distinguish human-entered session facts, AI suggestions, validation results, and draft downstream artifacts, and SHALL NOT imply automatic publication or completion

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
