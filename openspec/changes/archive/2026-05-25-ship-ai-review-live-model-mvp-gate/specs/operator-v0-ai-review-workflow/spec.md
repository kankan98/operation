## ADDED Requirements

### Requirement: AI review workbench supports gated live model mode
The `/ai-review` operator workbench SHALL support a gated live-model mode while
preserving local V0 fake-provider generation as the default.

#### Scenario: Workbench loads live readiness
- **WHEN** an authenticated operator opens `/ai-review`
- **THEN** the workbench SHALL load live-model readiness with explicit
  tenant/team scope and show a compact mode/status indication

#### Scenario: Operator uses default fake mode
- **WHEN** the operator keeps the default local V0 mode and generates an
  input-ready run
- **THEN** the workbench SHALL call `execute-v0` and preserve the existing fake
  provider workflow behavior

#### Scenario: Operator uses ready live mode
- **WHEN** live-model readiness is ready and the operator chooses real-model
  mode for an input-ready run
- **THEN** the workbench SHALL call the protected live execute route with safe
  provider policy metadata and then show generated sections as AI suggestions
  requiring human review

#### Scenario: Live mode is not ready
- **WHEN** live-model readiness is disabled, missing, invalid, or cannot be
  loaded
- **THEN** the workbench SHALL keep the live mode action disabled or return to
  fake mode, show a concise operator-facing reason, and avoid exposing internal
  configuration details

#### Scenario: Live mode error is accessible
- **WHEN** live execution fails
- **THEN** the workbench SHALL present the error in an accessible alert region
  with safe operator-facing copy and SHALL keep the prepared run inspectable or
  recoverable where possible

