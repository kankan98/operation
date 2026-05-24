## Context

The project is in stage 4 for protected core workflow persistence. Existing
accepted runtime pieces already cover:

- Next.js App Router and Route Handler baseline.
- Provider-neutral auth guard, app-owned session ledger, auth cookie/request
  resolver, and safe auth session/logout routes.
- PostgreSQL/Drizzle repository foundation.
- Racket product create/list protected API runtime.
- Session capture create/list/detail/autosave/submit protected API runtime.
- Knowledge lifecycle source/claim/note/review/conflict/publish protected API
  runtime.
- Server-only talk-track asset and next-session task repositories with local
  rollback verification.

The missing boundary is a coherent HTTP workflow for the execution assets that
operators use after a live session: reusable talk tracks and next-session tasks.
This cannot be solved well as one endpoint at a time. A candidate endpoint
without review/publish does not help hosts reuse a safe script, and a task
create endpoint without status/checklist/review/feedback does not close the
next-session preparation loop. This wave therefore covers the smallest complete
API-level operator execution workflow while still excluding UI, Server Actions,
AI calls, RAG, notifications, and provider-backed login.

## Goals / Non-Goals

**Goals:**

- Add local-only protected Route Handlers for talk-track candidates, assets,
  detail/list, submit, candidate review, review decision, publish,
  archive/restore, and usage signals.
- Add local-only protected Route Handlers for next-session task create/list,
  detail, status transitions, checklist updates, dependency tracking, complete,
  review result, and feedback signals.
- Reuse the existing auth cookie/session runtime to resolve `AuthContext`.
- Convert authorized scope to `DataAccessContext` and delegate business rules to
  existing repositories.
- Return safe JSON with `Cache-Control: no-store`, explicit status mapping, and
  no raw cookie/session/provider/internal membership leakage.
- Add rollback-based `talk-tracks:route-check` and `next-actions:route-check`
  verifiers before implementation, following TDD.
- Update durable docs/specs only for the implemented local-only runtime
  boundary.

**Non-Goals:**

- Browser `/talk-tracks` or `/next-actions` save UI, Server Actions, UI state
  changes, or Playwright UI verification.
- Login provider, provider callback, middleware, team switching, member UI, or
  production auth provider.
- AI provider invocation, RAG retrieval, web discovery, queue, notifications,
  calendar integration, export integration, analytics, observability provider,
  object storage, or production database provider.
- Changing repository schema, migrations, state machines, or business rules
  beyond route-level safe mapping.

## Decisions

1. **Use one workflow-level change with two capabilities.**
   - Decision: one OpenSpec change implements both `talk-track-asset-api-runtime`
     and `next-session-task-api-runtime`.
   - Rationale: these domains are adjacent execution assets. Talk tracks turn
     objections and knowledge into reusable language; next-session tasks turn
     review findings into accountable follow-up. Shipping only one leaves the
     post-review execution loop incomplete, while splitting them into separate
     proposals repeats the slow per-interface pattern the user rejected.
   - Alternatives considered:
     - Talk-track API only: rejected because it does not create accountability
       for follow-up work.
     - Next-session task API only: rejected because many follow-up tasks point
       back to talk-track improvements, but those assets would remain API-less.
     - Full UI now: deferred because browser state, accessibility, mobile
       density, and Playwright verification are a distinct frontend wave.

2. **Keep Route Handlers thin and repository-owned business rules unchanged.**
   - Decision: create server-only route helper modules under
     `apps/web/src/server/talk-tracks/route.ts` and
     `apps/web/src/server/next-actions/route.ts`. They handle request IDs,
     scope parsing, CSRF checks, auth resolution, JSON parsing, status/error
     mapping, and response shaping. App Router files connect HTTP methods to
     these helpers and instantiate repositories.
   - Rationale: existing product, session, and knowledge API runtimes use this
     boundary. It preserves UI/domain/data separation and avoids duplicating
     talk-track or task state machines in HTTP files.
   - Alternatives considered:
     - Put logic directly in App Router files: rejected because it would
       duplicate auth/error mapping and make local rollback verification harder.
     - Add a cross-domain orchestration service now: rejected because both
       repositories already own the current workflow behavior and no cross-write
       transaction is required in this slice.

3. **Use explicit tenant/team scope checked server-side.**
   - Decision: read `tenantId` and `teamId` only from query parameters or
     existing `x-operation-tenant-id` / `x-operation-team-id` headers, then
     verify them through the auth runtime before repository access. Client body
     ownership, actor, audit, tenant, or team fields are ignored.
   - Rationale: OWASP API1/API3 concerns are directly relevant because scripts,
     tasks, sources, and team feedback can expose sales strategy and customer
     context. The route must not trust client-selected ownership or leak
     cross-team record existence.
   - Alternatives considered:
     - Use body ownership for mutations: rejected due mass-assignment and
       cross-team leakage risk.
     - Guess default team: rejected because existing protected routes require
       explicit scope and team switching is not implemented.

