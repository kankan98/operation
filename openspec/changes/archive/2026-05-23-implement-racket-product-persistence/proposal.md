## Why

The current racket product library is still static, so product owners cannot yet prove that model names, aliases, specifications, review status, and tenant/team ownership can be stored safely before live-session, AI review, talk-track, and Q&A workflows depend on them. This change creates the smallest local-only persistence slice for racket products, using the existing PostgreSQL, Drizzle, and auth guard foundations.

Pre-proposal research and value exploration:

- Reliable sources checked:
  - Yonex official product specs for ASTROX 100ZZ show that real racket records need structured fields such as flex, weight/grip, stringing advice, balance, material, player type, series, and parent SKU: https://www.yonex.com/badminton/astrox-100zz-ax100zz and https://us.yonex.com/products/astrox-100zz.
  - BWF Laws of Badminton define racket equipment constraints and confirm that racket information is domain-specific, not generic content: https://corporate.bwfbadminton.com/statutes/ and the current laws PDF linked from that page.
  - Drizzle official docs confirm schema definitions are the source of truth for generated migrations, and PostgreSQL/Drizzle unique indexes are appropriate for normalized model and alias conflict prevention: https://orm.drizzle.team/docs/sql-schema-declaration and https://orm.drizzle.team/docs/indexes-constraints.
  - PostgreSQL official docs confirm multi-column unique indexes enforce scoped uniqueness: https://www.postgresql.org/docs/current/indexes-unique.html.
- Skill-backed exploration:
  - `openspec-explore` confirmed the next slice should improve a concrete operator workflow rather than starting a provider integration that needs external account decisions.
  - `roadmap-planning` confirmed this belongs to the Now/Next path: product library persistence is a prerequisite for session capture, AI review, talk tracks, and Q&A grounding.
  - `vercel:auth`, `vercel:nextjs`, and security source checks influenced scope: real login/provider runtime stays separate; this slice reuses the existing local auth guard only and does not expose public protected CRUD.
- User value:
  - Target role: product owner first, then live operators and hosts.
  - Workflow improved: maintaining consistent racket model facts, aliases, and selling-position fields before they are reused in live prep and AI/RAG.
  - Friction reduced: duplicate model names, conflicting aliases, and unscoped product records are caught at the repository boundary instead of later in UI or AI flows.
  - Result for users later: the team can build a reviewed product library that keeps official specs, team selling points, and downstream readiness separate.
  - Goal alignment: this stays inside badminton live-commerce operations and avoids generic inventory or auth-platform work.
  - Product highlight: downstream readiness can be computed from review/source state so operators know why a product is not yet safe for AI/Q&A use, without adding visual noise.

## What Changes

- Add a local-only racket product persistence capability backed by Drizzle/PostgreSQL tables and checked-in migration artifacts.
- Add server-only repository code for creating and listing tenant/team-scoped racket products with explicit validation, permission checks, duplicate-model detection, alias conflict detection, and redacted errors.
- Add a repeatable rollback-style local verification script that seeds a tenant/team/user context, creates products and aliases, verifies duplicate and conflict behavior, verifies scoped reads, and rolls back all test data.
- Update scripts and durable docs/contracts to describe the new partial runtime surface and the fact that there is still no public CRUD UI, API, Server Action, source ingestion, AI grounding, or production database.
- Do not add external providers, auth SDKs, AI SDKs, public source ingestion, Docker deployment, or frontend UI changes in this wave.

## Capabilities

### New Capabilities

- `racket-product-persistence`: Local-only stage-4 persistence boundary for racket product records, aliases, validation, tenant/team scoping, permissions, duplicate detection, and repeatable verification.

### Modified Capabilities

- `racket-product-library-contract`: Update the contract status and runtime surface to reflect the newly implemented local-only persistence slice.

## Impact

- Affected code: `apps/web/src/server/db/schema.ts`, new `apps/web/src/server/rackets/**`, package scripts, and Drizzle migration artifacts.
- Affected docs: `docs/contracts/racket-product-library.md`, roadmap/goal notes if the runtime status or next-step sequencing changes.
- Affected verification: `openspec validate implement-racket-product-persistence`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm db:migrate`, existing `pnpm db:check` / `pnpm auth:check`, and new `pnpm rackets:check` against local PostgreSQL.
- Deployment: no Docker rebuild or public preview restart in this wave; current user instruction is to deploy Docker only every 4-5 development waves unless preview repair or explicit public verification requires it.
