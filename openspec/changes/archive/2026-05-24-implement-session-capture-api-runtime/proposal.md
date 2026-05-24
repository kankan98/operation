## Why

直播运营已经有本地-only 场次采集 repository，但浏览器和后续 AI 复盘、话术资产、下场任务仍没有
受保护的场次采集 HTTP 工作流边界。现在 auth cookie/session/route runtime 与产品库 API runtime
已经证明了受保护业务 Route Handler 模式，下一步应一次性打通同一场次采集闭环内的创建、列表、
详情、草稿保存和提交边界，避免每一两个接口单独开提案拖慢整体进度，也避免后续 `/sessions`
保存入口或 AI 复盘输入继续依赖静态数据或绕过服务端权限。

Pre-proposal research and skill exploration:

- Reliable sources checked:
  - Next.js Route Handlers official docs: confirms `route.ts` is the App Router
    custom request handler boundary for HTTP methods using Web `Request` and
    `Response` APIs.
    Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
  - Next.js Authentication guide: confirms auth work is split into authentication,
    session management, and authorization, and that data access and mutations must
    enforce authorization server-side.
    Source: https://nextjs.org/docs/app/guides/authentication
  - OWASP API Security Top 10 2023 API1 and API3: object-level and object-property
    authorization risks require scoped access, safe response shapes, and avoiding
    client-controlled ownership or overexposed sensitive fields.
    Sources:
    https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
    https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/
  - IANA HTTP Status Code Registry: used as a neutral reference for mapping
    unauthenticated, forbidden, validation, conflict, semantic validation, not
    found, and server failure responses.
    Source: https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
- Skill-backed value exploration:
  - `openspec-explore`: current specs and roadmap show no active change and identify
    session capture Route Handler runtime as the next coherent stage-4 bridge after
    product API runtime.
  - `problem-statement`: 直播运营需要一种可保存并授权读取场次主题、主播分工、商品顺序和客户问题的方式，
    因为当前只有本地 repository 验证和静态页面，导致复盘输入、话术沉淀和下场任务无法形成真实闭环。
  - `opportunity-solution-tree`: desired outcome is to reduce scattered session notes
    before and after live selling. The best coherent opportunity is protected
    session workflow API over existing repository behaviors: create, list, detail,
    autosave, and submit. UI form, login provider, transcript import, and AI/RAG are
    deferred because they cross into separate UX/provider/runtime decisions.
  - `prioritization-advisor`: value/effort fit favors this route slice because it is
    high-value infrastructure for the core operator workflow, reuses existing auth
    and repository patterns, completes a usable API-level workflow in one proposal,
    and avoids new dependencies or provider choices.
  - `roadmap-planning` and `user-story-mapping`: the session capture journey naturally
    runs from create -> recover/list -> inspect detail -> autosave draft -> submit for
    downstream review. These steps are tightly coupled and should ship together as
    one stage-4 API wave, while UI states, transcript import, and AI review trigger
    remain later roadmap slices.

## What Changes

- Add local-only session capture collection Route Handlers:
  - `GET /api/sessions/captures` for scoped list/recovery.
  - `POST /api/sessions/captures` for initial session creation.
- Add local-only session capture item/workflow Route Handlers:
  - `GET /api/sessions/captures/[sessionId]` for scoped detail/readiness.
  - `PATCH /api/sessions/captures/[sessionId]/draft` for optimistic draft autosave.
  - `POST /api/sessions/captures/[sessionId]/submit` for submission to
    `review_ready`.
- All session capture routes:
  - Requires an app auth session cookie and explicit tenant/team scope.
  - Resolves `AuthContext` through the existing auth session/cookie runtime.
  - Converts authorized scope to `DataAccessContext`.
  - Delegates business rules to the existing `createSessionCaptureRepository`.
  - Returns safe, no-store JSON without raw cookies, session references, provider
    payloads, membership internals, raw customer/private data beyond the repository
    view, or cross-team record existence.
- Mutation routes:
  - Require a custom mutation CSRF header.
  - Parses JSON request bodies and delegates validation/business rules to the
    existing repository.
  - Use route path/session IDs and the actor's authorized tenant/team context,
    ignoring any client-supplied ownership/audit fields.
  - Maps repository validation, long-input, duplicate label, redaction, permission,
    stale draft, state, auth, and unexpected errors to safe HTTP JSON responses.
- Add repeatable `sessions:route-check` local verification that runs against
  PostgreSQL inside rollback transactions and proves unauthenticated denial,
  missing scope, CSRF blocking, authorized create/list/detail/autosave/submit,
  stale draft rejection, duplicate label, validation failure, long-input handling,
  missing permission, cross-team isolation, no-store, response redaction, and
  rollback.
- Keep out of scope:
  - Login provider, provider callback, middleware, team switching, member UI,
    `/sessions` browser save UI, Server Actions, archive/delete APIs, transcript
    upload/import, AI review trigger/snapshot API, RAG, queue, object storage,
    production database provider, or public preview user data persistence claims.

## Capabilities

### New Capabilities

- `session-capture-api-runtime`: Local-only protected Route Handler runtime for
  creating, listing, reading detail, autosaving drafts, and submitting live-session
  capture records through existing auth and repository boundaries.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `apps/web/src/server/sessions/route.ts`
  - `apps/web/src/server/sessions/route-check.ts`
  - `apps/web/src/app/api/sessions/captures/route.ts`
  - `apps/web/src/app/api/sessions/captures/[sessionId]/route.ts`
  - `apps/web/src/app/api/sessions/captures/[sessionId]/draft/route.ts`
  - `apps/web/src/app/api/sessions/captures/[sessionId]/submit/route.ts`
  - root and web `package.json` scripts for `sessions:route-check`
- Affected specs/docs:
  - New OpenSpec capability `session-capture-api-runtime`.
  - Update session contract and roadmap only if implementation evidence reveals a
    durable boundary or sequencing change.
- Dependencies:
  - No new npm package, external service, auth provider, AI provider, queue, storage,
    analytics, or observability dependency.
- Systems:
  - Uses existing Next.js App Router Route Handlers, app-owned auth cookie/session
    runtime, PostgreSQL/Drizzle repository, Zod validation, and local Docker preview
    deployment after archive.
