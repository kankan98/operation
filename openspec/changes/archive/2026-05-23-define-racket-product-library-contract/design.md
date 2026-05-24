## Context

The product library workbench at `/rackets` currently renders static example
records for racket models, aliases, specifications, selling focus, source
freshness, review state, and downstream readiness. Future work will need
persistence, API boundaries, source review, and AI/RAG grounding, but the project
rules forbid adding backend, database, AI provider, or integration behavior
before a contract defines the boundary.

This change creates that contract for the racket product library only. It is a
documentation and governance slice that prepares later implementation changes.

## Goals / Non-Goals

**Goals:**

- Define `docs/contracts/racket-product-library.md`.
- Preserve badminton-specific terminology and avoid generic item/content models.
- Specify future commands, queries, request/response shapes, lifecycle states,
  error cases, authorization, sensitive data handling, audit metadata, and
  verification requirements.
- Update the contract index and roadmap notes so later product-library
  persistence must start from this contract.

**Non-Goals:**

- No route handler, server action, repository, database schema, migration, or
  mock API implementation.
- No UI changes to `/rackets`.
- No source scraping, external platform import, AI grounding, embedding, or RAG
  runtime.
- No dependency additions.

## Decisions

1. **Contract document first, runtime later.**
   - Decision: Add a Markdown contract under `docs/contracts/` instead of code.
   - Rationale: The project is still static and contract-first. A document can
     freeze the intended boundary without implying implemented behavior.
   - Alternative considered: add TypeScript interfaces now. Rejected because
     they would look executable before backend and validation choices exist.

2. **Separate facts, team notes, selling points, and review decisions.**
   - Decision: The contract models official/spec facts, team-authored notes,
     selling-point claims, aliases, review decisions, and downstream readiness
     as related but distinct concepts.
   - Rationale: Future AI answers must distinguish verified source facts from
     operational experience and AI suggestions.
   - Alternative considered: one flat `Product` record with all copy fields.
     Rejected because it would blur authority and review state.

3. **Make lifecycle states explicit.**
   - Decision: Use states such as `draft`, `needs_source`, `reviewing`,
     `approved`, `published`, `stale`, `conflict`, `archived`, and `rejected`.
   - Rationale: Product facts change and sources can conflict. The UI and AI
     must know whether a record can ground answers.
   - Alternative considered: simple boolean `published`. Rejected because it
     cannot represent stale or conflicting records.

4. **Future authorization is tenant/team scoped.**
   - Decision: The contract includes tenant/team/role boundaries even before
     auth exists.
   - Rationale: Product knowledge, pricing bands, and team notes are business
     sensitive and must not leak across teams once auth is added.
   - Alternative considered: defer authorization until auth implementation.
     Rejected because schema and API shape would then need retrofit.

## Risks / Trade-offs

- Contract is too detailed before implementation -> Mitigation: mark status as
  `draft` and keep open questions for implementation decisions.
- Contract becomes stale -> Mitigation: later implementation changes must update
  the contract and accepted spec in the same OpenSpec change.
- Future database schema diverges from contract -> Mitigation: require schema,
  API, and UI verification against this contract before persistence work ships.
- AI grounding uses unreviewed records -> Mitigation: contract explicitly limits
  AI/RAG readiness to approved/published reviewed snapshots.
