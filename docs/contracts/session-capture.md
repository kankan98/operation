# Session Capture Contract

Status: draft
Runtime: partially implemented, local-only repository

本契约定义未来直播场次采集的 API、Server Action、Repository、数据库 schema、草稿恢复、
转录导入、问题异议结构化和 AI 复盘输入边界。当前没有任何可调用接口、Server Action、
上传解析、AI 调用、平台同步或面向用户的保存行为；仅有本地-only PostgreSQL/Drizzle schema、
server-only repository 和 `sessions:check` 回滚式验证。

当前本地 runtime 已覆盖：

- `live_session_captures`、`session_host_roles`、`session_product_order`、
  `session_notes`、`customer_questions`、`customer_objections` 表。
- server-only repository 的创建、列表、详情/readiness、草稿 autosave、草稿版本冲突、
  提交到 `review_ready`、重复标题日期冲突、权限和 tenant/team scope。
- 本地验证脚本 `pnpm sessions:check`，在事务内创建 fixture 并回滚。

当前仍未实现：

- `/sessions` 浏览器保存、Route Handler、Server Action、公开 CRUD、生产数据库 provider。
- 转录上传、解析、对象存储、队列、平台导入或抖音/电商同步。
- AI 复盘 snapshot、prompt、provider 调用、RAG 或下游任务/话术创建。

## Use Case

面向直播运营、主播/助播和团队负责人，记录一场羽毛球拍直播的主题、主播分工、
商品讲解顺序、场次笔记、观众问题、购买异议和讲解缺口，让后续 AI 复盘、话术资产和
下场任务能基于经过整理的场次输入工作。

核心目标：

- 避免直播复盘依赖零散聊天记录、个人记忆或未结构化笔记。
- 保留人工录入事实、导入转录、运营总结和 AI 候选输出之间的边界。
- 支持长文本、刷新恢复、部分草稿和重新分析后的可追溯审计。
- 为后续数据库、接口、上传、AI 复盘和任务闭环提供稳定输入。

## Domain Entities

### LiveSessionCapture

未来场次采集主记录。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 场次记录 ID |
| `tenantId` | string | 租户 ID |
| `teamId` | string | 团队 ID |
| `title` | string | 场次主题 |
| `sessionDate` | datetime | 直播日期和时间 |
| `platform` | enum | `douyin`、`kuaishou`、`video_account`、`offline_notes`、`other` |
| `status` | enum | `draft`、`autosaved`、`submitted`、`review_ready`、`processing`、`processed`、`failed`、`archived`、`deleted` |
| `hostIds` | string[] | 主播、助播、场控等人员 ID |
| `summary` | string | 人工场次摘要 |
| `sourceMode` | enum | `manual`、`transcript_import`、`mixed` |
| `lastAutosavedAt` | datetime | 最近草稿保存时间 |
| `createdAt` / `updatedAt` | datetime | 审计时间 |

### SessionHostRole

场次人员和职责。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 角色记录 ID |
| `sessionId` | string | 场次 ID |
| `userId` | string | 用户 ID |
| `displayName` | string | 展示名 |
| `role` | enum | `host`、`assistant`、`operator`、`product_specialist`、`reviewer` |
| `responsibility` | string | 本场负责内容 |

### SessionProductOrder

直播讲解商品顺序。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 顺序记录 ID |
| `sessionId` | string | 场次 ID |
| `racketProductId` | string | 球拍产品 ID，可为空表示临时型号 |
| `displayModel` | string | 当场使用的型号名称 |
| `orderIndex` | number | 讲解顺序 |
| `roleInSession` | enum | `opening_compare`、`main_offer`、`objection_bridge`、`alternative`、`closing_push` |
| `talkingPoints` | string[] | 本场讲解重点 |
| `customerFit` | string[] | 面向人群 |
| `evidenceState` | enum | `linked_product`、`manual_only`、`needs_review` |

### SessionNote

人工场次笔记和结构化段落。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 笔记 ID |
| `sessionId` | string | 场次 ID |
| `noteType` | enum | `opening`、`product_explanation`、`customer_question`、`objection`、`deal_signal`、`gap`、`follow_up` |
| `content` | string | 笔记内容 |
| `source` | enum | `manual`、`transcript_excerpt`、`operator_summary` |
| `sequence` | number | 场次内顺序 |
| `reviewState` | enum | `unreviewed`、`reviewed`、`needs_clarification` |

