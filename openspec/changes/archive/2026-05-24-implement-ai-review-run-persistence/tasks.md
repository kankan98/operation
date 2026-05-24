## 1. TDD Verifier

- [x] 1.1 Add `apps/web/src/server/ai-review/check.ts` first, importing the not-yet-existing repository and covering authorization, blocked snapshots, prompt gate, validation gate, review decisions, feedback, downstream creation, cross-team isolation, and rollback.
- [x] 1.2 Add root and web `ai-review:check` scripts.
- [x] 1.3 Run `DATABASE_URL=... pnpm ai-review:check` and record the expected RED failure before production implementation.

## 2. Data Model

- [x] 2.1 Add Drizzle enums and tables for AI review runs, input snapshots, knowledge snapshots, prompt versions, provider invocations, outputs, sections, validation results, decisions, feedback signals, and downstream artifacts.
- [x] 2.2 Generate and apply the migration with `pnpm db:generate` and `pnpm db:migrate`.
- [x] 2.3 Export AI review record types from `apps/web/src/server/db/schema.ts`.

## 3. Repository

- [x] 3.1 Implement `apps/web/src/server/ai-review/repository.ts` as server-only code with Zod input schemas and safe `AiReviewRunError` codes.
- [x] 3.2 Implement bounded snapshot preparation, prompt version creation, run start, provider metadata recording, output/section recording, validation results, and review-ready transition.
- [x] 3.3 Implement human review decisions, feedback signals, downstream artifact creation, archive, list, and detail queries with tenant/team scope and `run_ai_review` permission.
- [x] 3.4 Ensure repository methods do not store API keys, full prompts, full provider payloads, full transcripts, or customer personal data.

## 4. Documentation And Specs

- [x] 4.1 Update `docs/contracts/ai-review-run.md` and `docs/contracts/README.md` with local persistence status, DeepSeek provider gate, and remaining non-goals.
- [x] 4.2 Update root README, `apps/web/README.md`, roadmap, technical roadmap, and accepted OpenSpec specs to reflect the new persistence slice.
- [x] 4.3 Update this change's tasks as implementation evidence changes.

## 5. Verification And Archive

- [x] 5.1 Run `openspec validate implement-ai-review-run-persistence`.
- [x] 5.2 Run database and domain checks: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:check`, `pnpm auth:check`, `pnpm rackets:check`, `pnpm rackets:source-review-check`, `pnpm sessions:check`, `pnpm knowledge:check`, `pnpm next-actions:check`, `pnpm talk-tracks:check`, and `pnpm ai-review:check`.
- [x] 5.3 Run `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `openspec validate --all`.
- [x] 5.4 Archive the completed change and re-run OpenSpec validation after archive.
- [x] 5.5 Record skipped verification, public preview decision, remaining risks, and next candidate task.
