## 1. Verification First

- [x] 1.1 Add `sessions:route-check` scripts at root and web package levels.
- [x] 1.2 Add a rollback-based `apps/web/src/server/sessions/route-check.ts` verifier covering missing cookie, missing scope, CSRF blocking, authorized create/list/detail/autosave/submit, stale draft rejection, duplicate label, validation failure, long-input handling, missing permission, cross-team isolation, no-store, redaction, and rollback.
- [x] 1.3 Run `DATABASE_URL=... pnpm sessions:route-check` and confirm it fails for missing session route runtime, not from verifier setup mistakes.

## 2. Route Runtime

- [x] 2.1 Implement server-only session capture route helpers with scope parsing, path session ID handling, request ID handling, CSRF checks, auth resolution, data access context conversion, JSON parsing, safe error/status mapping, redaction, and no-store responses.
- [x] 2.2 Implement `apps/web/src/app/api/sessions/captures/route.ts` for `GET` list and `POST` create, short-circuiting no-cookie and CSRF-blocked paths before database connection.
- [x] 2.3 Implement `apps/web/src/app/api/sessions/captures/[sessionId]/route.ts` for `GET` detail with scoped auth and safe no-store JSON.
- [x] 2.4 Implement `apps/web/src/app/api/sessions/captures/[sessionId]/draft/route.ts` for `PATCH` autosave with mutation CSRF, path session ID ownership, and optimistic draft version handling.
- [x] 2.5 Implement `apps/web/src/app/api/sessions/captures/[sessionId]/submit/route.ts` for `POST` submit with mutation CSRF, path session ID ownership, state/readiness error mapping, and safe responses.

## 3. Local Verification

- [x] 3.1 Run `DATABASE_URL=... pnpm sessions:route-check` and confirm it passes.
- [x] 3.2 Run related local checks: `pnpm sessions:check`, `pnpm auth:route-check`, and `pnpm rackets:route-check`.
- [x] 3.3 Run project checks: `openspec validate implement-session-capture-api-runtime`, `openspec validate --all`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `git diff --check`.

## 4. Archive, Sync, And Preview

- [x] 4.1 Archive the OpenSpec change after verification and ensure the accepted spec has a real purpose.
- [ ] 4.2 Commit with a professional Conventional Commit prefix in the form `feat(sessions): ...`.
- [ ] 4.3 Push the branch to git remote.
- [ ] 4.4 Rebuild and restart Docker preview with `--restart unless-stopped`.
- [ ] 4.5 Curl public preview routes and session API no-cookie/CSRF-denied paths to confirm preview health.
