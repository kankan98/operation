## Why

The internal V0 now has a complete demo path and scoped trial feedback, but an
evaluator still has to infer whether the version is ready to try, which path to
run, and what evidence is needed before the team can confidently move toward a
usable release. This slows the user's requested "usable first, iterate later"
strategy because progress, evidence, and next action are visible in separate
pieces rather than one operator-facing readiness decision.

Pre-proposal research and value exploration:

- Nielsen Norman Group usability guidance was checked as a professional UX
  source for small-sample formative testing. It supports using a few realistic
  evaluator sessions to uncover severe workflow friction quickly rather than
  waiting for large-scale measurement before improving a trial.
- GOV.UK Service Manual user-research and beta guidance was checked as an
  official public-service source. It reinforces grounding beta decisions in
  real users, real tasks, observed issues, and actionable findings.
- NIST AI Risk Management Framework was checked as a standards-body source for
  AI-product governance. It supports keeping AI use, feedback, oversight, and
  readiness signals visible before expanding automation or using sensitive data.
- `opportunity-solution-tree` exploration framed the desired outcome as faster
  internal V0 activation. The highest-value opportunity is not another isolated
  workbench: it is helping evaluators understand "what is ready, what to try
  next, what blocks real usage, and what evidence is still missing".
- `ui-ux-pro-max` guidance was reviewed for dashboard/trial UX, but the project
  decision is to keep a calm Chinese operator cockpit: compact status,
  checklists, evidence, and next actions; no marketing hero, decorative charts,
  or oversized onboarding.

## What Changes

- Add a V0.9 trial readiness cockpit section to the overview and trial entry
  surfaces after a verified trial session is ready.
- Combine existing V0 workflow readiness counts and feedback evidence into a
  deterministic readiness stage:
  - `collect_evidence`
  - `fix_blockers`
  - `ready_for_internal_trial`
  - `prepare_production_gate`
- Show an operator-facing trial run checklist for the six implemented
  workbenches, including what each step proves and what feedback should be
  submitted after the evaluator runs it.
- Surface the next best evaluation action from existing readiness/evidence
  signals without claiming production readiness.
- Keep the current local-only data boundary: no new database table, no external
  analytics, no production login, no live AI call, no RAG, and no third-party
  survey service.
- Update checks and durable roadmap/spec docs so V0.9 progress is reported as a
  trial-readiness gate, separate from production completion.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `v0-usable-trial-workflow`: add V0.9 readiness-stage requirements and a
  cockpit run checklist for the implemented trial path.
- `v0-trial-feedback`: use scoped evidence summary as an input to the V0.9
  readiness stage and next evaluation action.

## Impact

- Affected frontend: `apps/web/src/components/internal-trial-access.tsx` and
  likely a small shared helper under `apps/web/src/lib/`.
- Affected checks: local trial workflow/feedback checks or a new focused
  readiness helper check, plus existing `trial-feedback:check`,
  `trial-mvp:check`, lint, typecheck, build, and Playwright before archive.
- Affected docs/specs: `openspec/specs/v0-usable-trial-workflow/spec.md`,
  `openspec/specs/v0-trial-feedback/spec.md`,
  `docs/roadmap/ai-continuous-development-goal.md`, and
  `docs/roadmap/autonomous-development-roadmap.md`.
- Data/API impact: no schema migration and no new public API required unless
  implementation finds the existing client-only composition is too fragile.
- Security impact: the cockpit must keep the trial as internal/demo-only,
  preserve app-owned session scope, avoid sensitive data in copy or logs, and
  explicitly separate internal V0.9 readiness from production readiness.
- Dependency impact: no new runtime or development dependencies.
