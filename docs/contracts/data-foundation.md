# Data Foundation Contract

Status: draft
Runtime: partially implemented, local-only

本契约定义未来 PostgreSQL、Drizzle schema/migration、schema validation、repository、
transaction、tenant/team ownership、审计字段、幂等、归档、分页、敏感数据和日志边界。
当前已具备本地-only 数据基础 runtime：Drizzle/PostgreSQL schema、首个 migration、Zod
边界校验、server-only database client、repository 原语、审计/幂等基础表和本地验证脚本。
它不包含面向用户的业务持久化、Route Handler、Server Action、登录授权、生产数据库 provider
或公网预览数据保存能力。

## Use Case

面向直播运营、主播/助播、商品负责人、审核人员和团队负责人，让未来保存的球拍产品、
直播场次、知识来源、AI 复盘、Q&A 答案、话术资产和下场任务都能被可靠读取、恢复、审核、
追溯和隔离。

核心目标：

- 为真实保存功能建立统一数据边界，避免每个页面各自设计表结构和错误处理。
- 确保受保护业务数据默认带 tenant/team ownership、actor、审计时间和归档状态。
- 让 AI run、RAG snapshot、反馈、来源版本和下游话术/任务能引用稳定 record ID。
- 避免 UI、组件、prompt 或 AI 输出直接决定数据库 shape。
- 为后续 Drizzle migration、repository tests、tenant isolation tests 和长文本处理提供验证基线。

## Implemented Local Runtime Surface

当前本地实现范围：

- `apps/web/drizzle.config.ts` 定义 Drizzle/PostgreSQL migration 配置。
- `apps/web/src/server/db/schema.ts` 定义 tenants、teams、app users、tenant memberships、
  team memberships、role permissions、data audit events 和 idempotency records。
- `apps/web/src/server/db/migrations/` 保存首个已生成 migration。
- `apps/web/src/server/db/env.ts`、`client.ts`、`context.ts`、`repository.ts` 和 `errors.ts`
  提供环境校验、server-only 连接、数据访问上下文、审计/幂等 repository 原语和脱敏错误。
- `apps/web/src/server/db/check.ts` 提供本地 PostgreSQL 回滚式 smoke check。
- 根级 `db:generate`、`db:migrate`、`db:check` 脚本代理到 web app。
- `docker-compose.yml` 的 `db` profile 提供本地 PostgreSQL 开发服务；该服务不等于公网预览
  或生产数据库。

当前仍未实现：

- 登录、session、Auth provider、受保护路由和 server-side authorization runtime。
- 产品、场次、知识、AI 复盘、Q&A、话术、下场任务、反馈、导出或来源审核的业务表和 CRUD。
- API Route、Route Handler、Server Action 或 UI 保存流程。
- RLS policy、托管数据库、连接池、备份恢复、监控告警和生产 secret 管理。

## Stage Gates

本契约已经有阶段 3 的本地运行时基础，但仍必须按技术实施路线分阶段扩展：

| 阶段 | 可实现内容 | 不能提前做的事 |
| --- | --- | --- |
| 阶段 2 | `AuthPort`、`AuthContext`、server-side guard、tenant/team/role 契约 | 保存受保护数据前跳过授权 |
| 阶段 3 | PostgreSQL、Drizzle schema/migration、schema validation、repository、审计和事务；当前已本地部分实现 | UI 直接读写数据库、从页面状态反推表结构、把本地 DB 当生产 DB |
| 阶段 4 | 产品、场次、知识、话术、任务 tenant-scoped CRUD | 每个 workflow 自定义不兼容的审计/归档/分页规则 |
| 阶段 5-8 | AI review、Q&A、RAG、反馈和评测引用稳定 record ID 和 snapshot | AI 输出直接覆盖人工事实或权威知识 |
| 阶段 9 | 队列、对象存储、观测、备份、外部集成和正式部署 provider | 无备份、日志脱敏和恢复策略就处理真实生产数据 |

## Runtime Boundary

未来实现必须保留这条调用方向：

```text
UI/page/component
  -> Route Handler or thin Server Action
  -> Domain service
  -> Repository interface
  -> Drizzle/PostgreSQL adapter
```

规则：

