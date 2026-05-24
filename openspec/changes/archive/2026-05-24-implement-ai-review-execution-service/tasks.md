## 1. Verifier First

- [x] 1.1 Add `apps/web/src/server/ai-review/execution-check.ts` with fake-provider success, validation-blocked, provider-failure, cross-team, leakage, and rollback scenarios.
- [x] 1.2 Add root and web `ai-review:execution-check` scripts.
- [x] 1.3 Run `pnpm ai-review:execution-check` and confirm it fails for the expected missing execution service.

## 2. Execution Service

- [x] 2.1 Implement `apps/web/src/server/ai-review/execution.ts` as server-only service with provider-neutral input, result, and safe error types.
- [x] 2.2 Build generation input from persisted run detail, prompt metadata, bounded input snapshot, knowledge snapshot, requested sections, request ID, and optional generation controls.
- [x] 2.3 Delegate start/permission/state gates to `AiReviewRunRepository` and prevent provider invocation for non-executable run states.
- [x] 2.4 Persist successful generation metadata, output sections, validation results, and mark `review_ready` only when validation has no failed or blocked status.
- [x] 2.5 Persist safe provider or validation failure metadata without saving partial AI output as usable suggestions.

## 3. Documentation And Project Records

- [x] 3.1 Update `docs/contracts/ai-review-run.md` with the execution-service local runtime boundary and remaining exclusions.
- [x] 3.2 Update architecture and autonomous roadmaps so future agents do not repeat this slice or assume public AI/UI/RAG/queue behavior exists.
- [x] 3.3 Update `README.md` and `apps/web/README.md` with the new verifier and local-only status.

## 4. Verification And Archive

- [x] 4.1 Run focused checks: `pnpm ai-review:execution-check`, `pnpm ai-review:generation-check`, `pnpm ai-review:check`, and `pnpm ai-provider:check`.
- [x] 4.2 Run broad checks: `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
- [x] 4.3 Run OpenSpec validation: `openspec validate implement-ai-review-execution-service` and `openspec validate --all`.
- [x] 4.4 Archive the completed change after verification passes.
