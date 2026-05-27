## MODIFIED Requirements

### Requirement: AI review V0 exposes quality triage before downstream reuse
The `/ai-review` V0 browser workflow SHALL expose quality triage and remediation
priority for the selected run before the operator creates downstream draft
references.

#### Scenario: Operator inspects generated run quality
- **WHEN** an authenticated V0 operator generates or loads a review-ready AI review run
- **THEN** the browser workflow SHALL display run-level quality triage,
  remediation priority, and section-level repair guidance derived from the
  protected run detail response

#### Scenario: Triage does not bypass human gates
- **WHEN** quality triage marks a section as clean or downstream-ready
- **THEN** downstream draft actions SHALL still require accepted or edited human review state and SHALL continue to use protected AI review routes with explicit tenant/team scope, credentials, no-store fetch behavior, and `x-operation-csrf: ai-review`

#### Scenario: Triage identifies repair route
- **WHEN** quality triage identifies knowledge, source, prompt, validation, or evaluation repair
- **THEN** the workflow SHALL keep the section reviewable and SHALL NOT automatically create downstream references, publish knowledge, revise prompts, or change source trust

#### Scenario: Remediation priority explains next repair action
- **WHEN** the selected run has validation blockers, quality feedback, pending
  sections, or downstream-ready accepted sections
- **THEN** the workflow SHALL show a compact ordered remediation plan with route
  labels, affected section counts, downstream block state, and next-check
  guidance before the operator uses downstream controls

### Requirement: AI review V0 verifier covers quality triage
The V0 AI review verifier SHALL cover deterministic quality triage and
remediation behavior without using a live provider by default.

#### Scenario: Local V0 check validates quality triage
- **WHEN** `pnpm ai-review:v0-check` or the relevant focused verifier runs against local PostgreSQL
- **THEN** it SHALL verify generated run detail can be summarized into quality stage, priority repair route, affected section counts, section repair reasons, downstream readiness, remediation action priority, and safe redaction without making a live DeepSeek request