- UI 不直接调用 Drizzle、SQL client、PostgreSQL driver 或 migration 工具。
- Server Action 只做薄 mutation wrapper，不拥有业务规则、SQL、事务或权限判断。
- Route Handler/API 边界接收 request、解析 auth、调用 domain/repository，并返回 view model。
- Repository 接收 `AuthContext` 或 guard result、validated input、request ID、transaction options。
- Drizzle schema 和 migration 是数据库结构 source of truth；UI 静态数据不是。
- RLS 可作为 defense-in-depth 评估，但不能替代应用层 server-side authorization。

## Domain Entities

### DatabaseRuntimeBoundary

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `databaseProvider` | enum | `local_postgres`、`managed_postgres`、`unknown` |
| `orm` | enum | `drizzle` |
| `migrationMode` | enum | `generated`、`manual_reviewed`、`hotfix_reviewed` |
| `validationMode` | enum | `zod`、`equivalent_schema` |
| `runtimeStatus` | enum | `not_implemented`、`local_only`、`preview`、`production` |
| `connectionPolicy` | enum | `direct`、`pooled`、`serverless_safe`、`unknown` |

### TenantScopedRecord

所有受保护业务记录的基础 ownership 语义。实际表可以展开字段，但不能丢失语义。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 稳定记录 ID |
| `tenantId` | string | 租户 ID |
| `teamId` | string | 团队 ID |
| `recordType` | enum | `racket_product`、`live_session`、`knowledge_source`、`knowledge_version`、`ai_review_run`、`qa_answer`、`talk_track`、`next_task`、`feedback`、`export`、`audit_event` |
| `visibility` | enum | `tenant`、`team`、`own_records`、`public_reference` |
| `state` | enum | `draft`、`active`、`reviewing`、`published`、`archived`、`deleted`、`failed` |
| `createdAt` / `updatedAt` | datetime | 审计时间 |

### AuditFields

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `createdBy` | string | 创建 actor |
| `updatedBy` | string | 最近更新 actor |
| `reviewedBy` | string | 审核 actor，可为空 |
| `archivedBy` | string | 归档 actor，可为空 |
| `deletedBy` | string | 删除 actor，可为空 |
| `requestId` | string | 请求 ID |
| `sourceRecordId` | string | 来源记录 ID，可为空 |
| `sourceVersionId` | string | 来源版本 ID，可为空 |
| `aiRunId` | string | AI run ID，可为空 |
| `promptVersion` | string | prompt 版本，可为空 |

### SchemaMigration

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | migration ID |
| `name` | string | migration 名称 |
| `status` | enum | `draft`、`generated`、`reviewed`、`applied`、`failed`、`rolled_back` |
| `checksum` | string | migration 内容校验 |
| `appliedAt` | datetime | 应用时间，可为空 |
| `rollbackNotes` | string | 回滚或恢复说明 |
| `affectedTables` | string[] | 影响表 |
| `verification` | string[] | 验证命令或检查项 |

### ValidationSchema

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | schema ID |
| `schemaName` | string | schema 名称 |
| `schemaVersion` | string | schema 版本 |
| `boundary` | enum | `api_input`、`repository_input`、`repository_output`、`ai_output`、`import_payload`、`export_payload` |
| `status` | enum | `draft`、`active`、`deprecated` |
| `compatibleWith` | string[] | 兼容的 migration、prompt 或 API 版本 |

### RepositoryTransaction

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | transaction ID 或 request-scoped reference |
| `requestId` | string | 请求 ID |
| `tenantId` / `teamId` | string | 作用域 |
| `actorId` | string | 当前 actor |
| `operations` | string[] | 事务内操作 |
| `status` | enum | `pending`、`committed`、`rolled_back`、`failed` |
| `failureReason` | string | 失败原因，可为空 |

### IdempotencyRecord

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 幂等记录 ID |
| `idempotencyKey` | string | 客户端或服务端生成的幂等键 |
| `requestHash` | string | 请求摘要，不能包含原始敏感 payload |
| `tenantId` / `teamId` | string | 作用域 |
| `actorId` | string | actor |
| `targetType` / `targetId` | string | 目标记录 |
| `status` | enum | `pending`、`completed`、`conflict`、`expired` |
| `expiresAt` | datetime | 过期时间 |

### SoftArchiveState

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `archiveState` | enum | `active`、`archived`、`deleted`、`restore_requested` |
| `archivedAt` / `deletedAt` | datetime | 归档/删除时间，可为空 |
| `reason` | string | 归档、删除或恢复原因 |
| `retentionUntil` | datetime | 保留到期时间，可为空 |

