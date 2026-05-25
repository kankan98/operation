## ADDED Requirements

### Requirement: AI review V0 records feedback signals through protected runtime
The `/ai-review` V0 browser workflow SHALL record feedback signals through the
existing protected AI review feedback route with explicit local V0 scope.

#### Scenario: Feedback route is called with scope and CSRF
- **WHEN** an authenticated V0 operator records accepted, rejected,
  missing-knowledge, wrong-source, evidence-weak, or downstream-used feedback
- **THEN** the browser SHALL call the feedback-signals route with explicit
  tenant/team scope, credentials, no-store fetch behavior, and
  `x-operation-csrf: ai-review`

#### Scenario: No usable V0 session exists
- **WHEN** an operator opens `/ai-review` without a verified local V0 session
  and attempts to use feedback controls
- **THEN** the workbench SHALL keep protected feedback actions unavailable until
  the operator enters and verifies a scoped session

#### Scenario: Feedback reloads run detail
- **WHEN** feedback recording succeeds
- **THEN** the workflow SHALL reload the selected run detail or otherwise update
  it from the protected detail response so feedback state is visible in the
  current team scope

### Requirement: AI review V0 preserves main review actions when feedback follow-up fails
The `/ai-review` V0 workflow SHALL not lose a successful review decision or
downstream draft reference merely because the follow-up feedback signal fails.

#### Scenario: Decision succeeds but feedback fails
- **WHEN** an accept or reject decision succeeds but the matching feedback
  signal request fails
- **THEN** the workbench SHALL keep the saved decision visible, show a safe
  feedback warning, and allow the operator to retry feedback or continue review

#### Scenario: Downstream reference succeeds but feedback fails
- **WHEN** downstream draft reference creation succeeds but downstream-used
  feedback recording fails
- **THEN** the workbench SHALL preserve the downstream draft reference result and
  avoid claiming that evaluation feedback was captured

### Requirement: AI review V0 verification covers feedback learning
The V0 AI review verifier SHALL cover browser-workflow feedback behavior without
using a live provider by default.

#### Scenario: V0 workflow check records feedback
- **WHEN** `pnpm ai-review:v0-check` or the relevant focused verifier runs
- **THEN** it SHALL verify fake-provider generation, feedback signal recording,
  run detail feedback visibility, and safe redaction without making a live
  DeepSeek request
