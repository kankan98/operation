# AI Review Run Contract

Status: draft
Runtime: partially implemented, local-only

本契约定义未来 AI 复盘运行的 API、Server Action、domain service、provider adapter、
结构化输出、人工审核、反馈记录和下游资产创建边界。当前已具备本地-only Drizzle schema、
server-only repository、回滚式 `ai-review:check` 验证、本地 AI review run 账本、
server-only `AiProviderPort` / DeepSeek adapter / `ai-provider:check` provider gate，以及
server-only AI review generation orchestrator / `ai-review:generation-check` 本地验证，以及
server-only AI review execution service / `ai-review:execution-check` 本地验证；仍没有任何对外
可调用接口、Server Action、RAG 检索、队列、UI 保存流程、生产 AI 发布或自动任务创建。

## Runtime Status

已本地落地：

- `ai_review_runs`
- `ai_review_input_snapshots`
- `ai_review_knowledge_snapshots`
- `ai_review_prompt_versions`
- `ai_provider_invocations`
- `ai_review_outputs`
- `ai_review_sections`
- `ai_review_validation_results`
- `ai_review_decisions`
- `ai_review_feedback_signals`
- `ai_review_downstream_artifacts`
- `apps/web/src/server/ai-review/repository.ts`
- `apps/web/src/server/ai-review/check.ts`
- `pnpm ai-review:check`
- `apps/web/src/server/ai-provider/*`
- `pnpm ai-provider:check`
- `apps/web/src/server/ai-review/generation.ts`
- `apps/web/src/server/ai-review/generation-check.ts`
- `pnpm ai-review:generation-check`
- `apps/web/src/server/ai-review/execution.ts`
- `apps/web/src/server/ai-review/execution-check.ts`
- `pnpm ai-review:execution-check`

当前边界：

- 只在本地开发数据库中验证 repository 行为，不代表生产数据库或公开保存流程。
- 只记录 provider invocation metadata，不保存完整 prompt、完整 provider request/response、
  完整转录、客户个人信息、订单信息或密钥。
- DeepSeek provider gate 已本地落地为 `AiProviderPort` adapter：默认 base URL
  `https://api.deepseek.com`、模型 `deepseek-v4-pro`、JSON output schema validation、timeout /
  rate limit / auth / unavailable / malformed output / partial output 归一化错误和日志脱敏。
- API key 必须通过环境变量 `DEEPSEEK_API_KEY` 配置，不能写入代码、文档、OpenSpec、日志、
  截图或最终报告；`.env.example` 只允许保留占位变量名。
- `ai-provider:check` 默认只用 fake fetch 验证，不消耗 provider 额度；只有显式设置
  `DEEPSEEK_API_KEY` 且 `DEEPSEEK_LIVE_SMOKE=1` 时才允许最小 live smoke。
- AI review generation orchestrator 已本地落地为 server-only AI 层：接收已脱敏输入快照和
  已审核知识快照，经 `AiProviderPort` 生成结构化复盘建议，执行 prompt fingerprint、
  output schema validation、source grounding/sensitive/stale/conflict/long input validation，
  并把 provider timeout / rate limit / refusal / partial / malformed / schema mismatch 映射成安全错误。
- `ai-review:generation-check` 默认只用 fake provider 验证，不消耗 provider 额度，不读取真实
  API key，也不打印完整 prompt、provider payload、原始转录或敏感数据。
- AI review execution service 已本地落地为 server-only AI 层：加载 tenant/team-scoped run ledger，
  通过 repository start gate 启动 run，调用 generation orchestrator，记录 provider invocation metadata、
  结构化输出、validation results，并且只在无 failed/blocked 校验时标记 `review_ready`。
- `ai-review:execution-check` 默认只用 fake provider 验证，不消耗 provider 额度，不读取真实
  API key；它覆盖成功执行、validation_failed、provider_failed、跨团队隔离、事务回滚和无
  prompt/secret 泄漏。
- 后续 RAG snapshot、重试策略、队列、公开 API、Server Action、UI 保存、生产 AI 发布和
  自动下游创建仍必须单独创建 OpenSpec。

## Use Case

面向直播运营、主播/助播、审核人员和团队负责人，把已经整理的直播场次输入、已审核球拍
产品知识、已发布知识版本和团队经验，转成可人工审核的复盘建议。

核心目标：

