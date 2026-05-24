# talk-track-workbench Specification

## Purpose
TBD - created by archiving change implement-v0-downstream-artifact-workflow. Update Purpose after archive.
## Requirements
### Requirement: Talk-track route shows a browser workbench
The `/talk-tracks` route SHALL render a browser workbench that can operate in the authenticated local V0 team context and connect accepted AI review sections or manual operator input to protected talk-track asset creation and listing.

#### Scenario: Operator opens talk-track route
- **WHEN** an operator opens `/talk-tracks`
- **THEN** the page shows Chinese sections for V0 team entry, asset list, source selection, draft creation, review state, reuse metadata, loading, empty, error, disabled, and success states

#### Scenario: Scoped assets are listed
- **WHEN** the operator has a valid local V0 auth session and team scope
- **THEN** the page SHALL load scoped talk-track assets through the protected list route and show title, asset type, status, scenario, updated time, and readiness/reuse state without cross-team data

#### Scenario: Empty state is actionable
- **WHEN** scoped talk-track assets are empty
- **THEN** the page SHALL show a concise empty state that directs the operator to create a draft from an accepted AI review section or manual talk-track input

### Requirement: Talk-track workbench creates reviewable draft assets
The `/talk-tracks` workbench SHALL let an authenticated V0 operator create reviewable draft talk-track assets through existing protected Route Handlers.

#### Scenario: Create draft from accepted AI review section
- **WHEN** the operator selects an accepted AI review section eligible for talk-track reuse and saves a draft
- **THEN** the browser SHALL call the talk-track asset create route with explicit tenant/team scope, the required mutation CSRF header, AI source metadata, scenario metadata, source grounding, and draft body

#### Scenario: Create manual draft
- **WHEN** the operator enters a manual title and script body without an AI review source
- **THEN** the browser SHALL save a manual draft through the protected talk-track asset create route and label the source as manual/team input

#### Scenario: Draft is not automatically published
- **WHEN** a talk-track draft is created from AI review or manual input
- **THEN** the page SHALL show it as draft/reviewable and SHALL NOT call publish or mark it as authoritative reuse material automatically

### Requirement: Talk-track workbench remains usable on mobile and desktop
The `/talk-tracks` workbench SHALL remain readable and operable across desktop and mobile viewports.

#### Scenario: Mobile layout has no horizontal overflow
- **WHEN** `/talk-tracks` renders at a 390px-wide viewport
- **THEN** asset lists, creation controls, source chips, and action buttons SHALL fit without horizontal page overflow or text overlap

#### Scenario: Errors are safe and actionable
- **WHEN** a protected talk-track request fails
- **THEN** the page SHALL show concise Chinese recovery text without exposing raw cookies, auth references, database URLs, prompts, provider payloads, or protected cross-team data
