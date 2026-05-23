# racket-product-workbench Specification

## Purpose
Define the static `/rackets` product library workbench for badminton racket
models, aliases, specifications, review/source states, downstream workflow
readiness, and non-persistence boundaries before real product data is added.
## Requirements
### Requirement: Racket product workbench replaces placeholder
The web application SHALL render a static Chinese racket product library
workbench at `/rackets` instead of the generic workflow placeholder.

#### Scenario: Operator opens racket product route
- **WHEN** an operator opens `/rackets`
- **THEN** the page shows a domain-specific product library workbench with model
  records, spec coverage, review state, alias handling, selling points, and
  downstream readiness rather than the generic placeholder

#### Scenario: Product actions are unavailable
- **WHEN** the page shows actions such as adding a model, importing specs,
  merging aliases, or sending records to AI workflows
- **THEN** the actions are disabled or clearly marked as future behavior and do
  not save, import, fetch, analyze, or persist data

### Requirement: Product records preserve badminton domain fields
The workbench SHALL display racket-specific fields needed for live-commerce
explanation and future AI grounding.

#### Scenario: Product row renders
- **WHEN** a static product row is displayed
- **THEN** it includes racket model, aliases, weight class, balance or balance
  point, shaft stiffness, recommended string tension, player level, play style,
  price band, selling focus, review state, and source freshness where available

#### Scenario: Spec field is missing or uncertain
- **WHEN** a product example lacks a field or needs review
- **THEN** the UI marks it as missing, review-only, or needs source verification
  instead of inventing authoritative values

### Requirement: Workbench distinguishes source and review states
The workbench SHALL make source freshness, confidence, and review status visible
without treating static examples as published knowledge.

#### Scenario: Review status is shown
- **WHEN** a product, alias, selling point, or comparison gap appears
- **THEN** it is labeled with a static review/source status such as official
  spec, team note, needs review, stale, conflict, or missing source

#### Scenario: Downstream readiness is shown
- **WHEN** product knowledge is shown as input to sessions, AI review, talk
  tracks, or Q&A
- **THEN** the UI explains which downstream workflow would use it and what
  remains blocked before live use

### Requirement: Product workbench follows global theme and motion governance
The workbench SHALL use existing theme tokens, workbench utility classes, and
motion primitives rather than page-local hardcoded styles.

#### Scenario: Component styles are implemented
- **WHEN** the product workbench renders panels, rows, status badges, or icon
  surfaces
- **THEN** it uses semantic token-backed classes, `workbench-*` utilities, and
  existing motion primitives compatible with light/dark themes

#### Scenario: Responsive UI is checked
- **WHEN** the workbench is viewed on desktop and mobile widths
- **THEN** labels, badges, product rows, and spec fields wrap or stack without
  incoherent overlap or text overflow

### Requirement: Documentation reflects racket workbench boundary
The project documentation SHALL describe `/rackets` as a static product library
workbench and preserve its non-goals.

#### Scenario: Contributor reads route documentation
- **WHEN** a contributor opens the web app README or roadmap
- **THEN** `/rackets` is described as a static workbench preview, with no
  persistence, source import, AI grounding, search, scraping, or team data
  behavior in this slice
