## Why

知识生命周期已经有本地-only schema、repository 和 `knowledge:check`，但后续 AI 复盘、
话术资产、Q&A 和知识补缺仍没有受保护的 HTTP 工作流边界。现在产品库和直播场次采集
API runtime 已证明同一套 auth cookie/session、tenant/team scope、CSRF 和 no-store
Route Handler 模式，本轮应把知识“来源登记 -> 候选 claim/团队笔记 -> 审核队列 -> 冲突
处理 -> 发布版本”作为一个完整阶段能力交付，而不是按一两个接口拆多个提案。

Pre-proposal research and skill exploration:

- Reliable sources checked:
  - Next.js Route Handlers official docs: confirms `route.ts` is the App Router
    HTTP method boundary using Web `Request` and `Response`, matching the
    existing protected product/session API runtime pattern.
    Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
  - Next.js Authentication guide: confirms authentication, session management,
    and authorization are separate concerns, and protected data access must be
    authorized server-side.
    Source: https://nextjs.org/docs/app/guides/authentication
  - OWASP API Security Top 10 2023 API1/API3: object-level and object-property
    authorization risks require scoped object access, explicit server-side
    authorization, and avoiding client-controlled ownership or overexposed
    fields.
    Sources:
    https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
    https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/
  - IANA HTTP Status Code Registry: used as a neutral reference for mapping
    unauthenticated, forbidden, validation, conflict, semantic validation,
    not-found, payload-too-large, and server failure responses.
    Source: https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
  - W3C PROV-O Recommendation: confirms provenance should model entities,
    activities, agents, derivation, and attribution; this supports preserving
    source, claim, review decision, conflict, and published version as distinct
    records rather than flattening them into generic content.
    Source: https://www.w3.org/TR/prov-o/
- Skill-backed value exploration:
  - `openspec-explore`: current roadmap and accepted specs show knowledge
    lifecycle repository is the next stage-4 gap after product and session API
    runtime; there is no active OpenSpec change.
  - `problem-statement`: 知识审核人员和直播运营需要一种可追溯登记和审核知识的方式，
    因为当前只有本地 repository 验证，导致 AI 复盘、话术和 Q&A 无法通过受保护 API
    获取“已审核、无冲突、可发布”的知识边界。
  - `opportunity-solution-tree`: desired outcome is to reduce unsupported or
    stale selling claims before they reach live scripts and AI answers. The best
    coherent opportunity is a protected API workflow over existing repository
    operations: register source, add claim/note, inspect review queue, record
    decision, record/resolve conflict, publish version. UI, RAG, web discovery,
    queue and real AI calls are deferred because they cross separate stage gates.
  - `roadmap-planning`: this wave advances the "Now" route by turning the
    repository-only knowledge asset into a reusable protected API boundary. It
    unlocks future browser save flows and reviewed knowledge snapshots without
    prematurely choosing RAG or source discovery providers.
  - `codebase-recon`: existing hotspots for this slice are the established
    `server/*/route.ts` and `route-check.ts` patterns; reusing them reduces
    architectural drift.

## What Changes

- Add local-only knowledge lifecycle collection Route Handlers:
  - `GET /api/knowledge/sources` for scoped source list.
  - `POST /api/knowledge/sources` for source registration.
  - `GET /api/knowledge/sources/[sourceId]` for scoped source detail.
- Add local-only knowledge content and review workflow Route Handlers:
  - `POST /api/knowledge/claims` for adding manual/imported/AI-candidate claims
    through existing repository validation.
  - `POST /api/knowledge/team-notes` for adding team experience and talk-track
    notes with sensitive-level gates.
  - `GET /api/knowledge/review-queue` for scoped review queue retrieval.
  - `POST /api/knowledge/review-decisions` for approving, rejecting, marking
    stale/conflict, requesting source, archiving, or publishing review decisions
    where the repository permits that transition.
  - `POST /api/knowledge/conflicts` for recording conflict blockers.
  - `PATCH /api/knowledge/conflicts/[conflictId]` for resolving or ignoring a
    conflict with an audit decision.
  - `POST /api/knowledge/versions` for publishing a reviewed knowledge version.
- All knowledge routes:
  - Require an app auth session cookie and explicit tenant/team scope.
  - Resolve `AuthContext` through the existing auth session/cookie runtime.
  - Convert authorized scope to `DataAccessContext`.
  - Delegate business rules to the existing `createKnowledgeLifecycleRepository`.
  - Return safe, no-store JSON without raw cookies, session references, provider
    payloads, membership internals, database credentials, or cross-team record
    existence.
- Mutation routes:
  - Require `x-operation-csrf: knowledge-lifecycle`.
  - Ignore client-supplied ownership/audit fields and rely on the authorized
    context.
  - Map validation, duplicate source, conflict, sensitive-data, permission,
    missing source/not-found, invalid transition, long input, auth, and
    unexpected persistence failures to safe HTTP JSON responses.
- Add repeatable `knowledge:route-check` local verification that runs against
  PostgreSQL inside rollback transactions and proves no-cookie denial, missing
  scope, CSRF blocking, authorized workflow, duplicate source, invalid input,
  missing permission, cross-team isolation, conflict blocks publish, conflict
  resolution permits publish, no-store, response redaction, and rollback.
- Keep out of scope:
  - Browser `/knowledge` save UI, Server Actions, login provider, middleware,
    team switching, source crawling/search, refresh jobs, queue, RAG snapshot,
    Q&A answer generation, AI provider calls, production database provider,
    object storage, analytics, or public preview persistence claims.

## Capabilities

### New Capabilities

- `knowledge-lifecycle-api-runtime`: Local-only protected Route Handler runtime
  for a complete knowledge lifecycle API workflow over existing auth and
  repository boundaries.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `apps/web/src/server/knowledge/route.ts`
  - `apps/web/src/server/knowledge/route-check.ts`
  - `apps/web/src/app/api/knowledge/**/route.ts`
  - root and web `package.json` scripts for `knowledge:route-check`
- Affected specs/docs:
  - New OpenSpec capability `knowledge-lifecycle-api-runtime`.
  - Update `docs/contracts/knowledge-lifecycle.md`, README, and roadmap docs if
    implementation evidence changes durable runtime status or sequencing.
- Dependencies:
  - No new npm package, external service, auth provider, AI provider, RAG store,
    queue, storage, analytics, or observability dependency.
- Systems:
  - Uses existing Next.js App Router Route Handlers, app-owned auth cookie/session
    runtime, PostgreSQL/Drizzle repository, Zod validation, and Docker preview
    deployment after archive.
