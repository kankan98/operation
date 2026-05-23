## ADDED Requirements

### Requirement: Sessions route shows a capture workbench
The `/sessions` route SHALL render a live-session capture workbench instead of
the generic placeholder page.

#### Scenario: Operator opens sessions route
- **WHEN** an operator opens `/sessions`
- **THEN** the page shows Chinese sections for session facts, product order, racket explanation checkpoints, customer questions, objections, draft states, and downstream readiness

#### Scenario: Static boundary is visible
- **WHEN** the session capture workbench renders
- **THEN** it clearly states that persistence, draft autosave, transcript upload, AI analysis, authentication, and platform integrations are not connected in this slice

### Requirement: Session source material uses domain-specific fields
The session capture workbench SHALL preserve badminton racket and live-commerce
domain language instead of generic content labels.

#### Scenario: Session facts are displayed
- **WHEN** sample session facts are shown
- **THEN** they include theme, host, date, audience focus, product order, performance-note placeholders, and source quality labels

#### Scenario: Product order is displayed
- **WHEN** sample product order rows are shown
- **THEN** each row includes racket model, role in the session, explanation checkpoint, customer-fit cue, and evidence boundary

#### Scenario: Questions and objections are displayed
- **WHEN** sample question and objection capture sections are shown
- **THEN** they include customer question themes, objection type, linked racket context, and future follow-up use

### Requirement: Draft and recovery states are previewed
The session capture workbench SHALL show future draft, validation, and recovery
states without implementing state mutation.

#### Scenario: Draft states are displayed
- **WHEN** draft or save states are shown
- **THEN** unsaved draft, missing required fields, long notes, refresh recovery, and ready-for-review states are represented as future states rather than active persistence behavior

#### Scenario: Controls are displayed
- **WHEN** save, import, upload, or analyze controls are shown
- **THEN** they are disabled or boundary-labeled so they do not imply data is saved or analyzed

### Requirement: Session capture remains frontend-only
The implementation SHALL not add persistence, API routes, database schemas,
uploads, transcript parsing, AI calls, authentication, analytics, external
fetching, or new dependencies.

#### Scenario: Static verification runs
- **WHEN** static verification runs
- **THEN** `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass without adding new packages

#### Scenario: Browser verification runs
- **WHEN** `/sessions` is checked on desktop and mobile
- **THEN** the page renders without console errors, text overflow, or incoherent overlap
