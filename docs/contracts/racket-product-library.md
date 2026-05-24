# Racket Product Library Contract

Status: draft
Runtime: partially implemented, local-only product, alias, source, review, publish repository, and protected product create/list API runtime

本契约定义未来球拍产品库的 API、Repository、数据库 schema、审核流程和 AI/RAG grounding
边界。当前已具备本地-only 的产品、别名、来源、审核决策和发布门禁持久化切片：
Drizzle/PostgreSQL schema、migration、server-only repository、输入校验、tenant/team scope、
权限检查、重复型号、别名冲突和来源冲突检测、下游 readiness 计算，以及 `rackets:check`
和 `rackets:source-review-check` 回滚式验证；同时已具备本地-only 受保护产品库
Route Handler runtime：`GET /api/rackets/products` 和 `POST /api/rackets/products` 通过现有
auth cookie/session runtime、显式 tenant/team scope、CSRF mutation header、repository business
rules 和 `rackets:route-check` 回滚式验证完成产品列表和创建边界。

当前仍没有公开 UI 保存流程、Server Action、公开来源导入/发现 provider、产品编辑、
来源/审核/发布 API、AI 调用、RAG snapshot、生产数据库 provider 或公网预览用户可操作保存能力。

## Use Case

面向直播运营、主播/助播、商品负责人和团队负责人，管理羽毛球拍型号、规格、别名、
卖点、适用人群、来源和审核状态，让后续直播场次、AI 复盘、话术资产和 Q&A Agent 能
引用经过审核的产品知识。

核心目标：

- 避免直播间不同人对同一型号、别名和规格口径不一致。
- 把官方规格事实、团队经验、卖点表达和 AI 可用知识分开管理。
- 让未审核、冲突、过期或缺来源的内容不会直接进入 AI grounding。
- 为后续数据库、接口、权限和评测提供稳定输入。

## Implemented Local Runtime Surface

当前本地实现范围：

- `apps/web/src/server/db/schema.ts` 定义 `racket_products`、`racket_product_aliases`、
  `racket_product_sources` 和 `racket_review_decisions`，以及产品状态、平衡类型、
  别名类型、来源类型、信任等级、刷新策略、来源审核状态、审核目标和审核决策枚举。
- `apps/web/src/server/db/migrations/0001_heavy_maelstrom.sql` 保存产品和别名表的
  Drizzle migration，包含 tenant/team 外键、actor 审计字段、normalized model/alias scoped
  unique indexes 和查询索引。
- `apps/web/src/server/db/migrations/0002_quick_karnak.sql` 保存来源、审核决策和产品发布
  审计字段 migration，包含 tenant/team/product 外键、normalized source scoped unique index、
  review queue 查询索引和 publication audit columns。
- `apps/web/src/server/rackets/repository.ts` 提供 server-only `createRacketProduct` 和
  `listRacketProducts` repository 方法，并提供 local-only `registerRacketSource`、
  `submitRacketProductForReview`、`recordRacketReviewDecision`、`publishRacketProduct`
  和 `listRacketReviewQueue` 方法。
- repository 从 `DataAccessContext` 读取 actor、tenant、team 和权限，不信任调用方传入的
  ownership 字段。
- `createRacketProduct` 校验输入、计算 normalized model/alias、拒绝同团队重复型号、
  拒绝同团队别名冲突，并为未发布产品返回下游 readiness blocker。
- `listRacketProducts` 按授权 tenant/team 返回产品 view 和 aliases，不返回其他团队数据。
- `registerRacketSource` 校验来源输入、计算 normalized source key、拒绝同产品重复来源，
  并只允许 `manage_products` actor 为本团队产品登记 pending source。
- `submitRacketProductForReview` 要求产品已有来源，按 repository 状态机把产品移入
  `reviewing`。
- `recordRacketReviewDecision` 要求 `review_knowledge` 权限，记录 source/product 审核结论，
  并把来源或产品推进到 approved、rejected、needs_source、conflict 或 archived 等状态。
