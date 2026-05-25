## 1. Client Types And Feedback Helpers

- [x] 1.1 Extend AI review client types with feedback signal fields, labels, route labels, priority labels, and safe summary helpers.
- [x] 1.2 Add deterministic feedback payload helpers for accepted, rejected, missing-knowledge, wrong-source, evidence-weak, and downstream-used signals.

## 2. AI Review Workbench Feedback UI

- [x] 2.1 Wire `/ai-review` decision actions to record matching feedback signals after successful accept/reject decisions.
- [x] 2.2 Add explicit section quality controls for missing knowledge, wrong source, and weak evidence with loading/disabled/error behavior.
- [x] 2.3 Record downstream-used feedback after successful downstream draft reference creation without blocking the main downstream result.
- [x] 2.4 Render compact run-level feedback summary and recent feedback history in the AI review sidebar.
- [x] 2.5 Check touched AI review controls for concise Chinese copy, accessible focus states, stable desktop/mobile layout, and no implementation-detail leakage.

## 3. Verification

- [x] 3.1 Extend AI review route and/or V0 verification to prove feedback signal recording, run detail feedback visibility, downstream-used feedback, safe redaction, tenant/team scope, and fake-provider-only behavior.
- [x] 3.2 Run OpenSpec validation for the change and all specs.
- [x] 3.3 Run focused AI review checks and the standard lint/typecheck/build suite.
- [x] 3.4 Run Playwright browser checks for `/ai-review` feedback controls and summary before archive.

## 4. Documentation And Roadmap

- [x] 4.1 Update `docs/contracts/ai-review-run.md` with the V0 feedback learning browser state and remaining deferred capabilities.
- [x] 4.2 Update `docs/roadmap/ai-continuous-development-goal.md` and `docs/roadmap/autonomous-development-roadmap.md` to reflect the feedback learning wave and next-stage boundaries.
- [x] 4.3 Review the active OpenSpec artifacts for scope drift, unresolved placeholders, and archive readiness.
