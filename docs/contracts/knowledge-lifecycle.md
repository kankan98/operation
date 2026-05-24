# Knowledge Lifecycle Contract

Status: draft
Runtime: partially implemented, local-only

本契约定义未来知识生命周期的 API、Server Action、Repository、数据库 schema、来源登记、
内容抽取、人工审核、版本发布、刷新任务、冲突处理、反馈学习和 AI/RAG grounding 边界。
当前已实现本地-only PostgreSQL/Drizzle schema、server-only repository、
local-only 受保护 Route Handler runtime、`knowledge:check` 和 `knowledge:route-check`
回滚式验证，覆盖来源登记、手动 claim、团队笔记、审核队列、审核决策、冲突记录、
冲突解决、发布版本、tenant/team scope、CSRF-protected mutation 和 `review_knowledge`
权限。尚未实现 Server Action、浏览器保存流程、网页抓取、RAG 索引、AI 调用、定时任务、
队列、生产数据库 provider 或面向用户的公开持久化行为。

## Use Case

面向直播运营、主播/助播、商品负责人、审核人员和团队负责人，把品牌规格、平台规则、
团队经验、公开资料和 AI 发现转成可追溯、可审核、可刷新、可版本化的知识资产，让 AI
复盘、话术资产、Q&A Agent 和下场任务只使用经过审核的知识。

核心目标：

- 让来源、抽取内容、团队经验、审核结论和已发布知识版本分层管理。
- 防止未经审核、过期、冲突或来源不明的内容进入 AI grounding。
- 支持公开来源刷新、冲突发现、反馈学习和知识缺口补充。
- 为后续数据库、RAG、Q&A、AI 复盘和 web discovery 提供稳定输入。

## Domain Entities

### KnowledgeSource

来源登记记录。当前本地-only schema/repository 已覆盖基础元数据、稳定来源键、审核状态、
刷新节奏、用途标签和审计 actor。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 来源 ID |
| `tenantId` | string | 租户 ID |
| `teamId` | string | 团队 ID |
| `sourceType` | enum | `official_brand`、`official_platform`、`official_sport_rule`、`authorized_retailer`、`academic_research`、`team_note`、`web_discovery` |
| `title` | string | 来源标题 |
| `owner` | string | 来源所有方 |
| `url` | string | 公开 URL，团队笔记可为空 |
| `normalizedSourceKey` | string | 按来源类型和 URL 或 owner/title 生成的去重键 |
| `retrievedAt` | datetime | 获取时间 |
| `trustLevel` | enum | `official`、`authorized`、`research`、`team`、`unknown` |
| `reviewState` | enum | `registered`、`extracting`、`reviewing`、`approved`、`rejected`、`stale`、`conflict`、`archived` |
| `refreshCadence` | enum | `manual`、`monthly`、`quarterly`、`on_demand` |
| `intendedUse` | string[] | 本地用途标签，例如 `racket_spec`、`talk_track` |
| `lastCheckedAt` | datetime | 最近检查时间 |

### ExtractedKnowledgeClaim

从来源中抽取出的候选事实或运营知识。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 候选 claim ID |
| `sourceId` | string | 来源 ID |
| `claimType` | enum | `racket_spec`、`platform_rule`、`sales_guidance`、`customer_question`、`objection_reply`、`metric_definition`、`team_experience` |
| `subject` | string | 主题，例如型号、平台规则或问题类型 |
| `knowledgeKey` | string | 稳定知识键 |
| `claimText` | string | 抽取文本 |
| `language` | enum | `zh`、`en`、`mixed`、`unknown` |
| `confidence` | enum | `high`、`medium`、`low`、`unknown` |
| `extractionMethod` | enum | `manual`、`ai_candidate`、`imported` |
| `reviewState` | enum | `pending`、`approved`、`rejected`、`conflict`、`needs_source` |

### TeamKnowledgeNote

团队经验和口径，不等同于公开来源事实。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 团队知识 ID |
| `tenantId` | string | 租户 ID |
| `teamId` | string | 团队 ID |
| `noteType` | enum | `selling_experience`、`talk_track`、`objection_reply`、`after_sales`、`pricing_guidance`、`workflow_note` |
| `knowledgeKey` | string | 稳定知识键 |
| `content` | string | 团队经验内容 |
| `sensitiveLevel` | enum | `internal`、`restricted`、`high` |
| `reviewState` | enum | `draft`、`reviewing`、`approved`、`rejected`、`archived` |
| `sourceIds` | string[] | 相关来源，可为空 |