- `publishRacketProduct` 要求产品已 approved 且同 tenant/team 至少有一个 approved source，
  发布后写入 publication audit 字段，并把 approved source IDs 同步到兼容用的 `sourceIds`。
- `listRacketReviewQueue` 按 tenant/team 返回待来源、待审核、待发布或冲突处理的产品和来源摘要。
- `apps/web/src/server/rackets/route.ts` 提供 server-only 产品库 Route Handler helper，用于
  `GET /api/rackets/products` 和 `POST /api/rackets/products` 的 request ID、tenant/team scope、
  auth resolution、`DataAccessContext` 转换、CSRF mutation header、JSON 解析、错误/status 映射、
  no-store 响应和脱敏。
- `apps/web/src/app/api/rackets/products/route.ts` 提供 local-only Next.js Route Handler，短路
  missing-cookie 和 missing-CSRF 路径，连接本地 PostgreSQL 后委托 auth session repository 和
  racket product repository。
- 根级 `rackets:check` 脚本代理到 web app，并在本地 PostgreSQL 中用事务回滚验证 create/list、
  duplicate model、alias conflict、missing permission、cross-team isolation 和 rollback。
- 根级 `rackets:source-review-check` 脚本代理到 web app，并在本地 PostgreSQL 中用事务回滚验证
  source registration、duplicate source、review submission、source/product approval、
  publish gating、permission denial、cross-team isolation 和 rollback。
- 根级 `rackets:route-check` 脚本代理到 web app，并在本地 PostgreSQL 中用事务回滚验证
  missing cookie、missing scope、CSRF blocking、authorized create/list、duplicate model、
  validation failure、missing permission、cross-team isolation、no-store、redaction 和 rollback。

当前仍未实现：

- 产品编辑、归档运行流、团队经验、AI 候选、版本化产品快照和来源刷新任务。
- 来源/审核/发布 API、Server Action、UI 表单保存、批量导入、公开来源发现/导入 provider、
  搜索服务、AI/RAG snapshot 或生产持久化。
- provider-backed 登录、团队管理 UI、邀请和真实生产授权会话。

## Domain Entities

### RacketProduct

未来权威产品记录。字段草案：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 产品记录 ID |
| `tenantId` | string | 租户 ID |
| `teamId` | string | 团队 ID |
| `brand` | string | 品牌 |
| `series` | string | 系列 |
| `model` | string | 主型号名 |
| `normalizedModel` | string | 归一化型号名，用于去重 |
| `status` | enum | `draft`、`needs_source`、`reviewing`、`approved`、`published`、`stale`、`conflict`、`archived`、`rejected` |
| `weightClasses` | string[] | 如 `3U`、`4U`、`5U` |
| `balancePoint` | string | 明确数值或范围，未知时为空 |
| `balanceType` | enum | `head_light`、`even`、`head_heavy`、`unknown` |
| `shaftStiffness` | string | 中杆硬度 |
| `recommendedTension` | string | 推荐磅数或范围 |
| `playerLevels` | string[] | 入门、进阶、中高级、高阶等 |
| `playStyles` | string[] | 双打连贯、后场重杀、控球、平抽挡等 |
| `priceBand` | string | 价格带，不记录敏感成本价 |
| `sellingFocus` | string[] | 经审核的直播讲解重点 |
| `limitations` | string[] | 发力门槛、甜区、上手难度等限制 |
| `publishedVersionId` | string | 当前可引用版本 |
| `createdAt` / `updatedAt` | datetime | 审计时间 |

### RacketAlias

型号别名和口播名。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 别名 ID |
| `productId` | string | 关联产品 |
| `alias` | string | 别名文本 |
| `aliasType` | enum | `official_en`、`official_cn`、`series_short`、`live_spoken`、`common_typo`、`team_note` |
| `normalizedAlias` | string | 归一化别名 |
| `confidence` | enum | `high`、`medium`、`low` |
| `reviewState` | enum | `pending`、`approved`、`rejected`、`conflict` |

### RacketSource

