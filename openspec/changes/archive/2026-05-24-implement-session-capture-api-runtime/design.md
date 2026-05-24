## Context

The project is in stage 4 for protected core workflow persistence. Existing
accepted runtime pieces already cover:

- Next.js App Router and Route Handler baseline.
- Provider-neutral auth guard, app-owned session ledger, auth cookie/request
  resolver, and safe auth session/logout routes.
- PostgreSQL/Drizzle repository foundation.
- Server-only session capture repository for create, list, detail/readiness,
  autosave, submit, duplicate label handling, tenant/team scope, and rollback
  verification.
- Product create/list API runtime as the first protected business Route Handler
  pattern.

The missing link for live-session capture is a coherent HTTP workflow boundary.
Without it, future `/sessions` save flows, AI review input snapshots, talk-track
candidates, and next-session tasks cannot safely use persisted session records
through the app's auth and tenant/team boundaries. A narrow create/list-only slice
would prove the pattern but leave the operator workflow incomplete, so this wave
covers the full repository-backed API path that already exists locally: create,
list, detail, autosave draft, and submit.

## Goals / Non-Goals

**Goals:**

- Add local-only session capture Route Handlers for create, list, detail,
  optimistic draft autosave, and submit-to-review.
- Reuse the existing auth cookie/session runtime to resolve an `AuthContext`.
- Convert the authorized context to the existing `DataAccessContext` and delegate
  business rules to the existing session capture repository.
- Return safe JSON with `Cache-Control: no-store`, explicit status mapping, and
  no raw cookie/session/provider/internal membership leakage.
- Add a rollback-based `sessions:route-check` verifier before implementation,
  following TDD.

**Non-Goals:**

- Login provider, provider callback, middleware, team switching, member UI, or
  production auth provider.
- Browser `/sessions` save UI, Server Actions, archive/delete API, transcript
  upload/import, AI review snapshot/trigger API, RAG, queue, object storage, or
  production database provider.
- Any new npm dependency or external service.

## Decisions

1. **Use Route Handlers as thin BFF boundaries for a full session API workflow.**
   - Decision: expose:
     - `GET /api/sessions/captures`
     - `POST /api/sessions/captures`
     - `GET /api/sessions/captures/[sessionId]`
     - `PATCH /api/sessions/captures/[sessionId]/draft`
     - `POST /api/sessions/captures/[sessionId]/submit`
     and delegate to server-only helpers in
     `apps/web/src/server/sessions/route.ts`.
   - Rationale: Next.js official docs define `route.ts` as the App Router
     custom request handler boundary for HTTP methods using Web
     `Request`/`Response`. This matches existing auth and product API route
     patterns.
   - Alternatives considered:
     - Server Actions first: deferred because the current missing boundary is a
       reusable HTTP/API contract; Server Actions can later be thin UI wrappers.
     - UI-only local state: rejected because it would not prove auth, tenant,
       repository, or persistence boundaries.

2. **Expose existing repository workflow methods together.**
   - Decision: implement route helpers over `listSessionCaptures`,
     `createSessionCapture`, `getSessionCaptureDetail`, `autosaveSessionDraft`,
     and `submitSessionCapture`. Leave archive/delete, transcript import, AI
     snapshot, and UI-specific saved-state behavior to later OpenSpec changes.
   - Rationale: these five methods already form one operator workflow:
     create a session, recover it from a list, inspect current detail/readiness,
     save draft changes with version conflict protection, then submit it for
     downstream review. Shipping them together avoids a too-small proposal while
     still staying inside the established repository and auth boundaries.
   - Alternatives considered:
     - Keep create/list only: rejected after scope review because it would slow
       delivery and leave the core session capture workflow incomplete at the API
       layer.
     - Add UI save flow now: deferred because browser loading/saved/error states,
       form ergonomics, and Playwright verification should be a separate frontend
       wave once the API is available.