### KnowledgeReviewDecision

人工审核结论。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 审核 ID |
| `targetType` | enum | `source`、`claim`、`team_note`、`conflict`、`ai_finding`、`feedback_signal` |
| `targetId` | string | 被审核对象 ID |
| `decision` | enum | `approve`、`reject`、`request_source`、`mark_conflict`、`mark_stale`、`publish`、`archive` |
| `reason` | string | 审核原因 |
| `reviewedBy` | string | reviewer ID |
| `reviewedAt` | datetime | 审核时间 |

### PublishedKnowledgeVersion

可用于下游 AI/RAG 的已发布知识版本。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 版本 ID |
| `knowledgeKey` | string | 稳定知识键 |
| `version` | number | 版本号 |
| `status` | enum | `published`、`stale`、`superseded`、`conflict_blocked`、`archived` |
| `summary` | string | 发布版本摘要 |
| `claimIds` | string[] | 组成该版本的 claim |
| `teamNoteIds` | string[] | 组成该版本的团队经验 |
| `sourceIds` | string[] | 引用来源 |
| `publishedBy` | string | 发布人 |
| `publishedAt` | datetime | 发布时间 |
| `expiresAt` | datetime | 建议刷新时间，可为空 |

### KnowledgeConflict

冲突记录。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 冲突 ID |
| `knowledgeKey` | string | 冲突主题 |
| `claimIds` | string[] | 互相冲突的 claim |
| `conflictType` | enum | `spec_mismatch`、`rule_change`、`source_priority`、`team_note_conflict`、`stale_source` |
| `severity` | enum | `low`、`medium`、`high` |
| `resolutionState` | enum | `open`、`reviewing`、`resolved`、`ignored` |
| `resolutionDecisionId` | string | 解决审核 ID |

### KnowledgeRefreshJob

未来来源刷新任务。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 刷新任务 ID |
| `sourceId` | string | 来源 ID |
| `trigger` | enum | `manual`、`scheduled`、`feedback`、`stale_detected` |
| `jobState` | enum | `queued`、`running`、`succeeded`、`partial`、`failed`、`cancelled` |
| `startedAt` / `finishedAt` | datetime | 任务时间 |
| `changeDetected` | boolean | 是否发现变化 |
| `errorCode` | string | 失败原因 |

### KnowledgeFeedbackSignal

运营反馈和质量信号。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 反馈 ID |
| `sourceWorkflow` | enum | `ai_review`、`talk_track`、`qa_agent`、`session_capture`、`manual_review` |
| `signalType` | enum | `accepted`、`edited`、`rejected`、`regenerated`、`missing_knowledge`、`wrong_source` |
| `targetType` | enum | `answer`、`suggestion`、`claim`、`source`、`knowledge_version` |
| `targetId` | string | 目标对象 ID |
| `reason` | string | 反馈原因 |
| `reviewPriority` | enum | `low`、`normal`、`high`、`urgent` |

### KnowledgeDownstreamReadiness

面向下游工作流的可用状态。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `knowledgeKey` | string | 知识键 |
| `workflow` | enum | `ai_review`、`talk_tracks`、`qa_agent`、`source_refresh` |
| `ready` | boolean | 是否可用 |
| `blockedBy` | string[] | 阻塞原因 |
| `requiredState` | string | 所需状态 |

## Commands / Queries

### Commands

当前本地-only repository 已实现的命令边界：

- `registerKnowledgeSource`
- `getKnowledgeSource`
- `listKnowledgeSources`
- `addExtractedKnowledgeClaim`
- `addTeamKnowledgeNote`
- `listKnowledgeReviewQueue`
- `recordKnowledgeReviewDecision`
- `recordKnowledgeConflict`
- `resolveKnowledgeConflict`
- `publishKnowledgeVersion`

这些方法只在 server-only repository 内可用，必须接收 `DataAccessContext`，并按
tenant/team scope 与 `review_knowledge` 权限执行。当前已有 local-only 受保护 Route Handler
runtime 包装这些 repository 方法；`/knowledge` 页面仍不会直接调用 repository。