规格、来源和团队事实来源。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 来源 ID |
| `sourceType` | enum | `official_site`、`brand_catalog`、`commerce_page`、`team_note`、`manual_review` |
| `title` | string | 来源标题 |
| `url` | string | 公开 URL，团队笔记可为空 |
| `retrievedAt` | datetime | 获取时间 |
| `trustLevel` | enum | `official`、`commerce`、`team`、`unknown` |
| `refreshPolicy` | enum | `manual`、`monthly`、`quarterly`、`on_demand` |
| `reviewState` | enum | `pending`、`approved`、`rejected`、`stale` |

### RacketReviewDecision

人工审核结论。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 审核 ID |
| `targetType` | enum | `product`、`alias`、`source`、`selling_point`、`comparison` |
| `targetId` | string | 被审核对象 ID |
| `decision` | enum | `approve`、`reject`、`request_source`、`mark_conflict`、`archive` |
| `reason` | string | 审核原因 |
| `reviewedBy` | string | reviewer ID |
| `reviewedAt` | datetime | 审核时间 |

### RacketTeamNote

团队经验和直播口径，不等同于官方规格事实。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 团队笔记 ID |
| `productId` | string | 关联产品 |
| `noteType` | enum | `selling_experience`、`objection_reply`、`comparison_tip`、`stringing_tip`、`price_positioning` |
| `content` | string | 团队经验内容 |
| `sensitiveLevel` | enum | `internal`、`restricted` |
| `reviewState` | enum | `pending`、`approved`、`rejected`、`conflict` |
| `sourceDecisionId` | string | 审核结论 ID，未审核时为空 |

### RacketAiCandidate

未来 AI 生成的候选内容。候选内容不是事实，必须经人工审核后才能进入产品记录或
下游 AI/RAG snapshot。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 候选内容 ID |
| `productId` | string | 关联产品 |
| `candidateType` | enum | `alias_suggestion`、`selling_point`、`comparison`、`limitation`、`qa_snippet` |
| `content` | string | AI 生成的候选文本 |
| `aiRunId` | string | 生成运行 ID |
| `sourceSnapshotIds` | string[] | 生成时引用的来源快照 |
| `reviewState` | enum | `pending`、`approved`、`rejected`、`conflict` |

### DownstreamReadiness

面向下游工作流的可用状态。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `productId` | string | 产品 ID |
| `workflow` | enum | `session_capture`、`ai_review`、`talk_tracks`、`qa_agent` |
| `ready` | boolean | 是否可用 |
| `blockedBy` | string[] | 阻塞原因 |
| `requiredState` | string | 所需审核状态 |

## Commands / Queries

### Commands

命令边界：

- `CreateRacketProductCommand`：本地 repository 层已部分实现产品和别名创建；local-only
  `POST /api/rackets/products` 已作为受保护 HTTP 边界接入现有 auth/session/repository，不包含
  Server Action、UI 表单或公开可操作保存流程。
- `UpdateRacketProductCommand`
- `AddRacketAliasCommand`
- `MergeRacketAliasCommand`
- `RegisterRacketSourceCommand`：本地 repository 层已部分实现来源登记，不包含公开来源发现、
  抓取、导入 provider 或 UI 表单。
- `AddRacketTeamNoteCommand`
- `SubmitRacketProductForReviewCommand`：本地 repository 层已部分实现 source-backed 产品提交审核。
- `RecordRacketReviewDecisionCommand`：本地 repository 层已部分实现 source/product 审核决策记录。
- `SubmitRacketAiCandidateForReviewCommand`
- `PublishRacketProductVersionCommand`：本地 repository 层已部分实现 approved + approved source
  门禁发布，不包含版本化 snapshot 或 AI/RAG grounding。
- `MarkRacketProductStaleCommand`
- `ArchiveRacketProductCommand`

命令必须带 `tenantId`、`teamId`、actor、幂等键或审计上下文。写操作必须做权限检查、
输入校验、重复型号检查和审计记录。

### Queries

查询边界：

- `ListRacketProductsQuery`：本地 repository 层已部分实现 tenant/team scoped list；local-only
  `GET /api/rackets/products` 已作为受保护 HTTP 边界接入现有 auth/session/repository，不包含
  全文搜索或复杂筛选。
