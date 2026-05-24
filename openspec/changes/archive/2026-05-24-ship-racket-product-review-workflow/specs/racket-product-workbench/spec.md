## ADDED Requirements

### Requirement: Racket product workbench completes source review publish workflow
The `/rackets` workbench SHALL let an authenticated V0 operator move a product draft through source registration, review submission, source approval, product approval, and publish using protected local routes.

#### Scenario: Operator selects product for source work
- **WHEN** scoped products are loaded in `/rackets`
- **THEN** the workbench SHALL provide a stable way to select a product for source/review actions and SHALL show its current status, source summary, and downstream readiness

#### Scenario: Source registration form succeeds
- **WHEN** the operator selects a product, enters valid source metadata, and submits the source form
- **THEN** the browser SHALL call the protected source registration route with explicit scope and CSRF, show the returned pending source state, refresh the queue, and not claim the product is reviewed or published

#### Scenario: Review submission succeeds
- **WHEN** a selected product has at least one source and the operator submits it for review
- **THEN** the browser SHALL call the protected submit route and update the product status to `reviewing` from the route response

#### Scenario: Review and publish actions respect state gates
- **WHEN** the operator approves a source, approves a product, or publishes a product
- **THEN** the workbench SHALL call the matching protected route, show success or safe route errors, and keep disabled states when no selected product, source, or valid state is available

#### Scenario: Review queue is visible
- **WHEN** the operator enters an authenticated V0 `/rackets` workflow
- **THEN** the page SHALL load and render the product review queue with concise Chinese labels for source count, approved sources, pending sources, product status, and next action

### Requirement: Racket product review UI remains operational and safe
The source/review/publish UI SHALL remain dense, responsive, and operator-facing without exposing implementation notes or sensitive metadata.

#### Scenario: Mobile layout remains usable
- **WHEN** `/rackets` is rendered at a mobile viewport
- **THEN** source forms, review queue rows, action buttons, status labels, and product records SHALL wrap or stack without horizontal overflow, incoherent overlap, or clipped button text

#### Scenario: Route errors are actionable
- **WHEN** a source, review, queue, or publish request fails
- **THEN** the page SHALL show concise Chinese recovery text and SHALL NOT expose raw cookies, session references, database URLs, provider keys, prompts, raw source payloads, or cross-team records

#### Scenario: AI readiness is not overstated
- **WHEN** a product is only draft, needs source, reviewing, approved, rejected, stale, conflict, or archived
- **THEN** the UI SHALL show the returned readiness blockers and SHALL NOT describe the product as published or Q&A-ready unless the route returns a published state with ready downstream workflows
