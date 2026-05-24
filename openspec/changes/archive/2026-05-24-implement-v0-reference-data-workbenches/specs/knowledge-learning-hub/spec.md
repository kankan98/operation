## MODIFIED Requirements

### Requirement: Knowledge route shows a learning hub
The `/knowledge` route SHALL render a knowledge learning hub that can operate in the authenticated local V0 team context and connect source, claim, team-note, review, and publish workflows to existing protected knowledge lifecycle APIs.

#### Scenario: Operator opens knowledge route
- **WHEN** an operator opens `/knowledge`
- **THEN** the page shows Chinese sections for V0 team entry, source registry, source creation, knowledge lifecycle, review queue, review decisions, publication readiness, AI grounding boundaries, feedback signals, loading, empty, error, disabled, and success states

#### Scenario: Boundary is visible
- **WHEN** the knowledge learning hub renders
- **THEN** it clearly states that browser-created sources and notes remain review-gated, and that automatic fetching, public web discovery, RAG indexing, production persistence, and AI calls are not connected in this slice

### Requirement: Public source registry is source-backed metadata
The knowledge learning hub SHALL show public source metadata without copying long source content or implying that source data has already been ingested.

#### Scenario: Public source is listed
- **WHEN** a public or team source entry is shown
- **THEN** it includes source name, source type, trust level, source URL where available, intended fields, review state, refresh cadence, intended AI use, and updated time where available

#### Scenario: Sensitive data is excluded
- **WHEN** the source registry renders
- **THEN** it does not include customer comments, transcripts, GMV, pricing strategy, private prompts, raw provider payloads, or AI outputs

### Requirement: Knowledge hub remains frontend-only
The implementation SHALL add browser workflow behavior on top of existing protected knowledge lifecycle APIs without adding new persistence models, external fetching, AI calls, authentication providers, or new dependencies.

#### Scenario: Implementation is complete
- **WHEN** static and route verification runs
- **THEN** `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm knowledge:route-check`, and the local V0 reference-data workflow check pass without adding new packages

#### Scenario: Browser verification runs
- **WHEN** `/knowledge` is checked on desktop and mobile
- **THEN** the page renders entry, authenticated, empty, saved, review, disabled, and error states without console errors, text overflow, or incoherent overlap

## ADDED Requirements

### Requirement: Knowledge hub creates scoped sources and notes
The `/knowledge` workbench SHALL let an authenticated V0 operator register knowledge sources and create supported manual knowledge content through existing protected Route Handlers.

#### Scenario: Register source succeeds
- **WHEN** the operator enters valid source metadata and saves
- **THEN** the browser SHALL call `POST /api/knowledge/sources` with explicit tenant/team scope, the required knowledge mutation CSRF header, route-safe source JSON, and no client-supplied ownership fields

#### Scenario: Create manual claim or team note succeeds
- **WHEN** the operator enters supported manual claim or team-note content for scoped sources
- **THEN** the browser SHALL call the existing protected claim or team-note route with explicit tenant/team scope, CSRF, source references where applicable, and non-sensitive content

#### Scenario: Scoped sources are listed
- **WHEN** the operator has a valid local V0 auth session and team scope
- **THEN** the page SHALL load scoped knowledge sources through `GET /api/knowledge/sources` and show only current-team records

### Requirement: Knowledge hub supports review queue and publication gates
The `/knowledge` workbench SHALL expose review and publication actions only through supported protected knowledge lifecycle routes.

#### Scenario: Review queue is scoped
- **WHEN** the operator has a valid local V0 auth session and team scope
- **THEN** the page SHALL load scoped review queue items and SHALL NOT show cross-team source, claim, team-note, conflict, or version records

#### Scenario: Review decision is recorded safely
- **WHEN** the operator records an allowed review decision for a scoped source, claim, team note, or conflict target
- **THEN** the browser SHALL call the protected review route with explicit scope, CSRF, target type, target ID, decision, and reason, then update the displayed review state after success

#### Scenario: Publication gate is visible
- **WHEN** required approved sources, approved claims, conflict resolution, or sensitive-data gates prevent publication
- **THEN** the page SHALL show concise blockers and SHALL NOT hide source or review context

### Requirement: Knowledge hub remains usable on mobile and desktop
The `/knowledge` workbench SHALL remain readable and operable across desktop and mobile viewports.

#### Scenario: Mobile layout has no horizontal overflow
- **WHEN** `/knowledge` renders at a 390px-wide viewport
- **THEN** source lists, review queue items, form controls, source chips, and action buttons SHALL fit without horizontal page overflow or text overlap

#### Scenario: Errors are safe and actionable
- **WHEN** a protected knowledge request fails
- **THEN** the page SHALL show concise Chinese recovery text without exposing raw cookies, auth references, database URLs, prompts, provider payloads, raw customer messages, unpublished source text, or protected cross-team knowledge data