- `GetRacketProductDetailQuery`
- `SearchRacketProductsQuery`
- `ListRacketAliasesQuery`
- `ListRacketReviewQueueQuery`：本地 repository 层已部分实现 tenant/team scoped review queue
  和 source summary，不包含公开 UI。
- `GetRacketDownstreamReadinessQuery`
- `GetRacketProductSnapshotForAiQuery`

查询必须按 tenant/team 过滤。AI/RAG snapshot 只能返回 reviewed/published 所需最小字段。

## Request Shape

### CreateRacketProductCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "user_001",
  "idempotencyKey": "create-racket-001",
  "model": "疾速 900",
  "brand": "示例品牌",
  "series": "疾速",
  "aliases": [
    {
      "alias": "Speed 900",
      "aliasType": "official_en"
    }
  ],
  "specs": {
    "weightClasses": ["4U", "5U"],
    "balancePoint": "",
    "balanceType": "head_light",
    "shaftStiffness": "中硬",
    "recommendedTension": "24-28 磅"
  },
  "positioning": {
    "playerLevels": ["进阶", "中高级"],
    "playStyles": ["双打连贯", "平抽挡"],
    "priceBand": "中高价位",
    "sellingFocus": ["挥速快", "连贯好"],
    "limitations": ["后场重杀压迫感弱于头重拍"]
  },
  "sourceIds": ["source_001"]
}
```

### ListRacketProductsQuery

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "filters": {
    "status": ["reviewing", "published"],
    "playStyle": "双打连贯",
    "playerLevel": "进阶",
    "missingSource": false
  },
  "search": "疾速",
  "pagination": {
    "cursor": null,
    "limit": 20
  }
}
```

## Response Shape

### RacketProductView

```json
{
  "id": "racket_001",
  "model": "疾速 900",
  "aliases": ["Speed 900", "疾速900"],
  "specs": {
    "weightClasses": ["4U", "5U"],
    "balancePoint": null,
    "balanceType": "head_light",
    "shaftStiffness": "中硬",
    "recommendedTension": "24-28 磅"
  },
  "positioning": {
    "playerLevels": ["进阶", "中高级"],
    "playStyles": ["双打连贯", "平抽挡"],
    "priceBand": "中高价位",
    "sellingFocus": ["挥速快", "连贯好"],
    "limitations": ["后场重杀压迫感弱于头重拍"]
  },
  "status": "reviewing",
  "sourceSummary": {
    "trustLevel": "official",
    "freshness": "needs_review",
    "missingFields": ["balancePoint"]
  },
  "downstreamReadiness": [
    {
      "workflow": "qa_agent",
      "ready": false,
      "blockedBy": ["not_published", "missing_balance_point"]
    }
  ]
}
```

### ErrorResponse

```json
{
  "error": {
    "code": "ALIAS_CONFLICT",
    "message": "该别名已关联到其他球拍型号",
    "field": "aliases[0].alias",
    "recoverable": true
  }
}
```

## State Machine

```text
draft
  -> needs_source
  -> reviewing
  -> approved
  -> published

reviewing -> conflict
reviewing -> rejected
published -> stale
published -> archived
stale -> reviewing
conflict -> reviewing
```

下游可用规则：

| 状态 | 直播场次 | AI 复盘 | 话术资产 | Q&A Agent |
| --- | --- | --- | --- | --- |
| `draft` | 不可用 | 不可用 | 不可用 | 不可用 |
| `needs_source` | 可作为草稿提示 | 不可用 | 不可用 | 不可用 |
| `reviewing` | 可人工查看 | 不可用 | 不可用 | 不可用 |
| `approved` | 可人工引用 | 可作为候选 | 可作为候选 | 不可用 |
| `published` | 可用 | 可用 | 可用 | 可用 |
| `stale` | 需提示过期 | 不可用 | 需复核 | 不可用 |
| `conflict` | 仅显示冲突 | 不可用 | 不可用 | 不可用 |
| `archived` | 不可用 | 不可用 | 不可用 | 不可用 |
| `rejected` | 不可用 | 不可用 | 不可用 | 不可用 |

