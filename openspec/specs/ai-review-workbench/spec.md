# ai-review-workbench Specification

## Purpose
Define the frontend-only AI review workbench that previews how badminton racket
live-commerce session facts, reviewed knowledge, structured AI analysis,
operator review actions, feedback signals, and downstream operational artifacts
will connect before AI provider calls, persistence, review queues, or external
fetching are implemented.

## Requirements
### Requirement: AI review route shows a workbench
The `/ai-review` route SHALL render an AI review workbench instead of the
generic placeholder page.

#### Scenario: Operator opens AI review route
- **WHEN** an operator opens `/ai-review`
- **THEN** the page shows Chinese sections for session input quality, knowledge grounding, structured analysis output, human review actions, feedback signals, and downstream artifacts

#### Scenario: Static boundary is visible
- **WHEN** the AI review workbench renders
- **THEN** it clearly states that AI provider calls, prompt execution, persistence, review queues, task creation, and external data fetching are not connected in this slice

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

### Requirement: AI review workbench remains frontend-only
The implementation SHALL not add persistence, API routes, AI calls, prompt
templates, external fetching, authentication, analytics, or new dependencies.

#### Scenario: Static verification runs
- **WHEN** static verification runs
- **THEN** `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass without adding new packages

#### Scenario: Browser verification runs
- **WHEN** `/ai-review` is checked on desktop and mobile
- **THEN** the page renders without console errors, text overflow, or incoherent overlap