4. **Require workflow-specific mutation CSRF headers.**
   - Decision: talk-track mutations require `x-operation-csrf:
     talk-track-assets`; next-action mutations require `x-operation-csrf:
     next-session-tasks`.
   - Rationale: these mutations use a cookie-backed app session and affect
     downstream sales assets. A custom header follows existing logout, product,
     session, and knowledge mutation patterns.
   - Alternatives considered:
     - No CSRF until login provider exists: rejected because route behavior
       should not become less safe than existing protected mutations.
     - Final production CSRF/origin strategy now: deferred to provider/login UI
       OpenSpec.

5. **Preserve provenance and downstream feedback as distinct concepts.**
   - Decision: route responses expose repository views for candidates,
     source-grounded talk-track versions, task source trails, dependencies,
     review results, and feedback signals rather than flattening them into a
     generic content/task object.
   - Rationale: W3C PROV-O supports modeling provenance through entities,
     activities, agents, derivation, and attribution. The existing contracts
     already encode that idea; route responses should preserve it.
   - Alternatives considered:
     - Return one generic `asset` or `item`: rejected because it hides whether a
       value is source-backed, AI-suggested, reviewed, blocked, published,
       assigned, or feedback-only.

6. **Map errors to safe HTTP JSON and short-circuit cheap blocked paths.**
   - Decision:
     - Missing/malformed scope, missing path ID, malformed JSON, or validation:
       `400`
     - Missing auth cookie, expired/revoked session: `401`
     - Missing permission, forbidden scope, missing CSRF: `403`
     - Duplicate scenario/task or stale task state: `409`
     - Long input: `413`
     - Source/readiness, sensitive-data, candidate-review, checklist,
       dependency, assignee, or invalid lifecycle transition: `422`
     - Not found: `404`
     - Unexpected auth/persistence failure: `500`
   - Rationale: IANA status semantics align with prior API runtime. Short
     circuiting no-cookie and CSRF-blocked requests before DB access keeps
     public traffic cheap and avoids leaking DB availability.
   - Alternatives considered:
     - Return `200` for all route errors: rejected because future fetch wrappers
       and verifiers need reliable HTTP semantics.

## Risks / Trade-offs

- **Large endpoint count in one change** -> Mitigation: both capabilities map to
  existing repository methods, introduce no schema/dependency/provider/UI, and
  have separate rollback verifiers.
- **No UI yet** -> Mitigation: this API is the prerequisite boundary; future UI
  work can focus on browser state and Playwright checks without inventing
  backend behavior.
- **Local-only auth sessions** -> Mitigation: docs remain explicit that public
  preview users cannot use these routes without seeded app-owned sessions and
  that provider-backed login remains a separate auth wave.
- **Execution asset responses can include sensitive selling strategy** ->
  Mitigation: routes require scoped auth, no-store, safe error bodies, cross-team
  isolation checks, and no raw prompt/provider/cookie/database leakage.
- **CSRF strategy is not final production policy** -> Mitigation: custom headers
  match current local-only runtime pattern; provider-backed auth can replace or
  strengthen this in a future OpenSpec.

## Migration Plan

1. Add failing `talk-tracks:route-check` and `next-actions:route-check` scripts
   plus rollback verifiers for the complete API workflows before production
   route code.
2. Implement server-only route helpers and App Router route files.
3. Run local database verification with rollback transactions.
4. Run OpenSpec validation, related repository/API checks, typecheck, lint,
   build, and `git diff --check`.
5. Archive the change only after verification.
6. Commit with Conventional Commit format, push, rebuild Docker, restart
   `operation-web-preview` with `--restart unless-stopped`, and curl key public
   and unauthenticated/CSRF-denied API routes.

Rollback path:

- Remove `/api/talk-tracks/**` and `/api/next-actions/**` route files, the two
  route helper modules, the two route-check modules, package scripts, and the
  new accepted specs. Existing repositories, auth, product API, session API, and
  knowledge API runtime remain unchanged.

## Open Questions

- Browser `/talk-tracks` and `/next-actions` save/review UI should follow after
  this API boundary and will need UI/UX skill guidance plus Playwright before
  archive.
- Provider-backed login, team switching, and route-level middleware remain
  deferred to `auth-team-tenant`.
- Notifications, calendar sync, export, and external live-commerce platform
  integrations remain deferred to later production/integration phases.