## Error Cases

- `VALIDATION_ERROR`：必填字段缺失、枚举非法、字符串过长。
- `DUPLICATE_MODEL`：同租户同团队下型号归一化后重复。
- `ALIAS_CONFLICT`：别名已绑定到其他产品或审核冲突。
- `MISSING_SOURCE`：规格事实缺少可追溯来源。
- `SOURCE_STALE`：来源超过刷新策略。
- `SOURCE_RETRIEVAL_FAILED`：未来公开来源获取失败、网络超时或链接不可用。
- `REVIEW_CONFLICT`：多个 reviewer 对同一事实给出冲突结论。
- `UNAUTHORIZED_TENANT`：actor 访问其他租户或团队数据。
- `FORBIDDEN_ROLE`：角色不允许创建、审核、发布或归档。
- `NOT_FOUND`：目标产品、别名、来源或版本不存在。
- `STATE_TRANSITION_INVALID`：状态流转非法。
- `PARTIAL_IMPORT_FAILED`：未来批量导入部分失败。
- `PROVIDER_UNAVAILABLE`：未来 AI、搜索或外部导入 provider 不可用。
- `SCHEMA_MISMATCH`：未来导入结果或 AI 候选内容不符合契约 shape。
- `AI_SNAPSHOT_UNAVAILABLE`：请求 AI snapshot 时记录未发布或缺审核。

## Authorization

未来权限草案：

| 动作 | 允许角色 |
| --- | --- |
| 查看已发布产品 | operator、host、reviewer、admin |
| 查看草稿和审核队列 | operator、reviewer、admin |
| 创建/编辑草稿 | operator、reviewer、admin |
| 登记来源 | operator、reviewer、admin |
| 审核/发布/标记过期 | reviewer、admin |
| 归档产品 | admin |
| 读取 AI snapshot | 后端服务，仅限同 tenant/team |

所有读写必须按 `tenantId` 和 `teamId` 做服务端授权。UI 隐藏按钮不能替代服务端权限。

## Sensitive Data

敏感级别：

- 产品官方公开规格：低敏，但需要来源和刷新时间。
- 团队讲解经验、价格带、卖点口径：业务敏感。
- 供应商成本价、合同、真实转化数据：高敏，本契约不记录。
- AI snapshot：业务敏感，只传递回答所需最小字段。

日志不得记录完整内部话术、未发布产品策略、供应商信息或未来 prompt 全文。

## Audit Metadata

未来写入和审核记录必须包含：

- `createdBy`、`createdAt`
- `updatedBy`、`updatedAt`
- `reviewedBy`、`reviewedAt`
- `publishedBy`、`publishedAt`
- `sourceIds`
- `publishedVersionId`
- `changeReason`
- `requestId`
- `idempotencyKey`
- `aiRunId`，仅当后续 AI 生成候选内容时使用

## Verification

未来实现本契约时至少验证：

- 单元测试：字段校验、型号归一化、重复检测、别名冲突、状态机。
- 集成测试：创建、编辑、审核、发布、归档、列表查询和权限边界。
- 数据测试：同 tenant/team 去重，不同 team 可隔离。
- 浏览器测试：`/rackets` 在桌面和移动端展示 published、stale、conflict、empty、error。
- AI/RAG 测试：只允许 `published` snapshot grounding，未审核和冲突记录不可用于回答。
- 安全测试：跨租户访问失败，日志不含敏感价格/供应商/内部话术。
- 公开预览：影响页面或声明时检查关键路由 HTTP 200。

## Open Questions

- 后续数据库是否先采用 Drizzle + PostgreSQL，需要单独 OpenSpec 决定。
- 型号归一化规则是否需要品牌级自定义词典。
- 来源刷新策略是否由 reviewer 手动配置，还是按 source type 默认。
- 是否需要支持批量 CSV 导入，以及导入前的 dry-run 冲突报告。
- 是否把价格带做成团队可配置枚举，避免暴露真实成本和利润。
