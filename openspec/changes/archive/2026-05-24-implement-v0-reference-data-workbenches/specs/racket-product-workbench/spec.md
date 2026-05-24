## MODIFIED Requirements

### Requirement: Racket product workbench replaces placeholder
The web application SHALL render a Chinese racket product library workbench at `/rackets` that can operate in the authenticated local V0 team context and connect operator input to protected racket product list/create behavior.

#### Scenario: Operator opens racket product route
- **WHEN** an operator opens `/rackets`
- **THEN** the page shows a domain-specific product library workbench with V0 team entry, product records, spec coverage, review state, alias handling, selling points, downstream readiness, loading, empty, error, disabled, and success states rather than the generic placeholder

#### Scenario: Product actions are gated by context
- **WHEN** the page shows actions such as adding a model, registering a source, reviewing records, or sending records to downstream AI workflows
- **THEN** protected list or mutation actions SHALL stay disabled until a valid local V0 team-scoped session is available, and unavailable future actions SHALL remain clearly marked as not connected

### Requirement: Product records preserve badminton domain fields
The workbench SHALL display and collect racket-specific fields needed for live-commerce explanation and future AI grounding.

#### Scenario: Product row renders
- **WHEN** a scoped product row is displayed
- **THEN** it includes racket model, aliases, weight class, balance or balance point, shaft stiffness, recommended string tension, player level, play style, price band, selling focus, review state, source freshness, and downstream readiness where available

#### Scenario: Product draft form renders
- **WHEN** an authenticated V0 operator creates a racket product draft
- **THEN** the form SHALL include visible Chinese labels for model, brand or series, aliases, weight class, balance, shaft stiffness, tension, player level, play style, price band, selling focus, limitations, and source/review context where supported

#### Scenario: Spec field is missing or uncertain
- **WHEN** a product example or scoped product record lacks a field or needs review
- **THEN** the UI marks it as missing, review-only, or needs source verification instead of inventing authoritative values

### Requirement: Workbench distinguishes source and review states
The workbench SHALL make source freshness, confidence, review status, and downstream readiness visible without treating draft or pending records as published knowledge.

#### Scenario: Review status is shown
- **WHEN** a product, alias, selling point, comparison gap, or source-backed record appears
- **THEN** it is labeled with a review/source status such as official spec, team note, needs review, stale, conflict, draft, pending source, approved, published, or missing source

#### Scenario: Downstream readiness is shown
- **WHEN** product knowledge is shown as input to sessions, AI review, talk tracks, or Q&A
- **THEN** the UI explains which downstream workflow would use it and what remains blocked before live use

#### Scenario: Draft is not automatically published
- **WHEN** the browser creates or reloads a product through the protected product API
- **THEN** the UI SHALL show the API-returned state and SHALL NOT claim the product is approved, published, or AI-ready unless the returned readiness says so

### Requirement: Documentation reflects racket workbench boundary
The project documentation SHALL describe `/rackets` as a local V0 product library workbench and preserve its runtime boundaries.

#### Scenario: Contributor reads route documentation
- **WHEN** a contributor opens the web app README or roadmap
- **THEN** `/rackets` is described as a local V0 product workbench using accepted protected APIs, with production login, public source discovery, RAG grounding, scraping, team management, and production persistence still out of scope

## ADDED Requirements

### Requirement: Racket product workbench creates scoped products
The `/rackets` workbench SHALL let an authenticated V0 operator create scoped racket product records through existing protected Route Handlers.

#### Scenario: Create product succeeds
- **WHEN** the operator enters valid racket product details and saves
- **THEN** the browser SHALL call `POST /api/rackets/products` with explicit tenant/team scope, the required mutation CSRF header, route-safe product JSON, and no client-supplied ownership fields

#### Scenario: Scoped products are listed
- **WHEN** the operator has a valid local V0 auth session and team scope
- **THEN** the page SHALL load scoped racket products through `GET /api/rackets/products` and show only current-team records

#### Scenario: Duplicate or invalid product is not silently saved
- **WHEN** the protected product route rejects a duplicate model, alias conflict, invalid field, missing permission, or invalid state
- **THEN** the page SHALL show the safe route message and SHALL NOT claim the product was created

### Requirement: Racket product workbench remains usable on mobile and desktop
The `/rackets` workbench SHALL remain readable and operable across desktop and mobile viewports.

#### Scenario: Mobile layout has no horizontal overflow
- **WHEN** `/rackets` renders at a 390px-wide viewport
- **THEN** product lists, form controls, source chips, readiness badges, and action buttons SHALL fit without horizontal page overflow or text overlap

#### Scenario: Errors are safe and actionable
- **WHEN** a protected racket request fails
- **THEN** the page SHALL show concise Chinese recovery text without exposing raw cookies, auth references, database URLs, prompts, provider payloads, raw customer messages, or protected cross-team product data
