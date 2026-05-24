## Context

The project is in stage 4 for protected core workflow persistence. Existing
accepted runtime pieces already cover:

- Next.js App Router and Route Handler baseline.
- Provider-neutral auth guard, app-owned session ledger, auth cookie/request
  resolver, and safe auth session/logout routes.
- PostgreSQL/Drizzle repository foundation.
- Racket product create/list protected API runtime.
- Session capture create/list/detail/autosave/submit protected API runtime.
- Server-only knowledge lifecycle repository for source registration, source
  list/detail, claim creation, team note creation, review queue, review
  decisions, conflict recording/resolution, publication gates, downstream
  readiness, and rollback verification.

The missing boundary is a coherent HTTP workflow for knowledge lifecycle. This
cannot be solved well as a one-endpoint proposal: source registration without
review/publish is not operationally useful, and publishing without conflict
handling weakens the future AI/RAG trust model. This wave therefore covers the
smallest complete API-level knowledge lifecycle while still excluding UI, RAG,
web discovery, queue, and AI provider behavior.

## Goals / Non-Goals

**Goals:**

- Add local-only protected Route Handlers for source list/create/detail, claim
  creation, team note creation, review queue, review decisions, conflict
  record/resolve, and version publish.
- Reuse the existing auth cookie/session runtime to resolve `AuthContext`.
- Convert authorized scope to `DataAccessContext` and delegate business rules to
  the existing knowledge lifecycle repository.
- Return safe JSON with `Cache-Control: no-store`, explicit status mapping, and
  no raw cookie/session/provider/internal membership leakage.
- Add a rollback-based `knowledge:route-check` verifier before implementation,
  following TDD.
- Update durable docs/specs only for the implemented runtime boundary.

**Non-Goals:**

- Browser `/knowledge` save UI, Server Actions, UI state changes, or Playwright
  UI verification.
- Login provider, provider callback, middleware, team switching, member UI, or
  production auth provider.
- Public source crawling/search, refresh jobs, source discovery provider, queue,
  object storage, RAG retrieval, Q&A answer generation, AI provider calls,
  analytics, observability provider, or production database provider.
- Changing repository schema, migrations, state machines, or business rules
  beyond what route-level safe mapping requires.

## Decisions

1. **Use one workflow-level API proposal, not per-interface proposals.**
   - Decision: this change exposes the whole repository-backed knowledge
     lifecycle API workflow:
     - `GET /api/knowledge/sources`
     - `POST /api/knowledge/sources`
     - `GET /api/knowledge/sources/[sourceId]`
     - `POST /api/knowledge/claims`
     - `POST /api/knowledge/team-notes`
     - `GET /api/knowledge/review-queue`
     - `POST /api/knowledge/review-decisions`
     - `POST /api/knowledge/conflicts`
     - `PATCH /api/knowledge/conflicts/[conflictId]`
     - `POST /api/knowledge/versions`
   - Rationale: these endpoints form a single operator and reviewer workflow:
     register evidence, add candidate knowledge, review it, block conflicts, and
     publish a version. Shipping them together respects the user's feedback that
     proposal scope should be meaningful at the workflow level.
   - Alternatives considered:
     - Source create/list only: rejected because it would not let a reviewer
       approve, resolve conflicts, or publish knowledge for downstream use.
     - Full `/knowledge` browser save UI now: deferred because frontend state,
       accessibility, responsive layout, and browser verification are a distinct
       UI wave.

2. **Keep Route Handlers thin and repository-owned business rules unchanged.**
   - Decision: create `apps/web/src/server/knowledge/route.ts` as a server-only
     route helper module that handles request IDs, scope parsing, CSRF checks,
     auth resolution, JSON parsing, status/error mapping, and response shaping.
     It delegates all domain validation and lifecycle state transitions to
     `createKnowledgeLifecycleRepository`.
   - Rationale: existing product and session API runtime use this boundary. It
     preserves UI/domain/data separation and avoids duplicating knowledge
     lifecycle rules in HTTP files.
   - Alternatives considered:
     - Put logic directly in App Router files: rejected because it would duplicate
       auth/error mapping and make local rollback verification harder.
     - Add a new service layer now: rejected because the repository already owns
       the current workflow behavior and no cross-repository orchestration is
       required in this slice.

3. **Use explicit tenant/team scope checked server-side.**
   - Decision: read `tenantId` and `teamId` only from query parameters or existing
     `x-operation-tenant-id` / `x-operation-team-id` headers, then verify them
     through the auth runtime before repository access. Client body ownership,
     actor, audit, tenant, or team fields are ignored.
   - Rationale: OWASP API1/API3 concerns are directly relevant to knowledge
     records because sources, team notes, and review decisions are sensitive
     business assets. The route must not trust client-selected ownership.
   - Alternatives considered:
     - Use body ownership for mutations: rejected due mass-assignment and
       cross-team leakage risk.
     - Guess default team: rejected because existing auth/session/product/session
       routes require explicit scope.