- 帮助运营更快得到直播摘要、商品讲解诊断、观众问题聚类、异议模式、话术改进、短视频
  选题和下场任务草案。
- 保留人工事实、已审核知识、prompt version、provider 结果、AI 建议、人工审核和反馈之间
  的边界。
- 防止未脱敏输入、未审核知识、过期/冲突来源、格式异常输出或模型拒绝被当成可用建议。
- 为后续数据库、API、AI provider 调用编排、RAG snapshot、话术资产和下场任务闭环提供稳定契约。

## Domain Entities

### AiReviewRun

未来 AI 复盘运行主记录。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | AI 复盘运行 ID |
| `tenantId` | string | 租户 ID |
| `teamId` | string | 团队 ID |
| `sessionId` | string | 场次 ID |
| `status` | enum | `draft`、`input_ready`、`blocked`、`queued`、`generating`、`provider_failed`、`validating`、`validation_failed`、`review_ready`、`reviewing`、`accepted`、`partially_accepted`、`rejected`、`regeneration_requested`、`regenerated`、`downstream_ready`、`archived` |
| `runType` | enum | `initial_review`、`regeneration`、`section_regeneration`、`manual_import` |
| `parentRunId` | string | 重新生成时的父 run ID，可为空 |
| `inputSnapshotId` | string | 场次输入快照 ID |
| `knowledgeSnapshotId` | string | 知识快照 ID |
| `promptVersionId` | string | Prompt 版本 ID |
| `providerInvocationId` | string | Provider 调用元数据 ID，可为空 |
| `createdAt` / `updatedAt` | datetime | 审计时间 |

### SessionReviewInputSnapshot

AI 复盘使用的最小场次输入快照。不得直接包含未经脱敏的完整转录、私信、订单号、手机号或
地址。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 输入快照 ID |
| `sessionId` | string | 场次 ID |
| `sessionStatus` | enum | 来自 `session-capture` 的场次状态 |
| `title` | string | 场次主题 |
| `sessionDate` | datetime | 直播时间 |
| `platform` | enum | 直播平台 |
| `hostRoles` | object[] | 主播、助播、运营、商品负责人等角色摘要 |
| `productOrder` | object[] | 讲解商品顺序和当场角色 |
| `operatorSummary` | string | 人工场次摘要 |
| `questionSummaries` | object[] | 脱敏后的观众问题摘要 |
| `objectionSummaries` | object[] | 购买异议摘要 |
| `noteHighlights` | object[] | 关键笔记片段，不含完整敏感原文 |
| `redactionState` | enum | `not_needed`、`redacted`、`needs_review`、`blocked` |
| `longInputPolicy` | enum | `within_limit`、`chunked`、`truncated_with_notice`、`blocked` |
| `createdAt` | datetime | 快照创建时间 |

### AiReviewKnowledgeSnapshot

AI 复盘使用的已审核知识快照。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 知识快照 ID |
| `knowledgeVersionIds` | string[] | 已发布知识版本 ID |
| `racketProductVersionIds` | string[] | 已发布或可候选引用的产品版本 ID |
| `sourceIds` | string[] | 来源 ID |
| `trustSummary` | object | 来源可信等级、数量和刷新状态摘要 |
| `conflictState` | enum | `none`、`low_risk`、`blocked` |
| `freshnessState` | enum | `current`、`stale_warning`、`stale_blocked` |
| `reviewState` | enum | `published_only`、`approved_candidates`、`insufficient`、`blocked` |
| `intendedUse` | string[] | `recap`、`product_diagnosis`、`objection_reply`、`talk_track`、`short_video_topic`、`next_action` |

### AiReviewPromptVersion

未来 prompt 版本记录。Prompt 全文属于业务敏感内容，不应进入普通日志。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | Prompt 版本 ID |
| `name` | string | 版本名 |
| `version` | string | 语义版本或日期版本 |
| `purpose` | enum | `full_review`、`section_regeneration`、`validation` |
| `inputSchemaVersion` | string | 输入 schema 版本 |
| `outputSchemaVersion` | string | 输出 schema 版本 |
| `modelPolicy` | string | 模型策略说明，不绑定 UI 层 |
| `status` | enum | `draft`、`reviewed`、`active`、`deprecated` |
| `reviewedBy` | string | 审核人 |
| `reviewedAt` | datetime | 审核时间 |