当前 local-only 受保护 Route Handler runtime：

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

这些 Route Handler 通过现有 auth cookie/session runtime、显式 tenant/team scope、
`x-operation-csrf: knowledge-lifecycle` mutation header、repository business rules 和
no-store 安全响应工作。它们不创建登录 provider、middleware、浏览器保存 UI、公开来源抓取、
RAG snapshot、AI 调用、刷新任务、队列或生产数据库 provider。

未来公开命令边界：

- `RegisterKnowledgeSourceCommand`
- `UpdateKnowledgeSourceCommand`
- `ExtractKnowledgeClaimCommand`
- `AddTeamKnowledgeNoteCommand`
- `SubmitKnowledgeForReviewCommand`
- `RecordKnowledgeReviewDecisionCommand`
- `PublishKnowledgeVersionCommand`
- `MarkKnowledgeStaleCommand`
- `RecordKnowledgeConflictCommand`
- `ResolveKnowledgeConflictCommand`
- `ScheduleKnowledgeRefreshCommand`
- `RecordKnowledgeFeedbackSignalCommand`
- `ArchiveKnowledgeSourceCommand`

命令必须带 `tenantId`、`teamId`、actor、幂等键或审计上下文。写操作必须做权限检查、
输入校验、来源去重、敏感数据保护和审计记录。当前 local-only Route Handler 通过
app-owned auth session 派生 `DataAccessContext`，尚未接入公开幂等键、Server Action 或浏览器保存流。

### Queries

当前本地-only repository 已实现 `listKnowledgeSources`、`getKnowledgeSource` 和
`listKnowledgeReviewQueue`。未来公开查询边界：

- `ListKnowledgeSourcesQuery`
- `GetKnowledgeSourceDetailQuery`
- `SearchPublishedKnowledgeQuery`
- `ListKnowledgeReviewQueueQuery`
- `ListKnowledgeConflictsQuery`
- `ListKnowledgeRefreshJobsQuery`
- `GetKnowledgeSnapshotForAiQuery`
- `ListKnowledgeFeedbackSignalsQuery`
- `GetKnowledgeDownstreamReadinessQuery`

查询必须按 tenant/team 过滤。AI/RAG snapshot 只能返回已发布、未冲突、未过期且经过
最小必要字段裁剪的知识。

## Request Shape

### RegisterKnowledgeSourceCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "user_001",
  "idempotencyKey": "source-001",
  "sourceType": "official_brand",
  "title": "ASTROX 100ZZ product page",
  "owner": "Yonex",
  "url": "https://www.yonex.com/",
  "trustLevel": "official",
  "refreshCadence": "monthly",
  "intendedUse": ["racket_spec", "talk_track"]
}
```

### RecordKnowledgeReviewDecisionCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "reviewer_001",
  "targetType": "claim",
  "targetId": "claim_001",
  "decision": "approve",
  "reason": "来源为品牌官方页面，字段和当前产品库一致"
}
```

### SearchPublishedKnowledgeQuery

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "query": "中高级双打速度型球拍推荐",
  "filters": {
    "claimType": ["racket_spec", "selling_experience"],
    "trustLevel": ["official", "team"],
    "excludeStale": true,
    "excludeConflicts": true
  },
  "pagination": {
    "cursor": null,
    "limit": 20
  }
}
```

## Response Shape

### PublishedKnowledgeView

```json
{
  "knowledgeKey": "racket:astrox-100zz:spec",
  "version": 3,
  "status": "published",
  "summary": "ASTROX 100ZZ 属于高端进攻型球拍，适合发力充分的进阶及以上球友。",
  "sourceSummary": {
    "trustLevel": "official",
    "sourceCount": 2,
    "freshness": "current",
    "lastCheckedAt": "2026-05-23T09:00:00+08:00"
  },
  "reviewSummary": {
    "reviewedBy": "reviewer_001",
    "reviewedAt": "2026-05-23T10:00:00+08:00"
  },
  "downstreamReadiness": [
    {
      "workflow": "qa_agent",
      "ready": true,
      "blockedBy": []
    }
  ]
}
```

### ErrorResponse

```json
{
  "error": {
    "code": "CONFLICTING_CLAIM",
    "message": "该知识与已发布版本存在冲突，请先审核",
    "field": "claimText",
    "recoverable": true
  }
}
```

## State Machine

```text
registered
  -> extracting
  -> reviewing
  -> approved
  -> published

