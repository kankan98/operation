## ADDED Requirements

### Requirement: Trial cockpit renders V0 acceptance package
The overview and `/trial` cockpit SHALL render the internal V0 acceptance
package after a trial session is verified, using the same scoped readiness,
feedback, and trial run evidence already available to the cockpit.

#### Scenario: Verified evaluator sees acceptance package
- **WHEN** a trial session is verified on the overview or `/trial` entry surface
- **THEN** the cockpit SHALL show a compact V0 acceptance package with release
  decision, evidence status, blocker or gate summary, and next action

#### Scenario: Acceptance package follows readiness evidence
- **WHEN** workflow readiness, trial run evidence, or feedback evidence changes
  during the verified session
- **THEN** the acceptance package SHALL update from the same deterministic
  cockpit state without requiring a full page refresh

#### Scenario: Acceptance package remains operational
- **WHEN** the cockpit renders on desktop or mobile
- **THEN** the acceptance package SHALL use existing workspace styles, stable
  responsive dimensions, accessible labels, visible focus states, and concise
  Chinese operator-facing copy without marketing-style hero content, decorative
  charts, or incoherent text overflow

#### Scenario: Acceptance package preserves V0 boundary
- **WHEN** the package says internal V0 can expand or production gates can be
  planned
- **THEN** the cockpit SHALL still identify production login, HTTPS, backups,
  sensitive-data governance, RAG/Q&A evaluation, and observability as separate
  future gates and SHALL NOT imply production readiness
