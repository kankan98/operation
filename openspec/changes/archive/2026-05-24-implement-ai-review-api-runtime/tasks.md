## 1. Failing Verification

- [x] 1.1 Add `ai-review:route-check` package scripts that point to a new route verifier.
- [x] 1.2 Create the initial route verifier and confirm it fails before the route runtime exists.

## 2. Protected AI Review Route Runtime

- [x] 2.1 Implement `apps/web/src/server/ai-review/route.ts` with shared auth, tenant/team scope, CSRF, no-store, JSON parsing, safe error mapping, and provider injection.
- [x] 2.2 Add handlers for prompt version creation, run list/create/detail, execute, review decisions, feedback signals, downstream artifact references, and archive.
- [x] 2.3 Add thin App Router files under `/api/ai-review/**` that short-circuit missing auth/CSRF before creating database connections or provider instances.

## 3. Route Verification Coverage

- [x] 3.1 Expand `ai-review:route-check` to seed tenants, teams, users, auth sessions, prompt metadata, and AI review fixtures inside a rollback transaction.
- [x] 3.2 Verify success flows for prompt metadata, run prepare, list/detail, fake-provider execute, human decisions, feedback, downstream reference creation, and archive.
- [x] 3.3 Verify safety flows for missing auth cookie, missing CSRF, missing scope, cross-team isolation, invalid downstream gate, provider failure, no-store responses, redaction, and rollback.

## 4. Documentation And Specs

- [x] 4.1 Update the AI review contract and contracts index with the new local-only API runtime status and remaining non-goals.
- [x] 4.2 Update README, web README, technical roadmap, autonomous roadmap, and continuous development goal with the current API/runtime boundary.
- [x] 4.3 Validate the OpenSpec change and update accepted spec status notes if needed.

## 5. Final Verification, Archive, And Deployment

- [x] 5.1 Run `pnpm ai-review:route-check`, `pnpm ai-review:execution-check`, `pnpm ai-review:generation-check`, `pnpm ai-review:check`, `pnpm ai-provider:check`, `pnpm auth:route-check`, and adjacent API route checks.
- [x] 5.2 Run `openspec validate implement-ai-review-api-runtime`, `openspec validate --all`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `git diff --check`.
- [x] 5.3 Archive the OpenSpec change after verification; skip Playwright only if no rendered UI changed and record the reason.
  - Playwright skipped: this wave only adds protected API Route Handlers, server route helpers, route verifiers, and documentation; no rendered UI, layout, copy, or browser interaction surface changed.
- [x] 5.4 Commit with a Conventional Commit message, push to `origin/main`, rebuild/restart Docker preview, and run public health checks for changed and key routes.