### AiProviderInvocation

未来 provider 调用元数据。具体 SDK/API 细节必须隐藏在 `AiProviderPort` 后。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | Provider 调用 ID |
| `provider` | string | 例如 `deepseek` 或 `openai`，不得泄露密钥 |
| `providerApi` | string | 例如 `chat_completions` 或 `responses` |
| `model` | string | 模型标识 |
| `requestId` | string | 内部请求 ID |
| `responseId` | string | Provider 响应 ID，可为空 |
| `startedAt` / `finishedAt` | datetime | 调用时间 |
| `latencyMs` | number | 延迟 |
| `tokenUsage` | object | 输入/输出 token 摘要，可为空 |
| `finishReason` | string | 完成原因 |
| `errorCode` | string | Provider 错误码，可为空 |

### AiReviewOutput

结构化 AI 复盘输出。所有字段都是待审核建议，不是事实。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 输出 ID |
| `runId` | string | AI run ID |
| `schemaVersion` | string | 输出 schema 版本 |
| `sections` | `AiReviewSection[]` | 结构化输出区块 |
| `overallConfidence` | enum | `high`、`medium`、`low`、`unknown` |
| `evidenceSummary` | object | 使用的输入和知识摘要 |
| `createdAt` | datetime | 生成时间 |

### AiReviewSection

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 区块 ID |
| `sectionType` | enum | `live_recap`、`product_diagnosis`、`question_cluster`、`objection_pattern`、`talk_track_candidate`、`short_video_topic`、`next_session_action` |
| `title` | string | 区块标题 |
| `summary` | string | 建议内容摘要 |
| `items` | object[] | 结构化建议项 |
| `sourceRefs` | string[] | 输入快照、知识版本或来源引用 |
| `confidence` | enum | `high`、`medium`、`low`、`unknown` |
| `reviewState` | enum | `pending`、`accepted`、`edited`、`rejected`、`regenerate_requested` |

### AiReviewValidationResult

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 校验记录 ID |
| `runId` | string | AI run ID |
| `checkType` | enum | `schema`、`empty_section`、`source_grounding`、`stale_source`、`sensitive_data`、`fact_conflict`、`long_input`、`policy` |
| `status` | enum | `passed`、`warning`、`failed`、`blocked` |
| `message` | string | 面向审核人员的说明 |
| `affectedSectionIds` | string[] | 受影响区块 |
| `recoverable` | boolean | 是否可重试或人工处理 |

### AiReviewDecision

人工审核结论。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 审核决定 ID |
| `runId` | string | AI run ID |
| `targetType` | enum | `run`、`section`、`item` |
| `targetId` | string | 被审核对象 ID |
| `decision` | enum | `accept`、`edit_accept`、`reject`、`request_regeneration`、`mark_needs_source` |
| `reason` | string | 审核原因 |
| `editedContent` | object | 编辑后的结构化内容，可为空 |
| `reviewedBy` | string | 审核人 |
| `reviewedAt` | datetime | 审核时间 |

### AiReviewFeedbackSignal

未来质量信号，不直接改写权威知识。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 反馈 ID |
| `runId` | string | AI run ID |
| `sectionId` | string | 区块 ID，可为空 |
| `signalType` | enum | `accepted`、`edited`、`rejected`、`regenerated`、`missing_knowledge`、`wrong_source`、`evidence_weak`、`downstream_used` |
| `reason` | string | 原因 |
| `reviewPriority` | enum | `low`、`normal`、`high`、`urgent` |
| `routesTo` | enum | `evaluation_set`、`knowledge_review`、`prompt_review`、`none` |

### AiReviewDownstreamArtifact

由已审核建议创建的下游草案。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 下游草案 ID |
| `runId` | string | 来源 AI run |
| `sectionId` | string | 来源区块 |
| `artifactType` | enum | `talk_track`、`short_video_topic`、`next_session_task`、`knowledge_gap` |
| `status` | enum | `draft`、`reviewing`、`accepted`、`archived` |
| `createdBy` | string | 创建人 |
| `createdAt` | datetime | 创建时间 |

## Commands / Queries

### Commands

未来命令边界：

