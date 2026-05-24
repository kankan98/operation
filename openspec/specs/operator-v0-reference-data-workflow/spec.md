# operator-v0-reference-data-workflow Specification

## Purpose
Define the local V0 reference-data browser workflow that reuses the operator V0
team context for `/rackets` and `/knowledge`, preserves source/review
boundaries, and verifies protected product and knowledge lifecycle behavior
before production login, RAG, AI calls, or public source discovery.
## Requirements
### Requirement: V0 reference-data workflow resolves local team context
The system SHALL provide a browser-usable local V0 workflow that resolves the same authenticated tenant/team context used by `/sessions`, `/ai-review`, `/talk-tracks`, and `/next-actions` before creating, listing, reviewing, or publishing racket product and knowledge lifecycle records.

#### Scenario: Operator opens reference-data route without session
- **WHEN** an operator opens `/rackets` or `/knowledge` without a usable local V0 auth session
- **THEN** the page SHALL show a concise entry action and SHALL NOT call protected product or knowledge list/mutation endpoints until the operator enters a team-scoped session

#### Scenario: Existing V0 context loads reference data
- **WHEN** an operator already has a valid local V0 auth session and stored tenant/team scope
- **THEN** the reference-data workbench SHALL verify `/api/auth/session` with explicit scope and then load only scoped product or knowledge records

#### Scenario: Context failure is safe
- **WHEN** auth verification, scope resolution, or protected reference-data loading fails
- **THEN** the page SHALL show an operator-facing retry or re-enter state without exposing raw cookies, session references, provider keys, database URLs, prompts, provider payloads, source text, or cross-team data

### Requirement: V0 reference-data workflow preserves source and review boundaries
The reference-data workflow SHALL distinguish drafts, pending sources, reviewed records, published knowledge, and downstream-ready inputs before AI or operational workflows reuse them.

#### Scenario: Product draft is not published automatically
- **WHEN** an authenticated V0 operator creates a racket product from the browser
- **THEN** the saved record SHALL remain draft or review-gated according to the product API response and SHALL NOT be shown as AI-ready or published unless the protected API returns that state

#### Scenario: Knowledge source is review-gated
- **WHEN** an authenticated V0 operator registers a source, claim, or team note from the browser
- **THEN** the saved record SHALL show its review state and SHALL NOT be treated as published knowledge without a supported review and publish flow

#### Scenario: Source metadata is visible without raw sensitive payloads
- **WHEN** a product or knowledge record is created from browser input
- **THEN** the UI SHALL preserve source type, title, trust level, intended use, review status, and non-sensitive summaries rather than raw prompts, provider payloads, customer messages, or private business data

### Requirement: V0 reference-data verification is repeatable
The system SHALL provide repeatable verification for the V0 reference-data browser workflow across local route behavior and rendered browser behavior.

#### Scenario: Local reference-data workflow check passes
- **WHEN** local PostgreSQL is available and the reference-data V0 workflow check command runs
- **THEN** it SHALL verify V0 reference-data permissions, CSRF blocking, auth/scope blocking, product creation/listing, knowledge source registration/listing, safe redaction, and rollback or deterministic cleanup

#### Scenario: Browser verification runs before archive
- **WHEN** this change is ready to archive
- **THEN** Playwright SHALL verify `/rackets` and `/knowledge` on desktop and mobile for entry state, authenticated local workflow state where Secure cookie behavior allows it, create/list/review interactions, absence of console errors, and no incoherent text overflow or overlap
