## 1. Verification First

- [x] 1.1 Add `talk-tracks:route-check` and `next-actions:route-check` scripts at root and web package levels.
- [x] 1.2 Add a rollback-based `apps/web/src/server/talk-tracks/route-check.ts` verifier covering missing cookie, missing scope, CSRF blocking, authorized candidate/asset/review/publish/archive/restore/usage workflows, duplicate scenario, missing permission, cross-team isolation, no-store, redaction, and rollback.
- [x] 1.3 Add a rollback-based `apps/web/src/server/next-actions/route-check.ts` verifier covering missing cookie, missing scope, CSRF blocking, authorized create/list/detail/status/checklist/dependency/complete/review/feedback workflows, duplicate task, inactive owner, missing permission, cross-team isolation, no-store, redaction, and rollback.
- [x] 1.4 Run both new route checks and confirm they fail for missing route runtime, not from verifier setup mistakes.

## 2. Talk-Track Route Runtime

- [x] 2.1 Implement server-only talk-track route helpers with scope parsing, path ID handling, request ID handling, CSRF checks, auth resolution, data access context conversion, JSON parsing, safe error/status mapping, and no-store responses.
- [x] 2.2 Implement App Router files for `GET`/`POST /api/talk-tracks/assets` and `GET /api/talk-tracks/assets/[assetId]`, short-circuiting no-cookie and CSRF-blocked paths before database connection.
- [x] 2.3 Implement App Router files for talk-track candidate creation, candidate review, review decision, submit, publish, archive, restore, and usage signal routes.
- [x] 2.4 Run `DATABASE_URL=... pnpm talk-tracks:route-check` and confirm it passes.

## 3. Next-Action Route Runtime

- [x] 3.1 Implement server-only next-action route helpers with scope parsing, path ID handling, request ID handling, CSRF checks, auth resolution, data access context conversion, JSON parsing, safe error/status mapping, and no-store responses.
- [x] 3.2 Implement App Router files for `GET`/`POST /api/next-actions/tasks` and `GET /api/next-actions/tasks/[taskId]`, short-circuiting no-cookie and CSRF-blocked paths before database connection.
- [x] 3.3 Implement App Router files for task status, checklist item, dependency create/update, complete, review result, and feedback signal routes.
- [x] 3.4 Run `DATABASE_URL=... pnpm next-actions:route-check` and confirm it passes.

## 4. Documentation And Verification

- [x] 4.1 Update the talk-track and next-session task contracts, contract index, app README, root README, roadmap, and continuous-development goal to reflect the new local-only protected API runtime status.
- [x] 4.2 Run related checks: `DATABASE_URL=... pnpm talk-tracks:check`, `DATABASE_URL=... pnpm next-actions:check`, `DATABASE_URL=... pnpm auth:route-check`, `DATABASE_URL=... pnpm knowledge:route-check`, `DATABASE_URL=... pnpm sessions:route-check`, and `DATABASE_URL=... pnpm rackets:route-check`.
- [x] 4.3 Run project checks: `openspec validate implement-operator-execution-assets-api-runtime`, `openspec validate --all`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `git diff --check`.

## 5. Archive, Sync, And Preview

- [x] 5.1 Archive the OpenSpec change after verification and ensure the accepted specs have real purposes.
- [ ] 5.2 Commit with a professional Conventional Commit prefix in the form `feat(execution-assets): ...`.
- [ ] 5.3 Push the branch to git remote.
- [ ] 5.4 Rebuild and restart Docker preview with `--restart unless-stopped`.
- [ ] 5.5 Curl public preview routes and execution-asset API no-cookie/CSRF-denied paths to confirm preview health.
