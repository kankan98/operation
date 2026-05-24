## 1. Verification First

- [x] 1.1 Add `rackets:route-check` scripts at root and web package levels.
- [x] 1.2 Add a failing rollback-based `apps/web/src/server/rackets/route-check.ts` verifier covering missing cookie, missing scope, CSRF blocking, authorized create/list, duplicate model, validation failure, missing permission, cross-team isolation, no-store, redaction, and rollback.
- [x] 1.3 Run `DATABASE_URL=... pnpm rackets:route-check` and confirm it fails for the missing route runtime, not from verifier setup mistakes.

## 2. Route Runtime

- [x] 2.1 Implement server-only racket product route helpers with scope parsing, request ID handling, CSRF check, auth resolution, data access context conversion, JSON parsing, safe error/status mapping, redaction, and no-store responses.
- [x] 2.2 Implement `apps/web/src/app/api/rackets/products/route.ts` for `GET` and `POST`, short-circuiting no-cookie and CSRF-blocked paths before database connection.
- [x] 2.3 Export route helper constants/types only where needed without widening repository or auth boundaries.

## 3. Local Verification

- [x] 3.1 Run `DATABASE_URL=... pnpm rackets:route-check` and confirm it passes.
- [x] 3.2 Run related local checks: `pnpm rackets:check`, `pnpm rackets:source-review-check`, and `pnpm auth:route-check`.
- [x] 3.3 Run project checks: `openspec validate implement-racket-product-api-runtime`, `openspec validate --all`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `git diff --check`.

## 4. Archive, Sync, And Preview

- [x] 4.1 Archive the OpenSpec change after verification and ensure the accepted spec has a real purpose.
- [ ] 4.2 Commit with a professional Conventional Commit prefix in the form `feat(rackets): ...`.
- [ ] 4.3 Push the branch to git remote.
- [ ] 4.4 Rebuild and restart Docker preview with `--restart unless-stopped`.
- [ ] 4.5 Curl public preview routes and the no-cookie product API path to confirm preview health.