3. **Derive tenant/team and actor from authorized scope, not request body.**
   - Decision: `tenantId` and `teamId` are accepted only from query parameters or
     existing `x-operation-tenant-id` / `x-operation-team-id` headers, then checked
     by auth guard before repository use. Session create body ownership and audit
     fields are ignored because the repository receives only `DataAccessContext`
     ownership.
   - Rationale: OWASP API1/API3 risks center on object access and property
     overexposure/manipulation. The safe pattern is to authorize object scope
     server-side and return only the route response view.
   - Alternatives considered:
     - Let clients send `tenantId` / `teamId` in the body: rejected because it
       encourages ownership/mass-assignment mistakes.
     - Guess a default team: rejected because existing auth routes deliberately
       return explicit scope errors when scope is absent.

4. **Require a custom mutation CSRF header for every session mutation.**
   - Decision: `POST /api/sessions/captures`,
     `PATCH /api/sessions/captures/[sessionId]/draft`, and
     `POST /api/sessions/captures/[sessionId]/submit` require
     `x-operation-csrf: session-captures`.
   - Rationale: these routes mutate server state through a cookie-backed session.
     Keeping a simple custom header aligns with existing logout and product
     mutation route patterns and is enough for this local-only slice.
   - Alternatives considered:
     - No CSRF header until login provider exists: rejected because this is a
       protected business mutation.
     - Full origin/referrer strategy now: deferred until provider/login and
       complete protected UI flows are defined.

5. **Short-circuit cheap unauthenticated and CSRF-blocked paths before DB.**
   - Decision: App Route Handler files avoid opening a database connection when
     a request has no auth cookie, or when a mutation lacks the CSRF header.
   - Rationale: existing auth and product API route runtimes follow this pattern.
     It keeps public no-cookie requests safe, cheaper, and independent of local
     DB availability.
   - Alternatives considered:
     - Always open DB and let auth helper reject: rejected because it adds
       avoidable failure modes for unauthenticated public traffic.

6. **Map errors to safe HTTP JSON.**
   - Decision:
     - Missing/invalid scope, malformed JSON, missing path ID, or validation: `400`
     - Missing auth cookie, expired/revoked session: `401`
     - Missing permission, forbidden scope, missing CSRF: `403`
     - Duplicate label and stale draft version: `409`
     - Long input: `413`
     - Missing required field, sensitive-data review, invalid state: `422`
     - Not found: `404`
     - Unexpected persistence/auth failures: `500`
   - Rationale: IANA HTTP status registry provides the neutral status code
     vocabulary; the route body remains session-specific and redacted.
   - Alternatives considered:
     - Return `200` with session error codes for all failures: rejected because
       client code and future tests need reliable HTTP semantics.

## Risks / Trade-offs

- **No login provider yet** -> This API remains local-only and useful for verifier
  and runtime boundary work, but public preview users cannot create records
  without seeded app-owned sessions. Mitigation: keep scope in OpenSpec and do
  not add UI save claims.
- **CSRF policy is minimal** -> Custom header is not the final production
  strategy. Mitigation: document it as local-only and require future provider
  OpenSpec to revisit origin/referrer/token strategy.
- **Five endpoints increase verification scope** -> The wave is larger than the
  previous create/list API slice. Mitigation: still use only existing repository
  methods, avoid new tables/dependencies, and cover the workflow with a single
  rollback verifier before implementation.
- **Authorized responses can include operator-entered notes/questions** -> This is
  necessary for scoped session capture views, but responses must never leak
  secrets, raw cookies, provider tokens, database URLs, or cross-team data.
  Mitigation: verifier checks redaction and cross-team isolation.

## Migration Plan

1. Add failing `sessions:route-check` script and verifier for create/list/detail,
   autosave, submit, stale draft, auth, scope, CSRF, isolation, redaction, and
   rollback.
2. Implement server-only route helpers and App Router files.
3. Run local database verification with rollback transactions.
4. Run OpenSpec validation, typecheck, lint, build, and related auth/session
   checks.
5. Archive the change only after verification.
6. Commit with Conventional Commit format using a professional type prefix,
   push, rebuild Docker, restart `operation-web-preview` with
   `--restart unless-stopped`, and curl key public/API routes.

Rollback path:

- Remove `/api/sessions/captures` route files, route helper, route check script,
  and the new spec. Existing auth and repository runtime remain unchanged.

## Open Questions

- The frontend save flow remains deferred until a follow-up change can cover draft
  conflict UX, saved-state copy, and browser interaction tests.
- Provider-backed login and team switching remain deferred to a separate
  auth-team-tenant change.
