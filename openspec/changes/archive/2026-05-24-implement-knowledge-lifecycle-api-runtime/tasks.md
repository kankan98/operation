## 1. Verification First

- [x] 1.1 Add `knowledge:route-check` scripts at root and web package levels.
- [x] 1.2 Add a rollback-based `apps/web/src/server/knowledge/route-check.ts` verifier covering missing cookie, missing scope, CSRF blocking, authorized source create/list/detail, claim creation, team note creation, review queue, review decisions, duplicate source, validation failure, long-input handling, missing permission, conflict blocking/resolution, version publication, cross-team isolation, no-store, redaction, and rollback.
- [x] 1.3 Run `DATABASE_URL=... pnpm knowledge:route-check` and confirm it fails for missing knowledge route runtime, not from verifier setup mistakes.

## 2. Route Runtime

- [x] 2.1 Implement server-only knowledge lifecycle route helpers with scope parsing, path ID handling, request ID handling, CSRF checks, auth resolution, data access context conversion, JSON parsing, safe error/status mapping, and no-store responses.
- [x] 2.2 Implement `apps/web/src/app/api/knowledge/sources/route.ts` for `GET` source list and `POST` source registration, short-circuiting no-cookie and CSRF-blocked paths before database connection.
- [x] 2.3 Implement `apps/web/src/app/api/knowledge/sources/[sourceId]/route.ts` for `GET` source detail with scoped auth and safe no-store JSON.
- [x] 2.4 Implement `apps/web/src/app/api/knowledge/claims/route.ts` and `apps/web/src/app/api/knowledge/team-notes/route.ts` for scoped knowledge content creation.
- [x] 2.5 Implement `apps/web/src/app/api/knowledge/review-queue/route.ts` and `apps/web/src/app/api/knowledge/review-decisions/route.ts` for review queue reads and review decisions.
- [x] 2.6 Implement `apps/web/src/app/api/knowledge/conflicts/route.ts`, `apps/web/src/app/api/knowledge/conflicts/[conflictId]/route.ts`, and `apps/web/src/app/api/knowledge/versions/route.ts` for conflict recording, conflict resolution, and version publication.

## 3. Documentation And Verification

- [x] 3.1 Update the knowledge lifecycle contract, contract index, app README, root README, roadmap, and continuous-development goal to reflect the new local-only protected API runtime status.
- [x] 3.2 Run `DATABASE_URL=... pnpm knowledge:route-check` and confirm it passes.
- [x] 3.3 Run related checks: `DATABASE_URL=... pnpm knowledge:check`, `DATABASE_URL=... pnpm auth:route-check`, `DATABASE_URL=... pnpm sessions:route-check`, and `DATABASE_URL=... pnpm rackets:route-check`.
- [x] 3.4 Run project checks: `openspec validate implement-knowledge-lifecycle-api-runtime`, `openspec validate --all`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `git diff --check`.

## 4. Archive, Sync, And Preview

- [x] 4.1 Archive the OpenSpec change after verification and ensure the accepted spec has a real purpose.
- [ ] 4.2 Commit with a professional Conventional Commit prefix in the form `feat(knowledge): ...`.
- [ ] 4.3 Push the branch to git remote.
- [ ] 4.4 Rebuild and restart Docker preview with `--restart unless-stopped`.
- [ ] 4.5 Curl public preview routes and knowledge API no-cookie/CSRF-denied paths to confirm preview health.
