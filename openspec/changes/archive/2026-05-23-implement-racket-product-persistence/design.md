## Context

The project already has a local-only PostgreSQL/Drizzle data foundation and a provider-neutral authorization guard. The racket product library contract exists, but runtime persistence is still absent: static UI data cannot prove tenant/team isolation, duplicate model prevention, alias conflict handling, or readiness for downstream AI/RAG workflows.

This change is stage 4 workflow persistence, but only as a server-only local runtime slice. It does not expose public CRUD, production data, or a provider-backed login flow. The existing auth guard foundation remains the authorization source for converting a request into `DataAccessContext`; the racket repository requires explicit permissions on that context.

## Goals / Non-Goals

**Goals:**

- Add Drizzle schema and migration artifacts for racket product and alias records.
- Preserve badminton-specific fields: brand, series, model, normalized model, status, weight classes, balance, shaft stiffness, recommended tension, player levels, play styles, price band, selling focus, and limitations.
- Enforce tenant/team ownership, creator/updater audit fields, scoped uniqueness for normalized model names, and scoped uniqueness for normalized aliases.
- Add server-only repository methods for creating and listing racket products with Zod validation, explicit permission checks, safe errors, and downstream readiness calculation.
- Add a rollback-style local verification script covering create, list, duplicate model, alias conflict, missing permission, cross-team isolation, and transaction rollback.

**Non-Goals:**

- No public UI, Route Handler, Server Action, import flow, source discovery, AI/RAG snapshot, provider-backed login, team management, production database, or Docker preview redeploy.
- No new npm dependency. Existing PostgreSQL, Drizzle, Zod, and server-only patterns are enough.
- No product-source, review-decision, team-note, or AI-candidate tables in this wave. Those remain contract-defined follow-up slices.

## Decisions

### Use explicit workflow tables instead of generic content

Create `racket_products` and `racket_product_aliases` tables with racket-specific enums and fields. This matches the domain contract and avoids a generic content table that would later need brittle interpretation by session capture, AI review, Q&A, and talk-track workflows.

Alternatives considered:

- Generic `items` or `content_records`: rejected because it erases domain constraints and conflicts with the project guardrail against flattening racket models into generic records.
- JSON-only product table: rejected because duplicate model and alias conflict rules need database-level scoped uniqueness.

### Keep the first runtime slice local-only and repository-scoped

The repository lives under `apps/web/src/server/rackets/` and accepts a `DataAccessContext`. It is not imported by UI code and does not create an HTTP/API surface. This lets us verify persistence and scope behavior before committing to a public mutation contract.

Alternatives considered:

- Start with UI save actions: rejected because the login/provider runtime is not complete and public protected CRUD would imply product behavior that cannot yet be safely exposed.
- Wait for provider-backed auth: rejected for this wave because the existing local guard is enough to validate repository and schema behavior without external account blockers.

### Use Zod at the repository boundary

Create and list inputs are parsed with Zod before database calls. Strings are trimmed and bounded; arrays are bounded; enums match contract states. The repository computes `normalizedModel` and `normalizedAlias` rather than trusting caller-provided normalized fields.

Alternatives considered:

- Trust TypeScript types only: rejected because future Route Handlers and Server Actions will need runtime validation.
- Let database constraints handle every invalid input: rejected because operators need recoverable, field-oriented errors later and logs must remain redacted.

### Use permission checks in repository methods

`createRacketProduct` requires `manage_products`. `listRacketProducts` accepts either `read_workspace` or `manage_products`. These checks complement the auth guard and prevent scripts or future thin wrappers from accidentally bypassing role intent.

Alternatives considered:

- Only rely on caller-side auth guard: rejected because repository methods should be hard to misuse for protected data.
- Implement full authorization decisions table now: rejected as larger than the slice; current audit primitives and checks are enough.

### Compute downstream readiness, do not store it yet

The repository returns readiness from product status: `published` is ready for session capture, AI review, talk tracks, and Q&A; `approved` can feed human/AI candidate workflows but not Q&A; `needs_source`, `reviewing`, `conflict`, `stale`, `archived`, and `rejected` return explicit blockers. This gives immediate downstream signal without a premature readiness table.

Alternatives considered:

- Store readiness rows immediately: rejected because readiness will depend on future source, review, knowledge, and AI snapshot tables.
- Omit readiness entirely: rejected because it is a useful product highlight and key to preventing unsafe AI grounding later.

## Risks / Trade-offs

- Schema is narrower than the full product contract -> Mitigation: only mark product and alias runtime as implemented; leave sources, reviews, notes, AI candidates, and publishing flows out of scope.
- Local-only repository can be mistaken for production CRUD -> Mitigation: no UI/API surface, docs explicitly state local-only, and scripts require `DATABASE_URL`.
- Scoped uniqueness can block legitimate archived duplicate re-entry -> Mitigation: keep behavior conservative for now; future archive/recreate policy can modify indexes with a migration when product lifecycle UI exists.
- Alias normalization may be too simple for every Chinese/English typo case -> Mitigation: first normalize trim/lowercase/spacing for deterministic conflict checks; richer alias matching stays in future review/import work.
- PostgreSQL migration affects local DB state -> Mitigation: migration is generated, checked in, applied locally, and verification runs inside rollback transactions for test data.

## Migration Plan

1. Add schema enums and tables in `apps/web/src/server/db/schema.ts`.
2. Generate a Drizzle migration and apply it to the local PostgreSQL service.
3. Add server-only racket repository and rollback verification script.
4. Update root and app package scripts with `rackets:check`.
5. Update contract and roadmap docs to reflect partial local-only runtime status.

Rollback path:

- Before production deployment exists, rollback is local: remove the migration/schema/repository/script changes or run a follow-up migration that drops the racket product tables.
- Because no public UI/API uses these tables yet, application runtime can continue rendering static pages even if `DATABASE_URL` is absent.
