## ADDED Requirements

### Requirement: Trial cockpit renders V0 evidence review digest
The overview and `/trial` cockpit SHALL render a V0 evidence review digest
after a trial session is verified, using the same scoped readiness, feedback,
trial run, and acceptance package signals already available to the cockpit.

#### Scenario: Verified evaluator sees evidence review digest
- **WHEN** a trial session is verified on the overview or `/trial` entry surface
- **THEN** the cockpit SHALL show a compact evidence review digest with review
  conclusion, evidence strength, top review actions, and V0/V1 boundary

#### Scenario: Evidence review follows live cockpit state
- **WHEN** workflow readiness, trial run evidence, feedback evidence, or the
  acceptance package changes during the verified session
- **THEN** the evidence review digest SHALL update from the same deterministic
  cockpit state without requiring a full page refresh

#### Scenario: Evidence review helps choose the next wave
- **WHEN** the evidence review digest has enough scoped evidence to recommend a
  next action
- **THEN** the cockpit SHALL make clear whether the next wave should collect
  evidence, fix a workbench blocker, expand internal trial, or plan production
  gates

#### Scenario: Evidence review remains bounded
- **WHEN** the evidence review digest renders on desktop or mobile
- **THEN** it SHALL use existing workspace styles, stable responsive dimensions,
  accessible labels, visible focus states, and concise Chinese operator-facing
  copy without marketing-style hero content, decorative charts, or incoherent
  text overflow
