## Why

Product owners and reviewers need a way to prove which racket facts are source-backed before the product library can safely feed session preparation, talk tracks, AI review, or Q&A grounding. The existing local-only product and alias repository can create records, but it cannot yet register sources, record human review decisions, or publish a product only after review evidence exists.

This should happen now because it is the smallest next slice after product persistence: it reduces the risk of unreviewed specs becoming "truth" while keeping public UI, API, AI, RAG, and production data decisions out of scope.

## Source Notes

- W3C PROV-O was checked as a standards-body source for provenance modeling. It supports treating source records, derived product facts, review actors, and publication evidence as related but distinct records, which validates a normalized source/review design instead of a single unstructured `sourceIds` array.
- PostgreSQL official constraint documentation was checked as the primary database source. It supports enforcing foreign keys, unique constraints, and check-like integrity rules at the database boundary, which supports scoped source/review tables with tenant/team ownership.
- Drizzle ORM official PostgreSQL schema/index/migration documentation was checked as the project ORM source. It supports representing the additional tables and indexes in schema code and generated migrations without adding a new dependency.
- Yonex official racket product pages were checked as a primary domain example. They publish structured racket specifications such as flex, frame/shaft material, weight/grip, stringing advice, and color, confirming that source metadata and freshness matter for the exact fields operators will reuse.

## Skill-backed Value Exploration

- Skills used: `openspec-explore` for scope and trade-off exploration, `roadmap-planning` for sequencing against Now/Next/Later, `test-driven-development` for implementation order, and `verification-before-completion` for completion evidence.
- Target operator role: product owner and reviewer first; live operator, host, AI review, and Q&A benefit downstream once only published records are reusable.
- Improved workflow: maintain racket model specs, add source evidence, review the record, and publish only when facts are safe to reuse.
- Reduced friction/risk: operators stop relying on ambiguous source IDs or unreviewed draft products; future AI/RAG cannot accidentally ground on reviewing, conflict, or stale records.
- User result: the team gets a product record that is visibly source-backed, reviewed, and eligible for downstream workflows.
- Alignment check: this stays inside badminton live-commerce operations and does not drift into generic CMS, scraping, or AI automation.
- Restrained product highlight: downstream readiness should explain why a product cannot be used yet, giving reviewers a clear next action without adding decorative UI.

## What Changes

- Add a new local-only server capability for racket product sources, review decisions, and publish gating.
- Extend the Drizzle/PostgreSQL schema with normalized source and review decision tables that keep tenant/team scope, actor audit fields, review state, trust level, and refresh policy.
- Extend the server-only racket product repository with methods to register a source, submit or move products through review states, record review decisions, publish source-backed products, and list a scoped review queue.
- Keep `racket_products.sourceIds` as a compatibility/readiness summary while normalized source rows become the authoritative local source boundary for this slice.
- Add repeatable rollback verification that proves source registration, approval, publish gating, invalid state transitions, permission checks, cross-team isolation, and no public UI dependency.
- Update the product library contract, roadmap, and accepted specs to distinguish implemented local-only source/review/publish behavior from future API, UI, AI/RAG, source discovery, and production behavior.

## Capabilities

### New Capabilities
- `racket-source-review-publish`: local-only server-side source registration, review decision, product review queue, and publish gating for the racket product library.

### Modified Capabilities
- `racket-product-library-contract`: update contract status and requirements so the contract accurately reflects product, alias, source, review, and publish local runtime boundaries after this slice.

## Impact

- Affected code: `apps/web/src/server/db/schema.ts`, Drizzle migrations under `apps/web/src/server/db/migrations/`, `apps/web/src/server/rackets/repository.ts`, local racket verification scripts, and package scripts if a separate check command is added.
- Affected docs/specs: `docs/contracts/racket-product-library.md`, `docs/roadmap/ai-continuous-development-goal.md`, `docs/roadmap/autonomous-development-roadmap.md`, `docs/architecture/technical-implementation-roadmap.md`, and OpenSpec specs for this change.
- No new npm dependencies, no public Route Handler or Server Action, no frontend changes, no AI provider, no RAG/vector table, no web discovery provider, and no production database/provider decision.
- Verification impact: run OpenSpec validation, Drizzle migration generation/migration, local rollback checks, lint, typecheck, build, and all-spec validation. Playwright and Docker redeploy are skipped unless a later implementation unexpectedly changes frontend/public preview behavior.