4. **Require a workflow-specific mutation CSRF header.**
   - Decision: all knowledge mutations require
     `x-operation-csrf: knowledge-lifecycle`.
   - Rationale: these mutations use a cookie-backed app session and can affect
     future AI grounding. A custom header follows existing logout, product, and
     session mutation patterns.
   - Alternatives considered:
     - No CSRF until login provider exists: rejected because route behavior should
       not become less safe than existing protected mutations.
     - Final production CSRF/origin strategy now: deferred to provider/login UI
       OpenSpec.

5. **Preserve provenance as distinct response and persistence concepts.**
   - Decision: routes expose source, claim, team note, review decision effects,
     conflict, and published version views as distinct repository shapes rather
     than flattening everything into generic content.
   - Rationale: W3C PROV-O supports modeling provenance through entities,
     activities, agents, derivation, and attribution. The existing repository and
     contract already encode that idea; route responses should not erase it.
   - Alternatives considered:
     - Return one generic `knowledge` object: rejected because it hides whether a
       value is source-backed, team-authored, reviewed, conflicted, or published.

6. **Map errors to safe HTTP JSON and short-circuit cheap blocked paths.**
   - Decision:
     - Missing/malformed scope, missing path ID, malformed JSON, or validation:
       `400`
     - Missing auth cookie, expired/revoked session: `401`
     - Missing permission, forbidden scope, missing CSRF: `403`
     - Duplicate source or conflicting claim: `409`
     - Long input: `413`
     - Sensitive-data review or invalid lifecycle transition: `422`
     - Not found: `404`
     - Unexpected auth/persistence failure: `500`
   - Rationale: IANA status semantics align with prior product/session API
     runtime. Short-circuiting no-cookie and CSRF-blocked requests before DB
     access keeps public traffic cheap and avoids leaking DB availability.
   - Alternatives considered:
     - Return `200` for all route errors: rejected because future fetch wrappers
       and verifiers need reliable HTTP semantics.

## Risks / Trade-offs

- **Large endpoint count in one change** -> The scope is broader than previous
  API waves. Mitigation: all endpoints map to existing repository methods, no
  new schema/dependency/provider is introduced, and one rollback verifier covers
  the workflow.
- **No UI yet** -> Operators still cannot use the public `/knowledge` page to
  save records. Mitigation: this API is the prerequisite boundary; future UI wave
  can focus on browser state and Playwright checks without inventing backend
  behavior.
- **Local-only auth sessions** -> Public preview users cannot create knowledge
  records without seeded app-owned sessions. Mitigation: keep docs explicit that
  login provider and team switching remain separate auth work.
- **Knowledge responses can include sensitive team notes** -> Authorized users
  need scoped access, but errors and cross-team paths must never echo sensitive
  text. Mitigation: route verifier checks redaction and isolation; high-sensitive
  publication remains repository-blocked.
- **CSRF strategy is not final production policy** -> Custom header is enough for
  current local-only runtime pattern but must be revisited with provider-backed
  login. Mitigation: document non-goal and leave origin/token policy to future
  auth OpenSpec.

## Migration Plan

1. Add failing `knowledge:route-check` script and verifier for the complete API
   workflow before production route code.
2. Implement server-only route helper and App Router route files.
3. Run local database verification with rollback transactions.
4. Run OpenSpec validation, related repository/API checks, typecheck, lint,
   build, and `git diff --check`.
5. Archive the change only after verification.
6. Commit with Conventional Commit format, push, rebuild Docker, restart
   `operation-web-preview` with `--restart unless-stopped`, and curl key public
   and knowledge API unauthenticated/CSRF-denied routes.

Rollback path:

- Remove `/api/knowledge/**` route files, `apps/web/src/server/knowledge/route.ts`,
  `apps/web/src/server/knowledge/route-check.ts`, package scripts, and the new
  accepted spec. Existing repository, auth, product API, and session API runtime
  remain unchanged.

## Open Questions

- Browser `/knowledge` save/review UI should follow after this API boundary and
  will need UI/UX skill guidance plus Playwright before archive.
- Provider-backed login, team switching, and route-level middleware remain
  deferred to `auth-team-tenant`.
- Public source discovery and refresh jobs remain deferred to later stage 7
  because they require allowlist, provider choice, queue/retry, and terms checks.
