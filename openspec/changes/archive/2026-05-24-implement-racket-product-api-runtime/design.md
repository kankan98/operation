## Context

The project is in stage 4 for the first protected business API boundary.
Existing accepted runtime pieces already cover:

- App Router / Route Handler baseline.
- Provider-neutral auth guard, app-owned session ledger, auth cookie/request
  resolver, and safe auth session/logout routes.
- PostgreSQL/Drizzle repository foundation.
- Server-only racket product repository for create/list/source/review/publish
  behavior.

The missing link is an HTTP boundary for the product library. Without it,
future `/rackets` UI save flows, session capture product references, AI review
inputs, and Q&A grounding cannot use real saved product records safely.

## Goals / Non-Goals

**Goals:**

- Add local-only `GET /api/rackets/products` and
  `POST /api/rackets/products` Route Handlers.
- Reuse the existing auth cookie/session runtime to resolve an `AuthContext`.
- Convert the authorized context to the existing `DataAccessContext` and
  delegate business rules to the existing racket product repository.
- Return safe JSON with `Cache-Control: no-store`, explicit status mapping, and
  no raw cookie/session/provider/internal membership leakage.
- Add a rollback-based `rackets:route-check` verifier before implementation,
  following TDD.

**Non-Goals:**

- Login provider, provider callback, middleware, team switching, member UI, or
  production auth provider.
- Browser product form UI, Server Actions, edit/archive/import, source review,
  product publish, AI/RAG snapshot, Q&A endpoint, queue, or production database
  provider.
- Any new npm dependency or external service.

## Decisions

1. **Use Route Handlers as thin BFF boundaries.**
   - Decision: expose `GET` and `POST` under
     `apps/web/src/app/api/rackets/products/route.ts` and delegate to
     server-only helpers in `apps/web/src/server/rackets/route.ts`.
   - Rationale: Next.js official docs define `route.ts` as the App Router
     custom request handler boundary for HTTP methods using Web
     `Request`/`Response`. This matches the existing auth route pattern.
   - Alternatives considered:
     - Server Actions first: deferred because the current missing boundary is a
       reusable HTTP/API contract; Server Actions can later be thin UI wrappers.
     - UI-only local state: rejected because it would not prove auth, tenant,
       repository, or persistence boundaries.

2. **Derive tenant/team from authorized scope, not request body.**
   - Decision: `tenantId` and `teamId` are accepted only from query parameters
     or existing `x-operation-tenant-id` / `x-operation-team-id` headers, then
     checked by auth guard before repository use. Product create body ownership
     fields are ignored or treated as ordinary extra JSON, because the
     repository receives only `DataAccessContext` ownership.
   - Rationale: OWASP API1/API3 risks center on object access and property
     overexposure/manipulation. The safe pattern is to authorize the object
     scope server-side and return only the product view shape.
   - Alternatives considered:
     - Let clients send `tenantId` / `teamId` in the body: rejected because it
       encourages mass-assignment-style ownership mistakes.
     - Guess a default team: rejected because existing auth session route
       deliberately returns `AUTH_SCOPE_REQUIRED` when scope is absent.

3. **Require a custom mutation CSRF header for product creation.**
   - Decision: `POST /api/rackets/products` requires
     `x-operation-csrf: racket-products`.
   - Rationale: the route mutates server state through a cookie-backed session.
     Keeping a simple custom header aligns with the existing logout route
     pattern and is enough for this local-only slice.
   - Alternatives considered:
     - No CSRF header until login provider exists: rejected because the route
       will become the first protected business mutation.
     - Full origin/referrer strategy now: deferred until provider/login and
       complete protected UI flows are defined.

4. **Short-circuit cheap unauthenticated and CSRF-blocked paths before DB.**
   - Decision: App Route Handler files avoid opening a database connection when
     a request has no auth cookie, or when a mutation lacks the CSRF header.
   - Rationale: existing auth route runtime follows this pattern. It keeps
     public no-cookie requests safe, cheaper, and independent of local DB
     availability.
   - Alternatives considered:
     - Always open DB and let auth helper reject: rejected because it adds
       avoidable failure modes for unauthenticated public traffic.

5. **Map errors to safe HTTP JSON.**
   - Decision:
     - Missing/invalid scope or validation: `400`
     - Missing auth cookie, expired/revoked session: `401`
     - Missing permission, forbidden scope, missing CSRF: `403`
     - Duplicate model, alias/source conflict: `409`
     - Invalid state or missing source: `422`
     - Unexpected persistence/auth failures: `500`
   - Rationale: IANA HTTP status registry provides the neutral status code
     vocabulary; the route body remains product-specific and redacted.
   - Alternatives considered:
     - Return `200` with product error codes for all failures: rejected because
       client code and future tests need reliable HTTP semantics.

## Risks / Trade-offs

- **No login provider yet** -> This API remains local-only and useful for
  verifier/runtime boundary work, but users cannot create records through the
  public preview without seeded app-owned sessions. Mitigation: keep scope in
  OpenSpec and do not add UI save claims.
- **CSRF policy is minimal** -> Custom header is not the final production
  strategy. Mitigation: document it as local-only and require future provider
  OpenSpec to revisit origin/referrer/token strategy.
- **Only create/list are exposed** -> Product edit/source/review/publish still
  require repository checks. Mitigation: intentionally defer them until the
  first protected business API boundary is verified.
- **Search is repository-level filtering after bounded query** -> Good enough
  for current local slice, not a real search API. Mitigation: keep limit
  bounded and defer full search/indexing to a later product-library change.

## Migration Plan

1. Add failing `rackets:route-check` script and verifier.
2. Implement server-only route helpers and App Router files.
3. Run local database verification with rollback transactions.
4. Run OpenSpec validation, typecheck, lint, build, and related auth/racket
   checks.
5. Archive the change only after verification.
6. Commit with Conventional Commit format using a professional type prefix,
   push, rebuild Docker, restart `operation-web-preview` with
   `--restart unless-stopped`, and curl key public/API routes.

Rollback path:

- Remove `/api/rackets/products` route file, route helper, route check script,
  and the new spec. Existing auth and repository runtime remain unchanged.

## Open Questions

- Product edit/source/review/publish API scopes remain deferred until this
  first business Route Handler proves the auth and response boundary.
- Provider-backed login and team switching remain deferred to a separate
  auth-team-tenant change.
