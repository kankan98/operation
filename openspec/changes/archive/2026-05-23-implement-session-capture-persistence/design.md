## Context

The project is in stage 4 of the technical implementation roadmap for local-only core operations persistence. Auth guard and data foundation primitives already exist, and racket product persistence has established the pattern for server-only repositories that receive a `DataAccessContext`, check permissions, filter by tenant/team, use Drizzle/PostgreSQL migrations, and verify through rollback-style local scripts.

`docs/contracts/session-capture.md` already defines the live-session capture domain, but it still marks runtime as not implemented. The `/sessions` page remains static and must not import data-layer code in this change.

Target users are live operators, hosts/assistants, and team leads. Their job is to preserve the key facts of a live badminton-racket selling session so later review, talk-track reuse, knowledge-gap follow-up, and AI review can work from structured, recoverable input rather than scattered notes.

## Goals / Non-Goals

**Goals:**

- Add local PostgreSQL schema and Drizzle migration for live session capture records, host roles, product order, notes, customer questions, and objections.
- Add a server-only repository for create, autosave/update, submit, list/detail, and downstream readiness.
- Preserve tenant/team isolation, server-side permission checks, draft version conflict detection, duplicate session label checks, validation limits, and audit metadata.
- Keep long operator notes and question/objection text out of logs and error messages.
- Add a rollback verifier that exercises happy path and key failure cases without leaving persistent local test data.

**Non-Goals:**

- No public Route Handler, Server Action, browser save flow, or UI state change.
- No login provider, middleware, cookies, session provider, invitation, or team management UI.
- No AI provider call, prompt, AI review run, RAG snapshot, transcript upload, file parsing, queue, object storage, analytics, or external platform integration.
- No new npm dependency.
- No storage of raw transcript files or private-message/order/customer identity payloads.

## Decisions

### Use relational lifecycle columns with bounded JSONB lists

Session lifecycle, tenant/team scope, status, platform, source mode, draft version, audit fields, and review/readiness inputs will be relational columns. Bounded lists such as `talkingPoints`, `customerFit`, and related product IDs can use `jsonb` because they are small, structured arrays rather than independent workflow entities in this slice.

Alternatives considered:

- Put the whole session payload in one JSONB column: rejected because status transitions, duplicate detection, tenant/team filtering, and downstream readiness would become less explicit.
- Fully normalize every list value into separate tables now: deferred because the current workflow needs recoverable drafts and structured records, not advanced analytics.

### Use PostgreSQL `text` for long operator content and repository validation for business limits

Fields such as summary, session notes, questions, objections, answer given, and response used will use `text`. Repository Zod schemas will enforce practical limits and throw `LONG_INPUT_LIMIT_EXCEEDED` where the current product boundary requires a limit.

Alternatives considered:

- `varchar` for all content: rejected for long notes because the database type would imply a fixed business limit that belongs in validation rules.
- No validation limit: rejected because pasted notes can become too large for the current local verifier and future AI snapshot boundaries.

### Use a computed `sessionLabelKey` for duplicate title/date protection

The repository will normalize title and local UTC date into a `sessionLabelKey`, and the table will enforce uniqueness on tenant/team/label key. This covers the contract's duplicate session label requirement without depending on a database expression index.

Alternatives considered:

- Unique index on exact timestamp/title: rejected because two sessions on the same day with the same title should conflict even if the exact time differs.
- Only repository-side duplicate checks: rejected because constraints are part of the data model.

### Keep draft autosave as repository behavior with optimistic versioning

Autosave updates require the caller's `draftVersion` to match the current record. The repository increments `draftVersion`, updates `lastAutosavedAt`, and returns the new view. Stale versions return `STALE_DRAFT_VERSION`.

Alternatives considered:

- Last-write-wins autosave: rejected because operators can refresh or use multiple tabs, and silent overwrite would lose live notes.
- Full conflict merge: deferred until there is a browser save flow and real multi-device usage.

### Treat downstream readiness as derived state

The repository derives readiness for `ai_review`, `talk_tracks`, `next_actions`, and `knowledge_gap` from status, required fields, product order presence, note/question/objection structure, and sensitive-redaction state. It does not persist separate readiness rows in this slice.

Alternatives considered:

- Store readiness rows: deferred because readiness is deterministic from current session state and would add synchronization risk.
- Make all submitted sessions AI-ready: rejected because missing fields and sensitive data review must block AI input.

### Preserve existing server-only repository pattern

The session repository will live under `apps/web/src/server/sessions/`, import `"server-only"`, accept a narrowed database interface, and receive `DataAccessContext` for each operation. It will not be imported by App Router pages in this change.

Alternatives considered:

- Add Route Handlers now: deferred until auth provider/runtime and public mutation boundaries are defined.
- Put domain logic in UI library files: rejected because UI must not directly access persistence or own status transitions.

## Risks / Trade-offs

- [Risk] The local schema may need changes once public save UI and transcript import exist. → Keep this slice scoped to core session records and update the contract before public API/UI work.
- [Risk] `jsonb` arrays can hide data that later needs indexing. → Use JSONB only for bounded arrays and keep core workflow states as relational columns.
- [Risk] Long text validation limits are product decisions that may change. → Keep limits in repository schemas, not as narrow database column types.
- [Risk] Sensitive customer data may be pasted into question or note fields. → Include redaction state fields, avoid logging raw payloads, block downstream AI readiness when review is needed, and leave scanner implementation out of scope.
- [Risk] Existing worktree is dirty. → Touch only files required by this change and do not revert unrelated changes.

## Migration Plan

1. Add Drizzle enums/tables for session capture persistence.
2. Generate and apply a local migration against the development PostgreSQL service.
3. Add repository and rollback verifier.
4. Update contracts, specs, README/roadmap notes, and package scripts.
5. Verify with OpenSpec validation, migration/generate, local rollback checks, lint, typecheck, build, and all accepted specs.

Rollback is the normal Drizzle migration rollback path for local development plus reverting this change's schema/repository/docs. The verifier itself runs inside a transaction and throws an expected rollback, leaving no test rows behind.

## Open Questions

- Public save UI should wait for a separate OpenSpec that decides Route Handler versus thin Server Action wrapper.
- Transcript import still needs a later decision on object storage, queue, file parsing, chunking, redaction, and retention.
- AI review snapshot should wait for the AI review runtime OpenSpec and only request minimum necessary, redaction-safe fields.
