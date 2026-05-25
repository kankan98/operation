# internal-trial-mvp-hardening Specification

## Purpose
Define the internal trial MVP release path, recovery expectations, and
verification gates for evaluating the implemented V0 operator workbenches before
production authentication and external integrations exist.
## Requirements
### Requirement: Trial MVP path is explicit and verifiable
The workspace SHALL define a trial MVP path that lets an evaluator enter a demo
team and visit the implemented operator workbenches in a coherent live-commerce
workflow without treating the preview as production authentication.

#### Scenario: Evaluator follows the trial MVP path
- **WHEN** an evaluator starts from the public preview and enters a verified
  trial session
- **THEN** the workspace SHALL provide direct access to `/sessions`, `/rackets`,
  `/knowledge`, `/ai-review`, `/talk-tracks`, and `/next-actions` using concise
  operator-facing labels and SHALL keep each workbench responsible for its own
  protected data authorization

#### Scenario: Preview boundary is visible
- **WHEN** the trial MVP path is shown in normal UI
- **THEN** the UI SHALL identify the experience as internal trial or demo access
  for演示/脱敏数据 and SHALL NOT describe it as production login, production
  customer-data handling, external commerce integration, or final AI release

### Requirement: Trial MVP states are recoverable
The trial MVP path SHALL expose loading, empty, disabled, error, retry, re-enter,
ready, saved, generated, and review-ready states where they are relevant to the
implemented workbenches.

#### Scenario: Trial data is loading
- **WHEN** a workbench is resolving session scope or loading protected V0 data
- **THEN** it SHALL show visible progress or disabled action state and SHALL NOT
  silently present stale or unavailable protected data as ready

#### Scenario: Trial action fails
- **WHEN** trial entry, session verification, route loading, protected data
  loading, save, generation, review, or downstream creation fails
- **THEN** the UI SHALL show a safe operator-facing recovery action such as
  retry, reload, refresh session, re-enter trial, or continue with local demo
  where applicable

#### Scenario: Trial workbench is empty
- **WHEN** a workbench has no scoped V0 records or no eligible downstream
  records
- **THEN** it SHALL show a useful empty state and next action rather than a blank
  panel or implementation-facing message

### Requirement: Trial MVP verification covers the usable release path
The project SHALL include repeatable verification for the internal trial MVP
path across local checks, browser checks, and public preview smoke.

#### Scenario: Local trial MVP verifier runs
- **WHEN** the trial MVP verifier runs with local PostgreSQL and internal V0
  bootstrap enabled
- **THEN** it SHALL verify route-gate behavior, safe next-path fallback,
  bootstrap/session/logout boundaries, protected route accessibility under a
  valid scoped session, safe redaction, and deterministic cleanup or rollback

#### Scenario: Browser checks run before archive
- **WHEN** the trial MVP hardening change is ready to archive
- **THEN** Playwright SHALL verify trial entry, verified ready state, continue
  into at least one requested workbench, representative desktop and mobile
  layouts, console health, and absence of incoherent overlap or horizontal text
  overflow

#### Scenario: Public preview smoke runs after archive
- **WHEN** the change is archived and Docker preview is redeployed
- **THEN** the public preview SHALL be checked for HTTP availability, healthy
  Docker restart policy, trial entry, at least one protected workbench after
  trial session readiness, and safe disabled state for any provider-gated feature
  not enabled in preview
