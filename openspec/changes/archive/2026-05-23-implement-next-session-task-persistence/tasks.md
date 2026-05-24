## 1. Proposal Gate And Red Test

- [x] 1.1 Validate the OpenSpec proposal, design, and spec before implementation.
- [x] 1.2 Add the `next-actions:check` verifier and package scripts first, then run it and observe the expected RED failure because the repository/schema do not exist yet.

## 2. Schema And Migration

- [x] 2.1 Add next-session task enums, tables, indexes, tenant/team ownership, source trail, checklist, dependency, review, feedback, and record types to `apps/web/src/server/db/schema.ts`.
- [x] 2.2 Generate and review the Drizzle migration for the new local schema.

## 3. Repository Implementation

- [x] 3.1 Add `apps/web/src/server/next-actions/repository.ts` with server-only validation, typed errors, permission checks, active owner checks, source readiness gating, sensitive-data gating, duplicate detection, and scoped read/list behavior.
- [x] 3.2 Implement task lifecycle methods for status updates, owner self-progress, checklist updates, dependency state, completion, review result recording, feedback signal recording, and readiness derivation.

## 4. Verification Coverage

- [x] 4.1 Complete the rollback-style `apps/web/src/server/next-actions/check.ts` verifier to cover create, list/detail, duplicate rejection, inactive owner rejection, missing permission rejection, owner progress, checklist/dependency blockers, review-required closure, feedback, sensitive-source blocking, cross-team isolation, and rollback.
- [x] 4.2 Run database generation, migration, existing repository checks, the new `next-actions:check`, lint, typecheck, build, `openspec validate implement-next-session-task-persistence`, and `openspec validate --all`.

## 5. Documentation And Archival

- [x] 5.1 Update the next-session task contract, app README, project README if needed, roadmap, technical roadmap, and continuous development goal to reflect local repository persistence and remaining non-goals.
- [x] 5.2 Mark tasks complete as each item finishes, archive the OpenSpec change after verification passes, and re-run `openspec validate --all`.