- `PrepareAiReviewRunCommand`
- `StartAiReviewRunCommand`
- `RecordAiProviderInvocationCommand`
- `ValidateAiReviewOutputCommand`
- `RecordAiReviewDecisionCommand`
- `RequestAiReviewRegenerationCommand`
- `RecordAiReviewFeedbackSignalCommand`
- `CreateAiReviewDownstreamArtifactCommand`
- `ArchiveAiReviewRunCommand`

命令必须带 `tenantId`、`teamId`、actor、幂等键或审计上下文。写操作必须做权限检查、
输入校验、状态机检查、敏感数据检查和审计记录。

### Queries

未来查询边界：

- `ListAiReviewRunsQuery`
- `GetAiReviewRunDetailQuery`
- `GetAiReviewRunTimelineQuery`
- `GetAiReviewOutputForReviewQuery`
- `ListAiReviewValidationResultsQuery`
- `ListAiReviewFeedbackSignalsQuery`
- `GetAiReviewDownstreamReadinessQuery`

查询必须按 tenant/team 过滤。普通 UI 不得返回完整 prompt、完整 provider 请求体、完整转录、
客户个人信息或未脱敏敏感数据。

## Request Shape

### PrepareAiReviewRunCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "user_001",
  "idempotencyKey": "prepare-ai-review-001",
  "sessionId": "session_001",
  "requestedSections": [
    "live_recap",
    "product_diagnosis",
    "question_cluster",
    "objection_pattern",
    "talk_track_candidate",
    "short_video_topic",
    "next_session_action"
  ],
  "knowledgePolicy": {
    "allowApprovedCandidates": true,
    "excludeStale": true,
    "excludeConflicts": true
  }
}
```

### StartAiReviewRunCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "user_001",
  "idempotencyKey": "start-ai-review-001",
  "runId": "airun_001",
  "promptVersionId": "prompt_ai_review_v1",
  "providerPolicy": {
    "provider": "deepseek",
    "providerApi": "chat_completions",
    "model": "deepseek-v4-pro",
    "structuredOutputRequired": true
  }
}
```

### RecordAiReviewDecisionCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "reviewer_001",
  "runId": "airun_001",
  "targetType": "section",
  "targetId": "section_talk_track_001",
  "decision": "edit_accept",
  "reason": "保留建议结构，调整成主播常用表达",
  "editedContent": {
    "summary": "先用打法场景开头，再讲规格差异"
  }
}
```

## Response Shape

### AiReviewRunView

```json
{
  "id": "airun_001",
  "sessionId": "session_001",
  "status": "review_ready",
  "runType": "initial_review",
  "inputSummary": {
    "sessionTitle": "高端进攻拍对比与中高级球友选择",
    "productCount": 3,
    "questionCount": 12,
    "redactionState": "redacted"
  },
  "knowledgeSummary": {
    "knowledgeVersionCount": 8,
    "sourceCount": 5,
    "freshnessState": "current",
    "conflictState": "none"
  },
  "outputSummary": {
    "sectionCount": 7,
    "overallConfidence": "medium",
    "validationStatus": "warning"
  },
  "reviewSummary": {
    "pending": 5,
    "accepted": 1,
    "edited": 1,
    "rejected": 0
  }
}
```

### AiReviewOutputView

```json
{
  "runId": "airun_001",
  "sections": [
    {
      "sectionId": "section_question_cluster_001",
      "sectionType": "question_cluster",
      "title": "观众问题聚类",
      "summary": "观众主要围绕发力、磅数、双打适配和价格对比提问。",
      "sourceRefs": ["session_question_001", "knowledge_version_003"],
      "confidence": "medium",
      "reviewState": "pending"
    }
  ],
  "validationResults": [
    {
      "checkType": "source_grounding",
      "status": "warning",
      "message": "部分异议回应缺少已审核团队经验",
      "recoverable": true
    }
  ]
}
```

### ErrorResponse

```json
{
  "error": {
    "code": "AI_OUTPUT_SCHEMA_MISMATCH",
    "message": "复盘结果格式异常，请重新生成或人工处理",
    "field": "sections",
    "recoverable": true
  }
}
```

## State Machine

```text
draft
  -> input_ready
  -> queued
  -> generating
  -> validating
  -> review_ready
  -> reviewing
  -> accepted
  -> downstream_ready