### CustomerQuestion

观众问题。不得记录个人身份信息。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 问题 ID |
| `sessionId` | string | 场次 ID |
| `questionText` | string | 脱敏后的问题文本 |
| `topic` | enum | `fit`、`tension`、`weight`、`balance`、`price`、`durability`、`comparison`、`after_sales`、`other` |
| `relatedProductIds` | string[] | 相关产品 |
| `answerGiven` | string | 当场回答，可为空 |
| `needsKnowledge` | boolean | 是否暴露知识缺口 |
| `sensitiveRedactionState` | enum | `not_needed`、`redacted`、`needs_review` |

### CustomerObjection

购买异议或成交阻力。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 异议 ID |
| `sessionId` | string | 场次 ID |
| `objectionType` | enum | `price`、`skill_level`、`too_stiff`、`too_head_heavy`、`durability`、`similar_owned`、`trust`、`other` |
| `content` | string | 异议内容 |
| `responseUsed` | string | 当场回应 |
| `resolvedState` | enum | `resolved`、`partially_resolved`、`unresolved`、`unknown` |
| `followUpNeeded` | boolean | 是否需要下场跟进 |

### TranscriptImport

未来转录导入元数据。转录原文可能包含敏感数据，必须单独处理。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 导入记录 ID |
| `sessionId` | string | 场次 ID |
| `sourceType` | enum | `manual_paste`、`file_upload`、`platform_export` |
| `fileName` | string | 文件名，可为空 |
| `contentHash` | string | 内容 hash |
| `sizeBytes` | number | 输入大小 |
| `chunkCount` | number | 分段数量 |
| `importState` | enum | `pending`、`parsed`、`partial`、`failed`、`discarded` |
| `redactionState` | enum | `not_checked`、`redacted`、`needs_review` |
| `errorCode` | string | 失败原因 |

### SessionDownstreamReadiness

面向下游工作流的可用状态。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `sessionId` | string | 场次 ID |
| `workflow` | enum | `ai_review`、`talk_tracks`、`next_actions`、`knowledge_gap` |
| `ready` | boolean | 是否可用 |
| `blockedBy` | string[] | 阻塞原因 |
| `requiredState` | string | 所需场次状态 |

## Commands / Queries

### Commands

未来命令边界：

- `CreateSessionCaptureCommand`
- `UpdateSessionCaptureCommand`
- `AutosaveSessionDraftCommand`
- `SubmitSessionCaptureCommand`
- `ArchiveSessionCaptureCommand`
- `RestoreSessionDraftCommand`
- `AddSessionProductOrderCommand`
- `ReorderSessionProductsCommand`
- `AddCustomerQuestionCommand`
- `AddCustomerObjectionCommand`
- `RegisterTranscriptImportCommand`
- `MarkTranscriptImportFailedCommand`
- `PrepareSessionForAiReviewCommand`

命令必须带 `tenantId`、`teamId`、actor、幂等键或审计上下文。写操作必须做权限检查、
输入校验、草稿冲突检查、敏感数据保护和审计记录。

### Queries

未来查询边界：

- `ListSessionCapturesQuery`
- `GetSessionCaptureDetailQuery`
- `SearchSessionCapturesQuery`
- `ListSessionDraftsQuery`
- `GetSessionDownstreamReadinessQuery`
- `GetSessionCaptureSnapshotForAiReviewQuery`
- `ListSessionKnowledgeGapsQuery`

查询必须按 tenant/team 过滤。AI 复盘 snapshot 只能返回最小必要字段，并排除未经脱敏的
客户个人信息、订单号、手机号、地址和私信原文。

## Request Shape

### CreateSessionCaptureCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "user_001",
  "idempotencyKey": "create-session-001",
  "title": "高端进攻拍对比与中高级球友选择",
  "sessionDate": "2026-05-23T20:00:00+08:00",
  "platform": "douyin",
  "hostRoles": [
    {
      "userId": "user_host_001",
      "role": "host",
      "responsibility": "主讲产品卖点"
    }
  ],
  "productOrder": [
    {
      "racketProductId": "racket_001",
      "displayModel": "疾速 900",
      "orderIndex": 1,
      "roleInSession": "main_offer"
    }
  ],
  "initialNotes": [
    {
      "noteType": "gap",
      "content": "平衡点解释不够清楚"
    }
  ]
}
```

### AutosaveSessionDraftCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "user_001",
  "sessionId": "session_001",
  "draftVersion": 4,
  "clientSavedAt": "2026-05-23T21:15:00+08:00",
  "patch": {
    "summary": "本场围绕中高级进攻拍选择展开",
    "notes": [
      {
        "noteType": "customer_question",
        "content": "双打后场能不能用"
      }
    ]
  }
}
```

### ListSessionCapturesQuery

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "filters": {
    "status": ["draft", "review_ready"],
    "platform": "douyin",
    "hasKnowledgeGap": true
  },
  "search": "高端进攻拍",
  "pagination": {
    "cursor": null,
    "limit": 20
  }
}
```

## Response Shape

### SessionCaptureView

```json
{
  "id": "session_001",
  "title": "高端进攻拍对比与中高级球友选择",
  "sessionDate": "2026-05-23T20:00:00+08:00",
  "platform": "douyin",
  "status": "review_ready",
  "hostRoles": [
    {
      "displayName": "主讲",
      "role": "host",
      "responsibility": "主讲产品卖点"
    }
  ],
  "productOrder": [
    {
      "displayModel": "疾速 900",
      "orderIndex": 1,
      "evidenceState": "linked_product"
    }
  ],
  "questionSummary": {
    "total": 12,
    "needsKnowledge": 3,
    "topTopics": ["tension", "comparison", "price"]
  },
  "draftState": {
    "draftVersion": 4,
    "lastAutosavedAt": "2026-05-23T21:15:00+08:00",
    "hasUnsavedClientChanges": false
  },
  "downstreamReadiness": [
    {
      "workflow": "ai_review",
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
    "code": "STALE_DRAFT_VERSION",
    "message": "草稿已被更新，请刷新后再保存",
    "field": "draftVersion",
    "recoverable": true
  }
}
```

## State Machine

```text
draft
  -> autosaved
  -> submitted
  -> review_ready
  -> processing
  -> processed

draft -> archived
autosaved -> failed
submitted -> failed
review_ready -> archived
processing -> failed
failed -> autosaved
processed -> archived
archived -> deleted
```

下游可用规则：

| 状态 | AI 复盘 | 话术资产 | 下场任务 | 知识缺口 |
| --- | --- | --- | --- | --- |
| `draft` | 不可用 | 不可用 | 不可用 | 不可用 |
| `autosaved` | 不可用 | 不可用 | 不可用 | 可人工查看 |
| `submitted` | 可作为候选 | 不可用 | 不可用 | 可人工查看 |
| `review_ready` | 可用 | 可作为候选 | 可作为候选 | 可用 |
| `processing` | 处理中 | 不可用 | 不可用 | 不可用 |
| `processed` | 可用 | 可用 | 可用 | 可用 |
| `failed` | 需修复 | 不可用 | 不可用 | 可人工查看 |
| `archived` | 只读 | 只读 | 只读 | 只读 |
| `deleted` | 不可用 | 不可用 | 不可用 | 不可用 |

## Long Input Rules

未来实现必须显式处理：

- 空主题、空商品顺序、空问题列表和缺主播信息。
- 部分保存草稿，尤其是移动端刷新或关闭页面。
- 非常长的场次笔记和转录文本，必须分段、限长并保留顺序。
- 混合中文、英文型号和口播别名。
- 重复问题、重复异议和同一问题关联多个型号。
- 编辑已提交内容后重新进入 AI 复盘或任务生成。
- 导入转录时的部分成功、解析失败和敏感数据脱敏状态。

## Error Cases

- `VALIDATION_ERROR`：必填字段缺失、枚举非法、字符串过长。
- `MISSING_REQUIRED_FIELD`：主题、日期、主播或商品顺序缺失。
- `DUPLICATE_SESSION_LABEL`：同团队同日期下场次标题冲突。
- `STALE_DRAFT_VERSION`：客户端草稿版本落后于服务端。
- `LONG_INPUT_LIMIT_EXCEEDED`：笔记或转录超过当前处理上限。
- `TRANSCRIPT_IMPORT_FAILED`：转录导入失败、文件不可读或格式不支持。
- `PARTIAL_TRANSCRIPT_PARSED`：部分转录解析成功，部分失败。
- `SENSITIVE_DATA_NEEDS_REVIEW`：发现手机号、地址、订单号、私信原文等敏感内容。
- `UNAUTHORIZED_TENANT`：actor 访问其他租户或团队数据。
- `FORBIDDEN_ROLE`：角色不允许创建、编辑、提交、归档或读取 AI snapshot。
- `NOT_FOUND`：场次、草稿、问题、异议或导入记录不存在。
- `STATE_TRANSITION_INVALID`：状态流转非法。
- `PROVIDER_UNAVAILABLE`：未来 AI、转录解析或外部导入 provider 不可用。
- `NETWORK_TIMEOUT`：保存、导入或准备复盘时网络超时。
- `AI_SNAPSHOT_UNAVAILABLE`：请求 AI 复盘 snapshot 时记录状态或脱敏状态不满足要求。

## Authorization

未来权限草案：

| 动作 | 允许角色 |
| --- | --- |
| 查看场次列表 | operator、host、reviewer、admin |
| 创建/编辑草稿 | operator、host、admin |
| 提交场次 | operator、host、admin |
| 导入转录 | operator、reviewer、admin |
| 审核敏感内容 | reviewer、admin |
| 归档/删除场次 | admin |
| 读取 AI review snapshot | 后端服务，仅限同 tenant/team |

所有读写必须按 `tenantId` 和 `teamId` 做服务端授权。UI 隐藏按钮不能替代服务端权限。

## Sensitive Data

敏感级别：

- 场次主题、商品顺序、讲解缺口：业务敏感。
- 观众问题和异议：可能包含客户个人信息，默认敏感。
- 转录文本、私信、订单号、手机号、地址：高敏，本契约不允许直接进入普通日志或 AI
  snapshot。
- AI review snapshot：业务敏感，只传递复盘所需最小字段。

日志不得记录完整转录、客户个人信息、订单信息、私信原文、内部成交策略或未来 prompt
全文。

## Audit Metadata

未来写入、导入和提交记录必须包含：

- `createdBy`、`createdAt`
- `updatedBy`、`updatedAt`
- `submittedBy`、`submittedAt`
- `archivedBy`、`archivedAt`
- `draftVersion`
- `lastAutosavedAt`
- `transcriptImportId`
- `requestId`
- `idempotencyKey`
- `aiRunId`，仅当后续 AI 复盘使用该场次快照时记录

## Verification

未来实现本契约时至少验证：

- 单元测试：字段校验、草稿版本冲突、状态机、长文本限长、敏感字段检测。
- 集成测试：创建、自动保存、恢复草稿、提交、归档、列表查询、转录导入失败和权限边界。
- 数据测试：同 tenant/team 查询隔离，不同 team 不互相可见。
- 浏览器测试：`/sessions` 在桌面和移动端展示 empty、draft、autosaved、failed、review ready
  和长文本溢出状态。
- AI 输入测试：只允许脱敏且状态满足要求的 session snapshot 进入 AI 复盘。
- 安全测试：跨租户访问失败，日志不含客户个人信息、转录全文、私信、订单号或内部话术。
- 公开预览：影响页面或声明时检查关键路由 HTTP 200。

## Open Questions

- 后续草稿自动保存采用 Server Action、Route Handler 还是专门 repository，需要单独 OpenSpec 决定。
- 转录文本是否需要对象存储、队列和异步解析。
- 长文本 chunk 上限、保留期限和脱敏策略由哪个配置控制。
- 是否允许从抖音或其他平台导入公开/私域数据，需要先确认官方 API、权限和数据范围。
- 是否需要把问题和异议直接转成知识缺口候选，还是先进入 AI 复盘流程。
