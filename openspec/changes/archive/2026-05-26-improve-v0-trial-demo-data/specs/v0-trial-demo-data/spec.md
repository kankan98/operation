## ADDED Requirements

### Requirement: V0 trial bootstrap seeds safe demo data
The internal V0 trial bootstrap SHALL seed or reuse one deterministic,
tenant/team-scoped, demo-only live-commerce scenario that covers the implemented
V0 workflow path.

#### Scenario: Bootstrap creates demo scenario when none exists
- **WHEN** an evaluator enters the internal V0 trial with bootstrap enabled and
  valid CSRF
- **THEN** the system SHALL ensure a safe demo scenario exists for the
  deterministic V0 tenant/team, including at least one scoped record for live
  session capture, racket product, knowledge source or version, AI review run,
  talk-track asset, and next-session task

#### Scenario: Bootstrap is idempotent for demo business data
- **WHEN** the evaluator enters the internal V0 trial more than once
- **THEN** the system SHALL reuse existing scoped demo business records where
  possible and SHALL NOT create duplicate demo sessions, duplicate racket
  products, duplicate knowledge sources, duplicate talk-track scenarios, or
  duplicate next-session tasks for the same deterministic sample story

#### Scenario: Demo data remains local and scoped
- **WHEN** demo records are created or listed
- **THEN** every record SHALL use the deterministic V0 tenant/team scope, SHALL
  remain protected by existing server-side auth/scope/repository boundaries,
  and SHALL NOT be visible across tenants or teams

### Requirement: Demo scenario preserves safety and provenance
The V0 demo scenario SHALL be realistic enough for workflow evaluation while
remaining de-identified, review-gated, and traceable.

#### Scenario: Demo content is de-identified
- **WHEN** demo records are inspected through protected APIs or rendered pages
- **THEN** they SHALL NOT contain real customer names, phone numbers, addresses,
  order identifiers, private messages, full raw transcripts, supplier details,
  production pricing strategy, API keys, cookies, database URLs, authorization
  headers, raw prompts, or provider payloads

#### Scenario: Demo AI review is not authoritative truth
- **WHEN** demo AI review output or downstream records are shown
- **THEN** the output SHALL remain labeled or represented as local V0/fake
  provider review content with source references, human-review state, and
  downstream provenance rather than production AI truth

#### Scenario: Demo product and knowledge records use domain language
- **WHEN** demo product, session, knowledge, talk-track, or task records are
  created
- **THEN** they SHALL use badminton live-commerce language such as racket model,
  weight class, balance point, shaft stiffness, recommended tension, player
  level, play style, live-session theme, customer question, objection, talk
  track, and next-session action

### Requirement: Trial cockpit explains the available demo path
The trial and overview cockpit SHALL give evaluators concise guidance for using
the loaded demo scenario without becoming a marketing page or internal
implementation guide.

#### Scenario: Verified evaluator sees demo path guidance
- **WHEN** an evaluator has a verified V0 trial session
- **THEN** the cockpit SHALL show concise Chinese operator-facing guidance that
  identifies the loaded demo scenario, recommends the first useful path to
  inspect, and allows direct access to the implemented workbenches

#### Scenario: Data-safety reminder is concise
- **WHEN** the trial cockpit asks for interaction or feedback
- **THEN** it SHALL remind evaluators to use only demo or de-identified data and
  SHALL NOT include long OpenSpec, backend, database, AI-provider, or production
  architecture explanations in normal UI

#### Scenario: Cockpit remains usable on desktop and mobile
- **WHEN** the trial and overview cockpit render on desktop or mobile
- **THEN** the demo guidance SHALL use existing workspace design language,
  stable dimensions, accessible controls, and concise copy without incoherent
  text overflow, overlapping UI, decorative charts, or marketing-style hero
  content

### Requirement: Demo data quality is verifiable
The project SHALL include repeatable verification for the V0 demo data path
before archive.

#### Scenario: Local demo-data verifier passes
- **WHEN** the local demo-data check runs with PostgreSQL available and V0
  bootstrap enabled
- **THEN** it SHALL verify bootstrap success, demo records across all six
  implemented workbenches, idempotency after repeated bootstrap, safe redaction,
  no-store responses where applicable, readiness summary non-zero counts, and
  feedback API compatibility

#### Scenario: Browser verification covers demo guidance
- **WHEN** this change is ready to archive
- **THEN** Playwright SHALL verify `/trial` and `/` for trial entry, verified
  ready state, demo guidance rendering, readiness counts or loaded scenario
  signal, feedback compatibility, console health, desktop/mobile layout, and no
  incoherent text overflow

#### Scenario: Roadmap records V0 acceleration state
- **WHEN** this change is completed
- **THEN** roadmap documentation SHALL state that V0 sample/demo data quality
  and public trial guidance have advanced, update the internal V0 completion
  estimate, and identify the next V0/V1 candidate based on remaining evidence
  rather than restarting completed foundation work
