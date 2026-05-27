## 1. Deterministic Remediation Logic

- [x] 1.1 Add failing V0 verifier assertions for remediation action priority, route labels, downstream gating, next-check guidance, and sensitive-data redaction.
- [x] 1.2 Implement typed AI review remediation summary helpers from existing protected run detail and quality triage data.
- [x] 1.3 Confirm remediation helper handles not-generated, validation-blocked, feedback-repair, pending-review, downstream-ready, and review-complete states.

## 2. Operator Workbench UI

- [x] 2.1 Render a compact `/ai-review` remediation priority panel with action cards, affected section counts, route labels, downstream block state, and next-check guidance.
- [x] 2.2 Keep copy concise, Chinese, operator-facing, and clear that remediation is review-only and human-gated.
- [x] 2.3 Preserve responsive layout, focusable controls, wrapping badges, loading/empty/error compatibility, and no horizontal overflow.

## 3. Documentation And Specs

- [x] 3.1 Update AI review contract with the remediation workflow boundary and future queue/source-review handoff notes.
- [x] 3.2 Update roadmap/goal notes so AI quality blockers now continue through remediation priority before production AI/RAG work.

## 4. Verification And Release

- [x] 4.1 Run `openspec validate improve-ai-review-remediation-workflow`.
- [x] 4.2 Run focused AI review checks, lint, typecheck, and build.
- [x] 4.3 Run Playwright desktop and mobile verification for `/ai-review` before archive.
- [x] 4.4 Confirm the post-archive release checklist: archive the change, commit with Conventional Commits, push to remote, redeploy Docker, and smoke public preview routes.
