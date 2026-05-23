## ADDED Requirements

### Requirement: Knowledge route shows a learning hub
The `/knowledge` route SHALL render a knowledge learning hub instead of the
generic placeholder page.

#### Scenario: Operator opens knowledge route
- **WHEN** an operator opens `/knowledge`
- **THEN** the page shows a Chinese source registry, knowledge lifecycle, AI grounding loop, and feedback signals

#### Scenario: Boundary is visible
- **WHEN** the knowledge learning hub renders
- **THEN** it clearly states that automatic fetching, persistence, review queues, and AI calls are not connected in this slice

### Requirement: Public source registry is source-backed metadata
The knowledge learning hub SHALL show public source metadata without copying long
source content or implying that source data has already been ingested.

#### Scenario: Public source is listed
- **WHEN** a public source entry is shown
- **THEN** it includes source name, source type, trust level, source URL, intended fields, review state, refresh cadence, and intended AI use

#### Scenario: Sensitive data is excluded
- **WHEN** the source registry renders
- **THEN** it does not include customer comments, transcripts, GMV, pricing strategy, private prompts, or AI outputs

### Requirement: AI learning loop is visible
The knowledge learning hub SHALL show how reviewed knowledge and operator
feedback will improve future AI analysis.

#### Scenario: Learning loop is displayed
- **WHEN** the operator views the hub
- **THEN** the page shows the flow from public source intake to review, published knowledge, AI grounding, operator feedback, evaluation examples, and future prompt or source-priority improvements

#### Scenario: Feedback signal is displayed
- **WHEN** feedback categories are shown
- **THEN** accepted, edited, rejected, regenerated, stale-source, and missing-knowledge signals are represented as auditable future inputs rather than automatic truth updates

### Requirement: Knowledge hub remains frontend-only
The implementation SHALL not add persistence, API routes, AI calls, external
fetching, authentication, or new dependencies.

#### Scenario: Implementation is complete
- **WHEN** static verification runs
- **THEN** `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass without adding new packages

#### Scenario: Browser verification runs
- **WHEN** `/knowledge` is checked on desktop and mobile
- **THEN** the page renders without console errors, text overflow, or incoherent overlap