### DataAccessPolicy

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | policy ID |
| `targetType` | enum | `product`、`session`、`knowledge`、`ai_review`、`qa_answer`、`talk_track`、`next_task`、`feedback`、`export` |
| `action` | enum | `create`、`read`、`update`、`archive`、`restore`、`delete`、`review`、`export` |
| `requiredPermission` | string | 所需权限 |
| `scope` | enum | `tenant`、`team`、`own_records` |
| `sensitiveDataLevel` | enum | `low`、`business_sensitive`、`customer_sensitive`、`secret` |

### DataAuditEvent

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 审计事件 ID |
| `eventType` | enum | `record_created`、`record_updated`、`record_archived`、`record_restored`、`record_deleted`、`migration_applied`、`migration_failed`、`validation_failed`、`authorization_denied`、`export_requested` |
| `actorId` | string | actor |
| `tenantId` / `teamId` | string | 作用域 |
| `targetType` / `targetId` | string | 目标记录 |
| `requestId` | string | 请求 ID |
| `metadata` | object | 脱敏元数据 |
| `createdAt` | datetime | 事件时间 |

## Commands / Queries

### Commands

- `RunSchemaMigrationCommand`
- `CreateTenantScopedRecordCommand`
- `UpdateTenantScopedRecordCommand`
- `ArchiveTenantScopedRecordCommand`
- `RestoreTenantScopedRecordCommand`
- `DeleteTenantScopedRecordCommand`
- `CreateIdempotencyRecordCommand`
- `RecordDataAuditEventCommand`
- `ValidateDataBoundaryCommand`
- `RunRepositoryTransactionCommand`

命令必须带 `requestId`、actor、tenant/team 作用域、validated input、幂等键或事务上下文。写操作必须
做权限检查、状态机检查、审计记录和敏感数据保护。

### Queries

- `GetTenantScopedRecordQuery`
- `ListTenantScopedRecordsQuery`
- `SearchTenantScopedRecordsQuery`
- `GetMigrationStatusQuery`
- `GetDataAuditEventsQuery`
- `GetIdempotencyRecordQuery`
- `CheckDataAccessPolicyQuery`

查询必须带 tenant/team scope 和 authorization result。列表查询必须定义 pagination、sort、filter 和
归档记录是否包含。

## Request Shape

未来数据命令的通用 shape：

```ts
type DataCommandRequest<TInput> = {
  requestId: string;
  authContext: AuthContext;
  tenantId: string;
  teamId: string;
  idempotencyKey?: string;
  input: TInput;
  validationSchemaId: string;
  transactionMode?: "none" | "required" | "join_existing";
};
```

未来数据查询的通用 shape：

```ts
type DataQueryRequest<TFilter> = {
  requestId: string;
  authContext: AuthContext;
  tenantId: string;
  teamId: string;
  filter: TFilter;
  pagination?: {
    cursor?: string;
    limit: number;
  };
  includeArchived?: boolean;
};
```

## Response Shape

```ts
type DataCommandResponse<TRecord> =
  | {
      ok: true;
      record: TRecord;
      auditEventId: string;
      idempotencyStatus?: "created" | "replayed";
    }
  | {
      ok: false;
      errorCode: DataErrorCode;
      message: string;
      requestId: string;
      retryable: boolean;
    };
```

列表查询必须返回 `items`、`nextCursor`、`totalEstimate` 或明确说明不提供总数。错误响应不得暴露 SQL、
连接串、完整 payload、secret、prompt 或客户个人信息。

## State Machine

### Record State

- `draft -> active`
- `draft -> archived`
- `active -> reviewing`
- `reviewing -> active`
- `reviewing -> published`
- `active -> archived`
- `published -> archived`
- `archived -> active`
- `archived -> deleted`
- `failed -> archived`

### Migration State

- `draft -> generated`
- `generated -> reviewed`
- `reviewed -> applied`
- `reviewed -> failed`
- `applied -> rolled_back`
- `failed -> reviewed`

### Idempotency State

- `pending -> completed`
- `pending -> conflict`
- `completed -> expired`
- `conflict -> expired`

## Error Cases