registered -> rejected
reviewing -> conflict
reviewing -> rejected
published -> stale
published -> superseded
stale -> reviewing
conflict -> reviewing
published -> archived
```

当前本地-only slice 的实际流转边界更窄：

- source：`registered` 可通过审核变为 `approved`、`rejected`、`stale`、`conflict` 或 `archived`。
- claim：`pending` 可变为 `approved`、`rejected`、`conflict` 或 `needs_source`。
- team note：`draft` 可变为 `approved`、`rejected` 或 `archived`。
- publish：必须至少包含一个 approved claim 或 approved team note，所有引用 source 必须 approved，
  同一 `knowledgeKey` 不能存在 open/reviewing conflict，高敏团队笔记不能在当前 slice 发布。

下游可用规则：

| 状态 | AI 复盘 | 话术资产 | Q&A Agent | 刷新任务 |
| --- | --- | --- | --- | --- |
| `registered` | 不可用 | 不可用 | 不可用 | 可创建 |
| `extracting` | 不可用 | 不可用 | 不可用 | 不可用 |
| `reviewing` | 不可用 | 不可用 | 不可用 | 可创建 |
| `approved` | 可作为候选 | 可作为候选 | 不可用 | 可创建 |
| `published` | 可用 | 可用 | 可用 | 可创建 |
| `stale` | 需提示过期 | 需复核 | 不可用 | 可创建 |
| `conflict` | 不可用 | 不可用 | 不可用 | 需先解决 |
| `superseded` | 只读 | 只读 | 不可用 | 不可用 |
| `rejected` | 不可用 | 不可用 | 不可用 | 不可用 |
| `archived` | 不可用 | 不可用 | 不可用 | 不可用 |

## Refresh And Conflict Rules

未来实现必须显式处理：

- 来源登记时检查重复 URL、重复标题和同一来源的多个版本。
- 每条来源保留 `retrievedAt`、`lastCheckedAt`、`refreshCadence` 和 `trustLevel`。
- 刷新发现内容变化时，不直接覆盖 published 版本；必须生成待审核 claim 或冲突记录。
- 公开 web discovery 结果只能进入 `web_discovery` 来源和 review-only finding。
- 冲突 claim 阻止对应知识进入 Q&A Agent grounding。
- 运营反馈只能创建 review priority 或 missing knowledge 候选，不直接改写已发布知识。

## Error Cases

- `VALIDATION_ERROR`：必填字段缺失、枚举非法、字符串过长。
- `LONG_INPUT_LIMIT_EXCEEDED`：来源、claim、团队笔记或摘要超过当前长度上限。
- `DUPLICATE_SOURCE`：同团队下来源 URL 或稳定来源键重复。
- `MISSING_SOURCE`：claim 缺少来源或来源不可追溯。
- `SOURCE_FETCH_FAILED`：未来来源获取失败、网络超时或链接不可用。
- `SOURCE_STALE`：来源超过刷新策略。
- `CONFLICTING_CLAIM`：抽取内容与现有 claim 或 published version 冲突。
- `REVIEW_REQUIRED`：未审核内容被请求发布或用于 AI snapshot。
- `FORBIDDEN_PERMISSION`：actor 缺少 `review_knowledge` 或读取工作区所需权限。
- `UNAUTHORIZED_TENANT`：未来公开接口访问其他租户或团队数据。
- `FORBIDDEN_ROLE`：未来角色不允许登记、审核、发布、刷新或归档。
- `NOT_FOUND`：来源、claim、版本、冲突或刷新任务不存在。
- `STATE_TRANSITION_INVALID`：状态流转非法。
- `PROVIDER_UNAVAILABLE`：未来 AI、搜索、抓取或向量 provider 不可用。
- `SCHEMA_MISMATCH`：未来抽取结果、AI finding 或导入数据不符合契约 shape。
- `SENSITIVE_DATA_NEEDS_REVIEW`：来源或团队笔记包含客户数据、内部策略或高敏信息。
- `AI_SNAPSHOT_UNAVAILABLE`：请求 AI/RAG snapshot 时知识未发布、已过期或存在冲突。
- `DATABASE_OPERATION_FAILED`：本地 repository 或未来 API 持久化失败，错误消息必须脱敏。

## Authorization

当前本地 repository 和 local-only Route Handler 写入、审核、冲突和发布均要求
`review_knowledge`。来源列表、来源详情和审核队列允许 `read_workspace` 或
`review_knowledge`，并始终按 `tenantId` 与 `teamId` 过滤。

未来公开权限草案：

| 动作 | 允许角色 |
| --- | --- |
| 查看已发布知识 | operator、host、reviewer、admin |
| 查看来源和审核队列 | operator、reviewer、admin |
| 登记来源和团队笔记 | operator、reviewer、admin |
| 创建刷新任务 | reviewer、admin |
| 审核、发布、标记冲突 | reviewer、admin |
| 归档来源或知识版本 | admin |
| 读取 AI/RAG snapshot | 后端服务，仅限同 tenant/team |

所有读写必须按 `tenantId` 和 `teamId` 做服务端授权。UI 隐藏按钮不能替代服务端权限。

## Sensitive Data

敏感级别：

- 官方公开规格、规则和公开平台文档：低敏，但需要来源和刷新时间。
- 团队经验、价格带、直播话术、异议回应：业务敏感。
- 客户聊天、订单、手机号、地址、私信和供应商信息：高敏，不得进入普通来源记录、
  日志或 AI/RAG snapshot。
- AI finding、prompt、检索 snapshot 和反馈原因：业务敏感，只传递最小必要字段。

日志不得记录完整客户数据、内部成交策略、供应商信息、未发布知识、完整 prompt 或
未来检索上下文全文。

## Audit Metadata

未来写入、审核、发布和刷新记录必须包含：

- `createdBy`、`createdAt`
- `updatedBy`、`updatedAt`
- `reviewedBy`、`reviewedAt`
- `publishedBy`、`publishedAt`
- `sourceIds`
- `claimIds`
- `knowledgeVersionId`
- `refreshJobId`
- `feedbackSignalId`
- `requestId`
- `idempotencyKey`
- `aiRunId`，仅当后续 AI 生成候选 claim 或 finding 时使用

## Verification

当前已验证：

- `DATABASE_URL="postgres://..." pnpm knowledge:check`：登记来源、重复来源拒绝、缺权限拒绝、
  claim/team note 创建、审核队列、审核通过、冲突阻断发布、解决冲突、发布 readiness、
  跨团队隔离和事务回滚。
- `DATABASE_URL="postgres://..." pnpm knowledge:route-check`：受保护 Route Handler 的 missing
  cookie、missing scope、CSRF 阻断、来源 create/list/detail、claim 创建、team note 创建、
  review queue、review decisions、duplicate source、validation、long input、缺权限、冲突阻断/解决、
  发布版本、跨团队隔离、no-store、脱敏和事务回滚。

未来公开/API/AI/RAG 实现本契约时至少验证：

- 单元测试：来源去重、claim 校验、状态机、刷新过期判断、冲突检测。
- 集成测试：登记来源、抽取 claim、审核、发布、标记过期、解决冲突、刷新失败和权限边界。
- 数据测试：同 tenant/team 查询隔离，不同 team 不互相可见。
- 浏览器测试：`/knowledge` 在桌面和移动端展示 empty、registered、reviewing、published、
  stale、conflict、failed 和 review queue 状态。
- AI/RAG 测试：只允许 `published` 且未过期、未冲突的 snapshot grounding；review-only
  finding 不可用于回答。
- 安全测试：跨租户访问失败，日志不含客户个人信息、内部话术、完整 prompt 或检索全文。
- 公开预览：影响页面或声明时检查关键路由 HTTP 200。

## Open Questions

- 公开来源抓取是否需要 allowlist、robots/条款检查和失败退避策略。
- RAG snapshot 是否先基于 reviewed text，还是同时支持结构化 metadata filter。
- 刷新任务是否需要队列和定时任务，或者先由 reviewer 手动触发。
- 反馈信号如何进入评测集和知识补充优先级，需要与 Q&A Agent 契约一起确认。
- 浏览器 `/knowledge` 保存流程应采用薄 Server Action、fetch wrapper 还是内部审核工具页，需要单独 OpenSpec。
