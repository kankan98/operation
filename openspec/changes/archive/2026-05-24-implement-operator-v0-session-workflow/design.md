## Context

The project has already implemented the local-only technical foundation needed
for a protected workflow:

- app-owned auth session ledger, HttpOnly `Secure` cookie helpers, safe
  `/api/auth/session` and `/api/auth/logout` routes;
- PostgreSQL/Drizzle data foundation and tenant/team data access context;
- protected session capture Route Handlers for list/create/detail/draft/submit;
- static `/sessions` UI that currently says saving is unavailable.

The gap is no longer API availability. The gap is that an operator cannot use
the browser to enter a team context and complete a session capture. This change
is a stage 2-4 bridge in the technical roadmap: local auth bootstrap plus a
core operations persistence workflow. It deliberately does not advance RAG,
external integrations, queue/storage, or production authentication.

The current accepted `auth-cookie-runtime` requires `HttpOnly`, `Secure`, and
`SameSite=Lax` cookies. That means a raw HTTP public IP preview cannot be treated
as the final authenticated browser environment without an HTTPS deployment
decision. This change keeps the secure cookie contract intact; local browser
verification should use localhost or a secure preview setup.

## Goals / Non-Goals

**Goals:**

- Provide a local-only V0 operator bootstrap that seeds or reuses one internal
  tenant/team/operator and issues an app-owned auth cookie through existing auth
  primitives.
- Make `/sessions` a real operator workflow:
  - detect auth/team context,
  - show loading/empty/error/saved/disabled states,
  - list saved session captures,
  - create a draft,
  - save draft content through the existing draft endpoint, and
  - submit complete captures to review-ready state.
- Keep UI/domain/data boundaries intact. Browser code calls Route Handlers only.
- Preserve Chinese operator-facing copy and badminton live-commerce fields.
- Add local verification that proves the bootstrap route and browser workflow use
  existing protected APIs safely.

**Non-Goals:**

- Production login provider, OAuth callback, password login, middleware-wide
  route protection, invitation flow, team administration, or provider tokens.
- Relaxing the existing `Secure` cookie requirement for HTTP public preview.
- New database tables or migrations.
- Server Actions, transcript upload, AI review trigger, RAG, Q&A, queues,
  object storage, observability provider, Douyin/e-commerce integration, or real
  DeepSeek calls.
- Replacing existing session capture repository validation or authorization
  rules.

## Decisions

### Decision 1: Add an explicitly gated local V0 bootstrap route

Implement a local-only `POST` Route Handler under auth, for example
`/api/auth/operator-v0-session`, that:

- is enabled only when `NODE_ENV !== "production"` or an explicit environment
  flag such as `OPERATION_ENABLE_V0_BOOTSTRAP=1` is set;
- requires a custom CSRF-style request header such as
  `x-operation-csrf: operator-v0`;
- opens PostgreSQL only after the gate and header pass;
- upserts/seeds deterministic internal demo records for one active tenant, one
  active live-operations team, one active operator user, tenant membership, and
  team membership;
- creates a fresh app-owned session reference, stores only the hash in
  `auth_sessions`, and returns `Set-Cookie` using
  `createAuthSessionSetCookieHeader()`;
- returns a safe JSON view containing `tenantId`, `teamId`, operator display
  name, role, and next route.

Alternatives considered:

- Add a full production auth provider now. Rejected because the current V0 goal
  is internal usability, and provider choice needs separate security and account
  decisions.
- Use query-string actor/team IDs from the UI. Rejected because it would bypass
  the existing auth session and server-side authorization model.
- Make session capture APIs accept unauthenticated demo writes. Rejected because
  it would violate tenant/team authorization boundaries and create a second API
  path to maintain.

### Decision 2: Keep session workflow API-driven, not repository-driven

The `/sessions` UI will be a client workflow component that calls:

- `POST /api/auth/operator-v0-session` when the operator chooses the local V0
  entry;
