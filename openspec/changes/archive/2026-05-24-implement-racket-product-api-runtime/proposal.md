## Why

商品负责人和直播运营已经有本地-only 球拍产品 repository，但浏览器和后续工作流仍没有
受保护的业务 API 可以读取或创建产品记录。现在 auth cookie/session/route runtime 已经能把
请求映射到 `AuthContext`，下一步应先打通最小的产品库 HTTP 边界，避免后续 UI 保存、
直播场次引用、AI 复盘和 Q&A grounding 继续依赖静态数据或绕过权限。

Pre-proposal research and skill exploration:

- Reliable sources checked:
  - Next.js Route Handlers official docs, version 16.2.6, last updated
    2026-05-19: confirms `route.ts` is the framework-supported custom
    request handler boundary for `GET` / `POST` using Web `Request` and
    `Response` APIs.
    Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
  - Next.js Authentication guide: confirms auth work is split into
    authentication, session management, and authorization, and that data
    mutations must ensure the user is authorized before mutation.
    Source: https://nextjs.org/docs/app/guides/authentication
  - OWASP API Security Top 10 2023 API1 and API3: object-level and
    object-property authorization risks require scoped access and safe response
    shapes rather than trusting client-supplied identifiers or returning
    sensitive object properties.
    Sources:
    https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
    https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/
  - IANA HTTP Status Code Registry: used as the neutral reference for mapping
    validation, unauthenticated, forbidden, conflict, semantic validation, and
    server failure responses.
    Source: https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
- Skill-backed value exploration:
  - `openspec-explore`: current roadmap and specs show no active change and
    identify protected Route Handler / Server Action as the next coherent
    stage-4 bridge after auth route runtime.
  - `problem-statement`: 商品负责人需要一种可保存并可授权读取产品型号的方式，因为当前只有
    本地 repository 验证和静态页面，导致直播准备、后续场次引用和 AI 输入仍无法形成真实闭环。
  - `opportunity-solution-tree`: desired outcome is to reduce product-record
    fragmentation before live selling. The best smallest opportunity is
    protected product create/list API; UI form, provider login, review publish
    API, import, and AI/RAG are deferred because they add scope without proving
    the first business API boundary.
  - `codebase-recon`: repo is small and doc/API boundary files are the active
    hotspots; a narrow Route Handler slice minimizes churn and avoids touching
    static UI.

## What Changes

- Add a local-only `GET /api/rackets/products` Route Handler that:
  - Requires an app auth session cookie and explicit tenant/team scope.
  - Resolves `AuthContext` through the existing auth session/cookie runtime.
  - Converts the authorized context to `DataAccessContext`.
  - Delegates listing to the existing `createRacketProductRepository`.
  - Returns safe, no-store JSON without raw cookies, session references,
    provider payloads, membership internals, or cross-team record existence.
- Add a local-only `POST /api/rackets/products` Route Handler that:
  - Requires an app auth session cookie, explicit tenant/team scope, and a
    custom mutation CSRF header.
  - Parses and validates JSON request bodies before repository calls.
  - Delegates product creation to the existing repository.
  - Maps repository validation, duplicate model, alias conflict, authorization,
    and unexpected errors to safe HTTP JSON responses.
- Add repeatable `rackets:route-check` local verification that runs against
  PostgreSQL inside rollback transactions and proves unauthenticated denial,
  missing scope, CSRF blocking, authorized create/list, duplicate model,
  validation failure, missing permission, cross-team isolation, no-store, and
  response redaction.
- Keep out of scope:
  - Login provider, provider callback, middleware, team switching, member UI,
    public product form UI, Server Actions, review/source/publish APIs,
    product editing, imports, AI/RAG snapshots, production database provider,
    or public preview data persistence.

## Capabilities

### New Capabilities

- `racket-product-api-runtime`: Local-only protected Route Handler runtime for
  listing and creating racket products through existing auth and repository
  boundaries.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `apps/web/src/server/rackets/route.ts`
  - `apps/web/src/server/rackets/route-check.ts`
  - `apps/web/src/app/api/rackets/products/route.ts`
  - `apps/web/src/server/rackets/index.ts` if needed for exports
  - root and web `package.json` scripts for `rackets:route-check`
- Affected specs/docs:
  - New OpenSpec capability `racket-product-api-runtime`.
  - Update racket/auth contracts and roadmap only if implementation evidence
    reveals a durable boundary or sequencing change.
- Dependencies:
  - No new npm package, external service, auth provider, AI provider, queue, or
    storage dependency.
- Systems:
  - Uses existing Next.js App Router Route Handlers, app-owned auth
    cookie/session runtime, PostgreSQL/Drizzle repository, Zod validation, and
    local Docker preview deployment after archive.
