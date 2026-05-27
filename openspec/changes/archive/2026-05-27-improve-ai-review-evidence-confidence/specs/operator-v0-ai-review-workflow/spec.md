## ADDED Requirements

### Requirement: AI review V0 exposes evidence confidence before operator reuse
The `/ai-review` V0 browser workflow SHALL expose evidence confidence and reuse
readiness for the selected run before the operator accepts sections or creates
downstream draft references.

#### Scenario: Operator inspects a generated V0 run
- **WHEN** an authenticated V0 operator generates or loads a review-ready AI
  review run
- **THEN** the browser workflow SHALL display run-level evidence confidence and
  section-level reuse guidance derived from the protected run detail response

#### Scenario: Existing review actions remain protected
- **WHEN** the operator accepts, rejects, marks quality feedback, or creates a
  downstream draft reference after reading evidence guidance
- **THEN** the browser workflow SHALL continue to use the existing protected AI
  review routes with explicit tenant/team scope, credentials, no-store fetch
  behavior, and `x-operation-csrf: ai-review`

#### Scenario: Downstream action remains human-gated
- **WHEN** a generated section has not been accepted or edited by a human
  reviewer
- **THEN** the workflow SHALL keep downstream draft actions disabled regardless
  of section confidence or source count

### Requirement: AI review V0 verification covers evidence confidence
The V0 AI review verifier SHALL cover the deterministic evidence confidence
helper without using a live provider by default.

#### Scenario: Local V0 check validates evidence guidance
- **WHEN** `pnpm ai-review:v0-check` or the relevant focused verifier runs
  against local PostgreSQL
- **THEN** it SHALL verify that generated V0 run detail can be summarized into
  evidence confidence, source coverage, validation warning or blocker counts,
  feedback hotspots, and next review action without leaking sensitive metadata