- `GET /api/auth/session?tenantId=...&teamId=...` to verify context;
- `GET /api/sessions/captures?tenantId=...&teamId=...` to list records;
- `POST /api/sessions/captures?tenantId=...&teamId=...` to create a draft;
- `PATCH /api/sessions/captures/[sessionId]/draft?tenantId=...&teamId=...` to
  save editable draft content;
- `POST /api/sessions/captures/[sessionId]/submit?tenantId=...&teamId=...` to
  submit for review readiness.

Alternatives considered:

- Server Actions for all mutations. Deferred because existing accepted runtime
  is Route Handler based; Server Actions can become a thin wrapper later.
- Import server repositories into page components. Rejected because it breaks
  UI/data boundaries and makes browser behavior harder to verify.

### Decision 3: Use a focused V0 form instead of building every capture subflow

The browser workflow should expose a practical minimum set of editable fields:

- title, session date, platform;
- host display name/responsibility;
- one or more product order rows with model, role, talking points, customer fit,
  and evidence state;
- summary;
- notes;
- customer questions;
- customer objections.

The UI can use a compact, single-screen operational layout with a list rail,
form body, and readiness/actions panel. It should not become a marketing-style
hero or a complex multi-step wizard. The restrained highlight is "ready checks":
operators see what is missing before submitting and can immediately tell whether
the session can feed AI review/talk tracks/next actions.

Alternatives considered:

- Keep the existing static preview and only add a login button. Rejected because
  it does not create a usable V0.
- Build all future subflows, uploads, and AI triggers now. Rejected because it
  crosses too many stages and would slow delivery.

### Decision 4: Verification-first implementation

Before production UI code, add a local route/workflow verifier that exercises
the V0 bootstrap plus existing auth/session endpoints against local PostgreSQL
inside rollback transactions where feasible. For UI behavior, add or update a
browser-facing workflow that can be checked manually and with Playwright before
archive.

Alternatives considered:

- Rely on existing `auth:route-check` and `sessions:route-check` only. Rejected
  because they do not prove the browser entry path or workflow composition.
- Write only Playwright tests. Deferred because the current project mostly uses
  route-check scripts for local database behavior and Playwright should be used
  at the UI verification gate.

## Risks / Trade-offs

- **HTTP public preview cannot reliably store `Secure` cookies** -> Keep the
  secure cookie contract; document that authenticated V0 browser saving needs
  localhost, HTTPS, or a future explicit preview deployment decision.
- **Local bootstrap could be mistaken for production login** -> Gate with env
  and copy; name it operator V0/internal; do not add provider callback, password
  form, invite flow, or public account semantics.
- **Client form can drift from repository schema** -> Keep shared client-side
  types local and map explicitly to existing API payloads; verify with route
  checks and TypeScript.
- **Autosave conflicts can confuse users** -> Surface stale draft errors as
  "草稿已更新，请刷新后再保存" and preserve the last loaded draft version in UI
  state.
- **A single large form can feel dense on mobile** -> Use stable responsive
  sections, concise labels, and action panels that stack cleanly.
- **V0 seeded data may pollute development DB** -> Use deterministic
  `operation_v0_*` IDs and make the route idempotent. This is acceptable for
  local/internal V0 and can be replaced by production auth later.

## Migration Plan

1. Add OpenSpec requirements and validate the change.
2. Add a failing local V0 workflow verifier.
3. Implement the gated bootstrap route and helper.
4. Convert `/sessions` to the API-driven client workflow.
5. Update docs/roadmap copy to mark `/sessions` as the first browser-usable V0
   workflow and to document the secure-cookie preview caveat.
6. Run route checks, lint, typecheck, build, OpenSpec validation, and Playwright
   desktop/mobile checks before archive.

Rollback path:

- Disable the bootstrap route by leaving `OPERATION_ENABLE_V0_BOOTSTRAP`
  unset in production-like environments.
- Revert the `/sessions` component to static preview while keeping accepted API
  runtimes intact.
- No migration rollback is needed because no new schema is planned.