| 错误码 | 场景 | 处理 |
| --- | --- | --- |
| `VALIDATION_FAILED` | 输入、AI 输出或 import payload 不符合 schema | 返回字段级错误，不保存 |
| `AUTH_REQUIRED` | 缺少认证上下文 | 拒绝命令/查询 |
| `TENANT_SCOPE_REQUIRED` | 缺少 tenant/team | 拒绝命令/查询 |
| `FORBIDDEN_SCOPE` | actor 无权访问目标记录 | 拒绝并记录授权失败 |
| `RECORD_NOT_FOUND` | 记录不存在或不可见 | 返回 not found，不泄露跨团队存在性 |
| `DUPLICATE_KEY` | 唯一约束冲突，例如型号别名重复 | 返回可操作错误 |
| `IDEMPOTENCY_CONFLICT` | 相同幂等键对应不同请求 | 拒绝并记录 |
| `MIGRATION_FAILED` | migration 应用失败 | 阻断发布，保留恢复说明 |
| `TRANSACTION_CONFLICT` | 死锁、锁等待、并发写冲突 | 回滚，按 retryable 标记 |
| `LONG_TEXT_TOO_LARGE` | 长文本超过限制 | 拒绝或转对象存储前置设计 |
| `SENSITIVE_DATA_BLOCKED` | 日志、导出或 prompt 含禁止数据 | 阻断输出并记录脱敏事件 |
| `AUDIT_WRITE_FAILED` | 审计写入失败 | 写操作默认失败，除非未来设计允许补偿 |

## Authorization

- 所有 protected command/query 必须先解析 `AuthContext`。
- Repository 必须接收 tenant/team scope，不能信任客户端传入的 team selector。
- 查询必须按 tenant/team 过滤；跨团队访问返回 `RECORD_NOT_FOUND` 或 `FORBIDDEN_SCOPE`，不能泄露记录存在性。
- 角色权限来自 `auth-team-tenant` 契约，例如 `manage_products`、`capture_session`、`review_knowledge`、
  `run_ai_review`、`ask_qa`、`manage_talk_tracks`、`manage_next_tasks`、`export_data`。
- RLS 可以作为数据库层 defense-in-depth，但应用层 guard 和 repository scope 仍是必需。

## Sensitive Data

默认敏感：

- 客户评论、私信、订单、电话、地址。
- 直播 transcript、运营笔记、GMV、转化率、价格策略、供应商和库存信息。
- prompt、AI output、knowledge snapshot、source extraction、评测样例。
- provider credentials、database URL、session token、invitation secret。

日志规则：

- 使用 `requestId`、`recordId`、`runId`，避免完整 payload。
- 不记录完整 transcript、完整 prompt、完整客户消息或导出内容。
- migration/error 日志不得包含数据库 URL、密码、token 或 cookie。

## Audit Metadata

未来所有受保护写操作至少记录：

- `requestId`
- `actorId`
- `tenantId`
- `teamId`
- `targetType`
- `targetId`
- `action`
- `previousState`
- `nextState`
- `createdAt`
- 脱敏 `metadata`

AI/RAG 相关记录还必须能引用：

- `aiRunId`
- `promptVersion`
- `knowledgeSnapshotId`
- `sourceVersionId`
- `validationSchemaId`
- `reviewDecisionId`

## Verification

未来运行时实现必须继续覆盖：

- migration dry run、重复运行、失败恢复或回滚说明。
- repository unit/integration tests。
- tenant/team isolation tests。
- role permission tests。
- validation schema tests。
- idempotency replay/conflict tests。
- transaction rollback tests。
- pagination、sort、filter、includeArchived tests。
- soft archive/restore/delete tests。
- audit event tests。
- sensitive log redaction tests。
- long text、empty input、duplicate alias、mixed Chinese/English model name tests。
- AI output malformed/schema mismatch persistence-blocking tests。

## Open Questions

- 第一版本地数据库 runtime 已从 auth/team core tables、audit events 和 idempotency records 开始。
- managed PostgreSQL provider、连接池、备份策略、迁移执行环境和 secret 管理方式尚未确定。
- RLS 是否在第一版 runtime 开启，还是等 application guard 和 repository tests 稳定后作为 defense-in-depth。
- 审计事件、AI snapshot、归档记录、idempotency key 和导出记录的保留周期需要业务确认。
- 长文本是否全部存在 PostgreSQL，还是在阶段 9 引入对象存储后按大小分层保存。
