## Context

The project is in stage 4 of the technical implementation roadmap. Local-only auth guard, data foundation, racket product persistence and session capture persistence are already implemented through server-only repositories and rollback verifiers. `docs/contracts/knowledge-lifecycle.md` defines the domain boundary but still says runtime is not implemented.

The knowledge workflow is a prerequisite for trustworthy AI review and Q&A. Product owners, reviewers and operators need a way to register sources, separate public facts from team experience, review candidates, publish versioned knowledge and block stale/conflicting/unreviewed material from downstream use.

## Goals / Non-Goals

**Goals:**

- Add local PostgreSQL schema and Drizzle migration for knowledge sources, extracted claims, team notes, review decisions, published versions and conflicts.
- Add a server-only repository for registering sources, adding claims and team notes, submitting/reviewing targets, publishing versions, listing review queue items and deriving downstream readiness.
- Preserve tenant/team isolation, `review_knowledge` permission checks, duplicate source detection, source/claim state transitions, stale/conflict blockers, sensitive-level fields and audit metadata.
- Keep source text, team notes, feedback reasons and future prompt/RAG context out of raw logs and error messages.
- Add a rollback verifier covering the primary workflow and key failure cases.

**Non-Goals:**

- No public Route Handler, Server Action, browser save flow or `/knowledge` UI change.
- No web discovery provider, crawler, webpage fetch, robots/terms checker, source allowlist engine or scheduled refresh job.
- No AI provider call, prompt, extraction model, RAG/pgvector index, full-text search ranking, queue, object storage, analytics or production database provider.
- No new npm dependency.
- No claim that registered or approved local records are already available to Q&A or AI review; only published local versions can be readiness-ready.

## Decisions

### Model knowledge lifecycle as separate auditable entities

Use separate tables for `knowledge_sources`, `extracted_knowledge_claims`, `team_knowledge_notes`, `knowledge_review_decisions`, `published_knowledge_versions` and `knowledge_conflicts`. This preserves authority boundaries between source metadata, extracted facts, team-authored experience, review decisions and published versions.

Alternatives considered:

- Single `knowledge_items` table with a type column: rejected because source provenance, team notes, review decisions and published versions have different lifecycle and audit semantics.
- JSON-only source payloads: rejected because review state, trust level, stale/conflict blockers and downstream readiness need explicit queryable fields.

### Keep local persistence manual-only in this slice

Repository commands will register source metadata and manually supplied claims/team notes. They will not fetch URLs, parse pages, extract content with AI or create refresh jobs. `web_discovery` remains a source type only for future review-only findings.

Alternatives considered:

- Implement fetch/import now: rejected because stage 7 source discovery requires allowlist, platform terms, failure handling and review-only finding rules.
- Implement AI extraction now: rejected because stage 5/6 provider, prompt, schema validation and evaluation are not in scope.

### Use source keys and constraints for duplicate protection

The repository will normalize a stable source key from source type plus URL or title/owner, and the database will enforce uniqueness per tenant/team. This prevents repeated registration of the same source without relying only on application checks.

Alternatives considered:

- Exact URL-only uniqueness: rejected because team notes and some future manual sources may not have URLs.
- Repository-only duplicate checks: rejected because uniqueness is part of the data model.

### Use review decisions as audit trail and update target state explicitly

Review commands write a `knowledge_review_decisions` row and update the target source, claim or team note state. Publishing a knowledge version requires approved claims or approved team notes and no open conflict for the knowledge key.

Alternatives considered:

- Store only target review state: rejected because reviewers need reason, reviewer and requestId audit history.
- Allow publish directly from registered source: rejected because source registration is metadata, not reviewed knowledge content.

### Derive downstream readiness from published version state

Readiness for `ai_review`, `talk_tracks`, `qa_agent` and `source_refresh` is derived from published version status, source freshness and open conflicts. Repository views expose blocker codes; readiness is not persisted separately in this slice.

Alternatives considered:

- Persist readiness rows: deferred because readiness is deterministic from current version/source/conflict state.
- Treat approved claims as AI-ready: rejected because Q&A/RAG must ground only on published, versioned knowledge.

### Preserve existing server-only repository pattern

The repository will live under `apps/web/src/server/knowledge/`, import `"server-only"`, accept a narrowed database interface and receive `DataAccessContext` for each operation. App Router pages remain static.

Alternatives considered:

- Add Route Handlers now: deferred until auth provider/runtime and public mutation boundaries are defined.
- Import repository into UI: rejected because UI must not own persistence or AI/RAG boundaries.

## Risks / Trade-offs

- [Risk] The schema may need expansion for real web discovery, extraction chunks or RAG snapshots. → Keep this slice scoped to lifecycle metadata and manually supplied claims; update the contract before discovery/RAG work.
- [Risk] Team notes can contain sensitive strategy or customer data. → Include sensitive level, block high-sensitive publication, and avoid logging raw content.
- [Risk] Source trust level may be overinterpreted as truth. → Require explicit review and published version before downstream readiness.
- [Risk] Conflict detection is minimal in this slice. → Provide manual conflict records and publication blockers; automated conflict detection can come later.
- [Risk] Existing worktree is dirty. → Touch only files required by this change and do not revert unrelated changes.

## Migration Plan

1. Add Drizzle enums/tables, indexes, uniqueness constraints and record types.
2. Generate and apply a local migration against the development PostgreSQL service.
3. Add server-only knowledge repository and rollback verifier.
4. Update contracts, README/app docs, roadmap and accepted specs.
5. Verify OpenSpec, migration state, local rollback checks, existing regressions, lint, typecheck, build and all specs.

Rollback is the normal local Drizzle migration rollback path plus reverting this change. The verifier itself runs in a transaction and throws an expected rollback so no test rows remain.

## Open Questions

- Public `/knowledge` save UI should wait for a separate OpenSpec that decides Route Handler versus thin Server Action.
- Web discovery needs future allowlist, terms/robots checks, fetch failure policy and review-only finding storage.
- RAG snapshots need a later `RetrievalPort` decision and should only include published, non-stale, non-conflicted knowledge.
