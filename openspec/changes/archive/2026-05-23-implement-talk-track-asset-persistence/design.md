## Context

The app has local-only PostgreSQL/Drizzle repositories for auth guard, data
foundation, racket products, session captures, knowledge lifecycle, and
next-session tasks. `talk-track-asset` remains a draft contract with no runtime
slice, so effective objection replies and product explanations cannot yet be
stored as reviewed, versioned, source-grounded team assets.

This change belongs to stage 4, core operations persistence. It uses already
accepted local technology: PostgreSQL, Drizzle migrations, Zod validation,
server-only repositories, `DataAccessContext`, and role permissions. It does
not introduce auth provider runtime, Route Handlers, Server Actions, AI
provider calls, RAG, external discovery, queues, storage, analytics, or
production deployment.

Reliable source notes:

- W3C PROV-O (`https://www.w3.org/TR/prov-o/`) is a standards-body provenance
  model and supports explicit asset/version/source/candidate derivation rather
  than untracked text replacement.
- NIST AI RMF (`https://www.nist.gov/itl/ai-risk-management-framework`) is a
  US standards guidance source for governed, traceable AI risk management; it
  supports keeping AI talk-track candidates review-only until a human decision.
- OWASP Top 10 for LLM Applications
  (`https://owasp.org/www-project-top-10-for-large-language-model-applications/`)
  is a security community reference for LLM application risks; it supports
  blocking sensitive data and preventing overreliance on unreviewed AI output.
- IETF BCP 47 / RFC 5646 (`https://www.rfc-editor.org/rfc/rfc5646`) is the
  official language tag standard; the first slice stores contract language tags
  as `zh_CN` and `mixed_zh_en` for compatibility with existing contract language
  while preserving a future migration path to canonical BCP 47 tags.

Skill-backed value gate:

- `openspec-explore`: scope stays local-only persistence because public CRUD,
  AI, and RAG would cross provider/session gates.
- `roadmap-planning`: this is the remaining stage 4 local repository slice
  after product, session, knowledge, and next-task repositories.
- `jobs-to-be-done`: hosts and operators need to reuse proven wording before a
  live session; product owners and reviewers need to stop unsupported product
  claims from becoming team talk tracks.
- `recommendation-canvas`: AI value is preserved as reviewed candidates, but
  the current investment should be source grounding and approval metadata, not
  model generation.
- `codebase-recon`: the repo is tiny and recently created; no bug-magnet
  overlap appeared, so the risk is schema/repository consistency rather than
  legacy hotspot complexity.

## Goals / Non-Goals

**Goals:**

- Persist talk-track assets, versions, scenario fit, ordered segments,
  objection patterns, source grounding, review decisions, AI/manual candidates,
  and usage signals in local PostgreSQL.
- Enforce tenant/team scope and server-side role/permission checks in the
  repository.
- Preserve source grounding, AI run/prompt metadata, version history, and human
  review decisions before publication.
- Block publishing when required sources are missing, stale-blocked, conflicted,
  sensitive, or when an AI candidate has not been reviewed.
- Provide a rollback verifier that proves key repository behavior without
  leaving local data behind.

**Non-Goals:**

- No browser UI, visual redesign, Playwright flow, Route Handler, Server Action,
  public API, or public save workflow.
- No AI provider, prompt execution, generated talk-track content, RAG grounding,
  web discovery, source fetching, or queue/job runtime.
- No production database provider, connection pool, backup, real login provider,
  team management UI, or deployment change.
- No new npm dependencies.

## Decisions

1. **Use a dedicated talk-track schema slice.**
   - Decision: add first-class tables and enums for assets, versions,
     scenarios, segments, objection patterns, source grounding, review
     decisions, candidates, and usage signals.
   - Rationale: talk-track assets have states and reuse rules that differ from
     knowledge notes and next-session tasks. Flattening them into generic
     content would lose scenario fit and review semantics.
   - Alternatives considered: store in `team_knowledge_notes`; rejected because
     notes do not model versioned publish state, AI candidate review, segment
     order, or usage feedback.

2. **Keep source references as typed ID arrays instead of foreign keys.**
   - Decision: source grounding stores `sourceType`, `sourceIds`,
     `knowledgeVersionIds`, `racketProductIds`, and `aiRunId` fields as
     bounded text/json arrays.
   - Rationale: accepted contracts for AI run and future product/knowledge
     version snapshots are not all implemented. Typed references preserve
     provenance without forcing cross-stage schema decisions.
   - Alternatives considered: hard foreign keys to current product/knowledge
     tables; rejected because future version tables and AI run tables are not
     present yet.

3. **Repository owns workflow guards.**
   - Decision: the server-only repository validates input, checks permissions,
     verifies tenant/team scope, enforces status transitions, blocks unsafe
     publish, and calculates readiness.
   - Rationale: future UI/API layers can stay thin, and protected data cannot
     rely on frontend hiding.
   - Alternatives considered: put guards only in future route handlers; rejected
     because the current local slice is repository-only and must already prove
     protected behavior.

4. **Use existing `manage_talk_tracks` plus stricter reviewer roles.**
   - Decision: create/edit/submit/candidate/usage operations require
     `manage_talk_tracks`; review, publish, deprecate, archive, and restore also
     require role `product_owner`, `reviewer`, or `admin`.
   - Rationale: existing policy gives hosts/product owners/reviewers/admins
     talk-track capability, but publishing should remain a review action.
   - Alternatives considered: add a new permission; rejected because the
     current role-permission model already has the domain permission and adding
     policy surface is unnecessary for this slice.

5. **Start with a verifier script instead of UI tests.**
   - Decision: add `talk-tracks:check` that seeds local auth/team data in a
     transaction, exercises repository behavior, and intentionally rolls back.
   - Rationale: no rendered UI changes exist in this wave, and existing backend
     slices use the same check pattern.
   - Alternatives considered: Playwright; rejected for this wave because there
     is no browser behavior to verify and the user asked not to run Playwright
     every round.

## Risks / Trade-offs

- **Large schema slice** -> Keep tables direct and domain-specific, avoid new
  abstractions, and verify with Drizzle migration generation plus rollback
  checks.
- **Typed source IDs are weaker than foreign keys** -> Record source type and
  state now, and keep future cross-record validation behind later product,
  knowledge, AI run, or RAG changes.
- **Contract language tags use underscore names** -> Store current contract
  values now, document BCP 47 as the future normalization path, and avoid
  creating incompatible user-visible language behavior in this wave.
- **Local-only runtime can be mistaken for public persistence** -> Update
  contract and roadmaps to state that UI/API/AI/RAG/public save remain gated.
- **Sensitive wording may be saved in verifier examples** -> Use synthetic,
  non-customer examples and block explicit `blocked` sensitive state in
  repository behavior.

## Migration Plan

1. Add RED verifier and script first, referencing the missing talk-track
   repository.
2. Add schema/enums and generate a Drizzle migration.
3. Implement the repository with typed errors, state guards, tenant/team scope,
   review/publish rules, and view mapping.
4. Expand the verifier to cover candidate creation, source grounding,
   publication blocking, approved publish, duplicate scenario, cross-team
   denial, usage feedback, and rollback.
5. Update contract, roadmaps, README, package scripts, and OpenSpec tasks.

Rollback: revert the schema/repository/scripts/docs change and remove the new
migration before applying it to any shared database. This wave uses only local
development database verification and transaction rollback.
