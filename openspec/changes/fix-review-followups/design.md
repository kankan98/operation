## Context

The project currently has independent backend and frontend pnpm projects plus OpenSpec planning artifacts. Runtime backend migrations use `backend/drizzle`, while several legacy tests still read `backend/migrations`. A fresh SQLite database fails when running the configured Drizzle migrator because newer Drizzle metadata includes tables that were historically created only by legacy SQL files.

The review also found correctness issues in OpenAI-compatible streaming, silent internal product truncation, local quality-gate drift, config precedence, secret-adjacent logging, and one API status-code mismatch.

## Goals / Non-Goals

**Goals:**
- Make `pnpm -C backend db:migrate` succeed on a fresh database and create every table used by runtime schema.
- Preserve existing databases by using idempotent `CREATE TABLE IF NOT EXISTS` and safe column-add behavior where practical.
- Keep OpenAI-compatible tool streaming deterministic by accumulating argument chunks before parsing.
- Ensure reasoning-only provider fields are not displayed as assistant answers.
- Process large product sets in deterministic batches instead of relying on a fixed 1000-item fetch.
- Restore local quality gates for backend staged changes.

**Non-Goals:**
- Replace SQLite or Drizzle.
- Add authentication to all APIs.
- Fully refactor large frontend pages.
- Convert the repository into a single pnpm workspace unless needed for the quality-gate fix.

## Decisions

1. **Repair the current unarchived Drizzle migration rather than appending only a new one.**
   `0006_lively_magneto.sql` is not yet archived/committed in this working set and already fails before any later migration could run. Updating it to include the missing historical runtime tables before the decision/action `ALTER TABLE` statements makes fresh installs work without introducing an impossible `0007` dependency.

2. **Add a fresh migration bootstrap test that calls the configured Drizzle migrator.**
   Service-level tests using legacy SQL cannot prove the production migration path works. A focused test with a temporary SQLite file catches this class of failure directly.

3. **Batch product processing through existing service boundaries first.**
   Opportunity scoring and bulk acquisition can iterate pages from `ProductService.listProducts` without introducing new repository abstractions. This keeps changes smaller while removing silent truncation. `ProductService.listProducts` will also use aggregate `count(*)` and a stable order.

4. **Treat reasoning content as non-display metadata.**
   OpenAI-compatible providers may include `reasoning_content`; displaying it as answer text is unsafe and inconsistent with final-answer semantics. The provider will ignore it for user-visible output.

5. **Fix local gates with explicit package commands instead of forcing a monorepo conversion.**
   The repo documents backend/frontend as independent pnpm projects. Husky can run lint-staged in each package explicitly, avoiding broken root `--filter` commands.

## Risks / Trade-offs

- [Risk] Editing an existing migration can be unsafe after release. → Mitigation: this migration is currently untracked in the active working set; add tests and avoid changing already-applied migration rows in committed history.
- [Risk] Large opportunity lists still perform in-memory scoring. → Mitigation: batch fetching removes correctness truncation now; deeper DB-side scoring is a later performance project.
- [Risk] Provider streaming test doubles can diverge from SDK shape. → Mitigation: test the local accumulation behavior with realistic chunk shapes used by OpenAI chat completions.
- [Risk] Running lint-staged in both packages can be slower. → Mitigation: lint-staged only checks staged files and keeps backend coverage from silently disappearing.

## Migration Plan

1. Update runtime Drizzle migration SQL and metadata as needed.
2. Add a fresh temporary-database migration test.
3. Run backend migration test, backend build/lint/test, frontend build/lint/test, OpenSpec validation, and whitespace checks.
4. Existing databases that already have older legacy-created tables should continue through idempotent table creation and column additions.

## Open Questions

None for this repair set.
