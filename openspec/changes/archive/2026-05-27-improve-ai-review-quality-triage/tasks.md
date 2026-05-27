## 1. Proposal And Contract Gate

- [x] 1.1 Validate the OpenSpec proposal, design, and capability deltas before runtime changes.

## 2. Deterministic Quality Triage

- [x] 2.1 Add typed run-level and section-level quality triage summaries to the AI review V0 workflow helper.
- [x] 2.2 Implement deterministic quality triage priority, repair routing, affected section counts, safe next action, and downstream readiness from existing run detail fields.

## 3. Verification Coverage

- [x] 3.1 Extend the AI review V0 verifier to cover blocker priority, feedback repair routing, section repair reasons, downstream gating, and safe redaction without live provider calls.

## 4. Workbench UI

- [x] 4.1 Add a compact `/ai-review` quality triage panel using existing workbench components, icons, badges, tokens, and Chinese operator-facing copy.
- [x] 4.2 Add section-card repair labels and guidance without bypassing existing human review and downstream gates.

## 5. Validation

- [x] 5.1 Run focused AI review checks and project static/build verification.
- [x] 5.2 Run OpenSpec validation for the active change.
- [x] 5.3 Run Playwright desktop/mobile verification before archive because rendered `/ai-review` UI changes are in scope.
