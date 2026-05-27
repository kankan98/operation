## 1. Evidence Confidence Model

- [x] 1.1 Add focused failing verification for AI review evidence confidence summaries.
- [x] 1.2 Implement typed evidence confidence helpers in the existing AI review V0 workflow library.
- [x] 1.3 Verify helper behavior with the focused AI review V0 check.

## 2. Workbench UI

- [x] 2.1 Render a selected-run evidence confidence cockpit in `/ai-review`.
- [x] 2.2 Add section-level evidence guidance and reuse readiness to generated section cards.
- [x] 2.3 Preserve existing protected review, feedback, and downstream action behavior.

## 3. Specs And Documentation

- [x] 3.1 Fix stale TBD purpose text in touched accepted AI review specs.
- [x] 3.2 Update roadmap/goal notes for the AI review trust wave after implementation evidence is known.

## 4. Verification

- [x] 4.1 Run `openspec validate improve-ai-review-evidence-confidence`.
- [x] 4.2 Run focused AI review checks without live provider calls.
- [x] 4.3 Run lint, typecheck, and build.
- [x] 4.4 Run Playwright desktop/mobile verification for `/ai-review` before archive.
