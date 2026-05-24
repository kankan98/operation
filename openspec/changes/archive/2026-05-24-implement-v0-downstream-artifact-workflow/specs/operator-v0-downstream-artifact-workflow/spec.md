## ADDED Requirements

### Requirement: V0 downstream workflow resolves local team context
The system SHALL provide a browser-usable local V0 workflow that resolves the same authenticated tenant/team context used by `/sessions` and `/ai-review` before creating or listing downstream talk-track assets and next-session tasks.

#### Scenario: Operator enters downstream workbench without session
- **WHEN** an operator opens `/talk-tracks` or `/next-actions` without a usable local V0 auth session
- **THEN** the page SHALL show a concise entry action and SHALL NOT call protected downstream list or mutation endpoints until the operator enters a team-scoped session

#### Scenario: Existing V0 context loads downstream data
- **WHEN** an operator already has a valid local V0 auth session and stored tenant/team scope
- **THEN** the downstream workbench SHALL verify `/api/auth/session` with explicit scope and then load only scoped downstream assets or tasks

#### Scenario: Context failure is safe
- **WHEN** auth verification, scope resolution, or protected downstream loading fails
- **THEN** the page SHALL show an operator-facing retry or re-enter state without exposing raw cookies, session references, provider keys, database URLs, prompts, provider payloads, or cross-team data

### Requirement: V0 downstream workflow preserves AI review provenance
The system SHALL preserve source provenance when creating downstream artifacts from accepted AI review sections.

#### Scenario: Accepted AI section creates downstream reference
- **WHEN** an authenticated V0 operator creates a downstream asset or task from an accepted or edited AI review section
- **THEN** the browser SHALL first create an AI review downstream artifact reference with explicit tenant/team scope, run ID, section ID, artifact type, and required CSRF header

#### Scenario: Rejected or pending section cannot create downstream artifact
- **WHEN** an AI review section is pending, rejected, or marked for regeneration
- **THEN** the browser SHALL keep downstream creation disabled for that section and the route SHALL reject direct downstream reference creation

#### Scenario: Source metadata is carried into downstream record
- **WHEN** a talk-track asset or next-session task is created from an AI review section
- **THEN** the saved record SHALL include source workflow, run ID, section ID where supported by the API contract, prompt/version metadata when available, and a non-sensitive summary rather than raw prompts or provider payloads

### Requirement: V0 downstream verification is repeatable
The system SHALL provide repeatable verification for the V0 downstream browser workflow across local route behavior and rendered browser behavior.

#### Scenario: Local downstream workflow check passes
- **WHEN** local PostgreSQL is available and the downstream V0 workflow check command runs
- **THEN** it SHALL verify V0 downstream permissions, CSRF blocking, auth/scope blocking, accepted-section downstream reference creation, talk-track asset creation, next-session task creation, safe redaction, and rollback or deterministic cleanup

#### Scenario: Browser verification runs before archive
- **WHEN** this change is ready to archive
- **THEN** Playwright SHALL verify `/ai-review`, `/talk-tracks`, and `/next-actions` on desktop and mobile for entry state, authenticated local workflow state where Secure cookie behavior allows it, downstream creation interactions, absence of console errors, and no incoherent text overflow or overlap