input_ready -> blocked
queued -> provider_failed
generating -> provider_failed
validating -> validation_failed
review_ready -> rejected
review_ready -> regeneration_requested
regeneration_requested -> queued
accepted -> archived
partially_accepted -> archived
rejected -> archived
downstream_ready -> archived
```

下游可用规则：

| 状态 | 话术资产 | 短视频选题 | 下场任务 | 知识反馈 | 评测集 |
| --- | --- | --- | --- | --- | --- |
| `draft` | 不可用 | 不可用 | 不可用 | 不可用 | 不可用 |
| `input_ready` | 不可用 | 不可用 | 不可用 | 可记录阻塞原因 | 不可用 |
| `blocked` | 不可用 | 不可用 | 不可用 | 可生成缺口 | 不可用 |
| `generating` | 不可用 | 不可用 | 不可用 | 不可用 | 不可用 |
| `provider_failed` | 不可用 | 不可用 | 不可用 | 可记录错误 | 可作为失败样本 |
| `validation_failed` | 不可用 | 不可用 | 不可用 | 可记录错误 | 可作为失败样本 |
| `review_ready` | 可作为候选 | 可作为候选 | 可作为候选 | 可记录信号 | 可作为候选样本 |
| `accepted` | 可创建 | 可创建 | 可创建 | 可记录信号 | 可作为优质样本 |
| `partially_accepted` | 仅已采纳区块可创建 | 仅已采纳区块可创建 | 仅已采纳区块可创建 | 可记录信号 | 可作为混合样本 |
| `rejected` | 不可用 | 不可用 | 不可用 | 可记录原因 | 可作为负样本 |
| `downstream_ready` | 已创建或可同步 | 已创建或可同步 | 已创建或可同步 | 可记录复用 | 可作为优质样本 |
| `archived` | 只读 | 只读 | 只读 | 只读 | 只读 |

## Regeneration Rules

未来实现必须显式处理：

- 重新生成整场复盘时创建新的 `AiReviewRun`，并记录 `parentRunId`。
- 只重生成单个区块时保留其它区块审核状态，并记录 section-level parent reference。
- 重生成原因必须结构化，例如 `missing_evidence`、`tone_mismatch`、`wrong_source`、
  `schema_failure`、`operator_preference`、`provider_error`。
- 重生成不得覆盖原始 run、原始 provider 元数据、原始输出或原始审核决定。

## Error Cases

- `VALIDATION_ERROR`：必填字段缺失、枚举非法、字符串过长。
- `MISSING_SESSION_SNAPSHOT`：缺少可用场次快照。
- `SESSION_NOT_REVIEW_READY`：场次状态不允许进入 AI 复盘。
- `SENSITIVE_DATA_NEEDS_REVIEW`：输入包含客户个人信息、私信、订单号、手机号、地址或高敏业务数据。
- `LONG_INPUT_LIMIT_EXCEEDED`：输入超过当前处理上限且无法安全分段。
- `KNOWLEDGE_SNAPSHOT_UNAVAILABLE`：缺少可用知识快照。
- `STALE_KNOWLEDGE_BLOCKED`：关键知识过期且不允许继续。
- `CONFLICTING_KNOWLEDGE_BLOCKED`：关键知识存在冲突。
- `INSUFFICIENT_EVIDENCE`：证据不足，无法可靠生成建议。
- `PROMPT_VERSION_INACTIVE`：Prompt 版本不是 active/reviewed 状态。
- `PROVIDER_UNAVAILABLE`：Provider 不可用。
- `PROVIDER_TIMEOUT`：Provider 超时。
- `PROVIDER_RATE_LIMITED`：Provider 限流。
- `MODEL_REFUSAL`：模型拒绝生成。
- `PARTIAL_MODEL_OUTPUT`：模型只返回部分结构化输出。
- `AI_OUTPUT_SCHEMA_MISMATCH`：输出不符合 schema。
- `AI_OUTPUT_POLICY_BLOCKED`：输出包含不允许内容或敏感数据。
- `REGENERATION_NOT_ALLOWED`：当前状态不允许重生成。
- `STATE_TRANSITION_INVALID`：状态流转非法。
- `UNAUTHORIZED_TENANT`：actor 访问其他租户或团队数据。
- `FORBIDDEN_ROLE`：角色不允许创建、查看、审核、重生成或创建下游草案。
- `NOT_FOUND`：run、section、decision、feedback 或 downstream artifact 不存在。

## Authorization

未来权限草案：

| 动作 | 允许角色 |
| --- | --- |
| 查看 AI 复盘列表和详情 | operator、host、reviewer、admin |
| 准备 AI 复盘 run | operator、reviewer、admin |
| 启动生成或重生成 | operator、reviewer、admin |
| 查看 provider 元数据摘要 | reviewer、admin |
| 审核、编辑、拒绝建议 | operator、reviewer、admin |
| 处理敏感数据阻塞 | reviewer、admin |
| 创建下游话术、选题、任务草案 | operator、reviewer、admin |
| 归档 run | reviewer、admin |

所有读写必须按 `tenantId` 和 `teamId` 做服务端授权。UI 隐藏按钮不能替代服务端权限。

## Sensitive Data

敏感级别：

- 场次主题、商品顺序、讲解缺口、客户问题摘要：业务敏感。
- 团队经验、价格策略、内部话术、复盘建议、prompt、provider response：业务敏感。
- 客户聊天、私信、订单、手机号、地址、完整转录和供应商信息：高敏，默认不得进入 AI
  provider 输入、普通日志或普通 UI 响应。
- Provider metadata：业务敏感，不得包含密钥、完整 prompt、完整输入或完整输出。

日志不得记录完整 prompt、完整 provider 请求/响应、完整转录、客户个人信息、订单信息、
私信原文、内部成交策略或未发布知识全文。

## Audit Metadata

未来写入、生成、校验、审核、反馈和下游创建记录必须包含：

- `createdBy`、`createdAt`
- `updatedBy`、`updatedAt`
- `reviewedBy`、`reviewedAt`
- `tenantId`、`teamId`
- `sessionId`
- `runId`
- `parentRunId`
- `inputSnapshotId`
- `knowledgeSnapshotId`
- `promptVersionId`
- `providerInvocationId`
- `outputSchemaVersion`
- `validationResultIds`
- `reviewDecisionIds`
- `feedbackSignalIds`
- `downstreamArtifactIds`
- `requestId`
- `idempotencyKey`

## Verification

未来实现本契约时至少验证：

- 单元测试：run 状态机、错误码、重生成规则、schema 校验、review decision 校验、下游可用规则。
- 集成测试：准备 run、启动 run、provider 失败、schema mismatch、人工审核、重生成、反馈记录和下游草案创建。
- Provider port 测试：`pnpm ai-provider:check` 覆盖 fake-fetch success、missing config、timeout、
  rate limit、auth failure、provider unavailable、empty output、malformed JSON、partial output 和
  schema mismatch；live smoke 必须显式启用。
- Generation orchestrator 测试：`pnpm ai-review:generation-check` 覆盖 fake-provider success、
  blocked redaction、blocked long input、insufficient evidence、weak session input、provider timeout、
  rate limit、refusal、partial output、malformed output、schema mismatch、sensitive output、
  source-grounding warnings、prompt fingerprint 和无 prompt/secret 泄露。
- Execution service 测试：`pnpm ai-review:execution-check` 覆盖 fake-provider success、
  review-ready persistence、validation-blocked output、provider failure state、cross-team isolation、
  transaction rollback 和无 prompt/secret 泄露。
- AI schema 测试：空输入、长输入、部分输出、malformed output、拒绝、超时、限流和不足证据。
- 安全测试：跨租户访问失败；日志不含客户个人信息、完整 prompt、完整转录、完整 provider 请求/响应或密钥。
- 知识边界测试：只允许已审核、未过期、未冲突的知识进入 snapshot；review-only finding 不可作为事实依据。
- 浏览器测试：涉及 UI 时检查 `/ai-review` 的 empty、blocked、generating、validation failed、
  review ready、accepted、regeneration requested 和 provider failed 状态。
- 公开预览：影响页面或声明时检查关键路由 HTTP 200。

## Open Questions

- 首个运行时实现采用 Route Handler、Server Action wrapper，还是两者共用 domain service。
- Prompt version 存储已具备本地 metadata 和 generation fingerprint；未来仍需决定全文存储在数据库、
  文件版本，还是专门 prompt registry。
- 初期是否允许 operator 直接审核低风险建议，还是必须 reviewer 角色审核。
- Feedback signal 如何进入评测集、知识生命周期 review priority 和 prompt 改进流程。
- 是否需要异步队列处理长 run、重试和 provider 超时，还是 MVP 先同步执行。
