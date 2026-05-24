## 1. Contract And Local Runtime Gates

- [x] 1.1 Validate the new OpenSpec change before code changes.
- [x] 1.2 Add failing local checks for V0 AI review permission, fake-provider execution, safe redaction, and decision recording.
- [x] 1.3 Extend the local V0 bootstrap membership with `run_ai_review` through permission override without changing global operator role semantics.

## 2. V0 AI Review Execution Runtime

- [x] 2.1 Add a server-only deterministic fake `AiProviderPort` for local V0 AI review execution.
- [x] 2.2 Add a gated local V0 execute route that reuses the existing AI review route handler with fake provider and existing auth/scope/CSRF checks.
- [x] 2.3 Add route-level tests/check coverage for disabled V0 execution, missing CSRF, missing auth/scope, successful fake execution, and safe output redaction.

## 3. Browser Workflow

- [x] 3.1 Add shared client workflow helpers for AI review V0 scope, API errors, session-to-run snapshot mapping, prompt metadata, provider policy, and safe status labels.
- [x] 3.2 Replace the static `/ai-review` workbench with a client workflow that resolves V0 context, lists review-ready sessions, lists runs, prepares a run, executes fake-provider review, loads detail, and records section decisions.
- [x] 3.3 Preserve dense Chinese operator UX across loading, empty, error, disabled, success, desktop, and mobile states.

## 4. Documentation And Verification

- [x] 4.1 Update roadmap, README, and accepted-status notes to describe the AI review V0 browser workflow and its local/HTTP preview boundary.
- [x] 4.2 Run OpenSpec validation, local workflow checks, lint, typecheck, build, and diff checks.
- [x] 4.3 Run Playwright desktop/mobile verification before archive, then archive the change, commit, push, rebuild/restart Docker, and check the public preview.
