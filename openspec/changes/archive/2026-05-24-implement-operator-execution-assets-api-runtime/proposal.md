## Why

话术资产和下场任务已经有本地-only schema、repository 和 rollback verifier，但仍没有受保护
HTTP 工作流边界。AI 复盘、知识审核和场次记录最终需要把建议沉淀成“可复用话术”和“下场可执行
任务”；如果继续只按一两个接口拆提案，会让运营执行闭环长期停在 repository 层，无法为后续浏览器
保存、AI 下游采纳和团队看板提供稳定 API。

Pre-proposal research and skill exploration:

- Reliable sources checked:
  - Next.js Route Handlers official docs: confirms `route.ts` is the App Router
    HTTP method boundary using Web `Request` and `Response`, matching the
    existing protected product/session/knowledge API runtime pattern.
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
    session/AI/knowledge/product/talk-track source trails as distinct records
    rather than copying raw sensitive facts into downstream assets.
    Source: https://www.w3.org/TR/prov-o/
- Skill-backed value exploration:
  - `openspec-explore`: current roadmap and accepted specs show talk-track
    assets and next-session tasks are the remaining stage-4 repository-only
    operator execution assets after product, session, and knowledge API runtime.
    There is no active OpenSpec change.
  - `problem-statement`: 直播运营、主播和审核人员需要一种把复盘建议、客户异议和团队经验变成
    可审核话术与可跟进任务的方式，因为当前只有本地 repository 验证，导致“复盘后真正执行”
    仍没有受保护 API 边界。
  - `opportunity-solution-tree`: desired outcome is to reduce lost follow-up
    work after live sessions. The best coherent opportunity is one protected
    workflow slice over existing repositories: create/review/publish/reuse talk
    tracks and create/progress/complete/review/feedback next-session tasks. UI,
    Server Actions, AI provider calls, RAG and notifications are deferred
    because they cross separate stage gates.
  - `roadmap-planning`: this wave advances the Now roadmap by turning two
    adjacent repository-only assets into reusable protected API boundaries in a
    single proposal. It is larger than the previous per-domain API waves, but
    still bounded because it introduces no schema, dependency, provider, UI, or
    production auth changes.

## What Changes

- Add local-only protected talk-track asset Route Handlers:
  - `GET /api/talk-tracks/assets` for scoped asset list.
  - `POST /api/talk-tracks/assets` for asset + initial version creation.
  - `GET /api/talk-tracks/assets/[assetId]` for scoped asset detail.
  - `POST /api/talk-tracks/candidates` for manual/session/AI/Q&A candidate
    creation without publishing.
  - `POST /api/talk-tracks/candidate-reviews` for human candidate review.
  - `POST /api/talk-tracks/review-decisions` for version review decisions.
  - `POST /api/talk-tracks/assets/[assetId]/submit` for review submission.
  - `POST /api/talk-tracks/assets/[assetId]/publish` for publishing a reviewed
    and source-grounded version.
  - `POST /api/talk-tracks/assets/[assetId]/archive` and
    `POST /api/talk-tracks/assets/[assetId]/restore` for lifecycle control.
  - `POST /api/talk-tracks/usage-signals` for audit-only reuse feedback.
- Add local-only protected next-session task Route Handlers:
  - `GET /api/next-actions/tasks` for scoped task list.
  - `POST /api/next-actions/tasks` for source-linked task creation.
  - `GET /api/next-actions/tasks/[taskId]` for scoped task detail.
  - `PATCH /api/next-actions/tasks/[taskId]/status` for safe lifecycle
    transitions.
  - `PATCH /api/next-actions/tasks/[taskId]/checklist/[itemId]` for checklist
    progress.
  - `POST /api/next-actions/tasks/[taskId]/dependencies` and
    `PATCH /api/next-actions/tasks/[taskId]/dependencies/[dependencyId]` for
    blocker tracking.
  - `POST /api/next-actions/tasks/[taskId]/complete` for completion with
    checklist/dependency gates.
  - `POST /api/next-actions/tasks/[taskId]/review-results` for review close,
    reopen, cancel, or request changes.
  - `POST /api/next-actions/tasks/[taskId]/feedback-signals` for audit-only
    workflow feedback.
- All routes:
  - Require an app auth session cookie and explicit tenant/team scope.
  - Resolve `AuthContext` through the existing auth session/cookie runtime.
  - Convert authorized scope to `DataAccessContext`.
  - Delegate business rules to existing repositories.
  - Return safe, no-store JSON without raw cookies, session references, provider
    payloads, membership internals, database credentials, raw prompt/provider
    payloads, or cross-team record existence.
- Mutation routes:
  - Require workflow-specific CSRF headers:
    - `x-operation-csrf: talk-track-assets`
    - `x-operation-csrf: next-session-tasks`
  - Ignore client-supplied ownership/audit fields and rely on the authorized
    context.
  - Map validation, duplicate, stale/conflicted source, AI-candidate review,
    sensitive-data, permission, state transition, assignee, checklist,
    dependency, not-found, auth, and persistence failures to safe HTTP JSON.
- Add repeatable local rollback route verifiers:
  - `talk-tracks:route-check`
  - `next-actions:route-check`
- Keep out of scope:
  - Browser `/talk-tracks` or `/next-actions` save UI, Server Actions, login
    provider, middleware, team switching, AI provider calls, RAG retrieval,
    queue, notifications, calendar/export integrations, production database
    provider, analytics, observability provider, or public preview persistence
    claims.

## Capabilities

### New Capabilities

- `talk-track-asset-api-runtime`: Local-only protected Route Handler runtime for
  talk-track candidates, assets, review, publish/archive/restore, and usage
  signals over the existing auth and repository boundaries.
- `next-session-task-api-runtime`: Local-only protected Route Handler runtime
  for next-session task create/list/detail, status/checklist/dependency
  progress, completion, review closure, and feedback signals over the existing
  auth and repository boundaries.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `apps/web/src/server/talk-tracks/route.ts`
  - `apps/web/src/server/talk-tracks/route-check.ts`
  - `apps/web/src/server/next-actions/route.ts`
  - `apps/web/src/server/next-actions/route-check.ts`
  - `apps/web/src/app/api/talk-tracks/**/route.ts`
  - `apps/web/src/app/api/next-actions/**/route.ts`
  - root and web `package.json` scripts for route checks.
- Affected specs/docs:
  - New OpenSpec capabilities `talk-track-asset-api-runtime` and
    `next-session-task-api-runtime`.
  - Update talk-track and next-session task contracts, README, and roadmap docs
    if implementation evidence changes durable runtime status or sequencing.
- Dependencies:
  - No new npm package, external service, auth provider, AI provider, RAG store,
    queue, storage, analytics, or observability dependency.
- Systems:
  - Uses existing Next.js App Router Route Handlers, app-owned auth
    cookie/session runtime, PostgreSQL/Drizzle repositories, Zod validation, and
    Docker preview deployment after archive.
