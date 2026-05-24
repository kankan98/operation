# Q&A Agent Answer Contract

Status: draft
Runtime: not implemented

本契约定义未来 Q&A Agent 回答运行的 API、Server Action、domain service、RAG 检索、
provider adapter、结构化答案、引用、反馈、缺失知识、web discovery 审核流和评测边界。
当前没有任何可调用接口、数据库表、Server Action、AI provider 调用、prompt 模板、
向量索引、公开搜索、持久化、反馈学习或自动知识更新行为。

## Use Case

面向直播运营、主播/助播、商品负责人、审核人员和团队负责人，让团队在准备直播、复盘
场次、整理话术或处理客户问题时，可以问一个运营问题，并得到基于已审核知识的可追溯
回答。

核心目标：

- 让球拍规格、适用人群、打法推荐、异议回应、话术复用和知识缺口更容易查询。
- 保留运营问题、检索 snapshot、引用来源、AI 生成措辞、人工反馈和审核流之间的边界。
- 防止未审核、过期、冲突、跨团队、敏感或来源不明的内容进入回答 grounding。
- 在知识不足时明确说明不确定性，并把缺口变成可审核的改进信号。
- 允许未来公开来源发现，但发现结果只能进入 review-only finding，审核发布后才能用于后续回答。

## Stage Gates

本契约是阶段 1 的文档边界，不代表运行时已实现。后续实现必须按技术实施路线分阶段：

| 阶段 | 可实现内容 | 不能提前做的事 |
| --- | --- | --- |
| 阶段 2 | 认证、团队、租户、角色和 server-side guard | 保存受保护问答数据前跳过权限 |
| 阶段 3 | PostgreSQL、Drizzle migration、schema 校验、repository 和审计 | 让 UI 直接读写数据库 |
| 阶段 6 | Reviewed snapshot RAG、`RetrievalPort`、`AiProviderPort`、第一阶段 Q&A | 未审核知识、自动联网和自学习 |
| 阶段 7 | `SourceDiscoveryPort`、公开来源 allowlist、review-only finding | 搜索结果直接成为权威答案 |
| 阶段 8 | 反馈学习、评测集、prompt/retrieval 版本比较 | 反馈直接修改权威知识 |

## Domain Entities

### QaAnswerRun

未来 Q&A 主运行记录。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 回答运行 ID |
| `tenantId` | string | 租户 ID |
| `teamId` | string | 团队 ID |
| `status` | enum | `draft`、`received`、`classified`、`retrieving`、`insufficient_knowledge`、`answering`、`validating`、`answered`、`needs_review`、`provider_failed`、`validation_failed`、`feedback_recorded`、`archived` |
| `questionId` | string | 原始问题记录 ID |
| `intentId` | string | 意图分类 ID |
| `retrievalSnapshotId` | string | 检索快照 ID，可为空 |
| `answerOutputId` | string | 答案输出 ID，可为空 |
| `promptVersionId` | string | Prompt 版本 ID，可为空 |
| `providerInvocationId` | string | Provider 调用元数据 ID，可为空 |
| `parentRunId` | string | 重新生成时的父 run ID，可为空 |
| `createdAt` / `updatedAt` | datetime | 审计时间 |

### OperatorQuestion

运营人员提交的问题。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 问题 ID |
| `questionText` | string | 脱敏后的问题文本 |
| `questionHash` | string | 用于去重和审计的摘要，不替代原文权限控制 |
| `language` | enum | `zh`、`en`、`mixed`、`unknown` |
| `questionSource` | enum | `manual`、`session_question`、`ai_review_feedback`、`talk_track_review`、`knowledge_gap` |
| `linkedEntityType` | enum | `racket_product`、`live_session`、`talk_track`、`knowledge_version`、`none` |
| `linkedEntityIds` | string[] | 关联球拍、场次、话术或知识版本 |
| `redactionState` | enum | `not_needed`、`redacted`、`needs_review`、`blocked` |
| `inputPolicy` | enum | `within_limit`、`too_short`、`too_long`、`blocked_sensitive` |
| `askedBy` | string | 提问 actor ID |
| `askedAt` | datetime | 提问时间 |

### QuestionIntentClassification

问题意图分类。分类可由规则、人工或未来 AI 辅助完成，但不能替代权限检查。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 意图 ID |
| `questionId` | string | 问题 ID |
| `intentType` | enum | `racket_spec`、`player_fit`、`play_style_recommendation`、`objection_reply`、`talk_track`、`session_recap`、`knowledge_gap`、`platform_rule`、`unknown` |
| `confidence` | enum | `high`、`medium`、`low`、`unknown` |
| `entities` | object[] | 识别出的型号、别名、价格带、打法、人群、场次等 |
| `needsClarification` | boolean | 是否需要追问 |
| `classificationMethod` | enum | `rule`、`ai_candidate`、`manual` |

### QaRetrievalSnapshot

回答使用的检索快照。只能包含当前 actor 可访问、已审核、未过期、未冲突的最小必要证据。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 检索快照 ID |
| `runId` | string | Q&A run ID |
| `retrievalPolicy` | enum | `reviewed_only`、`reviewed_team_only`、`reviewed_with_approved_candidates` |
| `retrievalMethod` | enum | `keyword`、`full_text`、`vector`、`hybrid`、`manual_selected` |
| `knowledgeVersionIds` | string[] | 已发布知识版本 ID |
| `racketProductVersionIds` | string[] | 已审核产品版本 ID |
| `sourceIds` | string[] | 来源 ID |
| `freshnessState` | enum | `current`、`stale_warning`、`stale_blocked` |
| `conflictState` | enum | `none`、`warning`、`blocked` |
| `trustSummary` | object | 来源可信等级和数量摘要 |
| `evidenceCount` | number | 使用证据数量 |
| `createdAt` | datetime | 快照创建时间 |

### QaRetrievedEvidence

检索快照中的单条证据。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 证据 ID |
| `snapshotId` | string | 检索快照 ID |
| `evidenceType` | enum | `racket_product`、`published_knowledge`、`team_experience`、`session_summary`、`talk_track` |
| `targetId` | string | 对应记录 ID |
| `sourceId` | string | 来源 ID，可为空 |
| `sourceVersionId` | string | 来源或知识版本 ID，可为空 |
| `reviewState` | enum | `approved`、`published`、`blocked` |
| `trustLevel` | enum | `official`、`authorized`、`research`、`team`、`unknown` |
| `freshnessState` | enum | `current`、`stale_warning`、`stale_blocked` |
| `conflictState` | enum | `none`、`warning`、`blocked` |
| `excerpt` | string | 最小必要摘录，不包含完整来源页或敏感原文 |
| `relevanceReason` | string | 为什么被选中 |

### QaAnswerOutput

结构化答案输出。答案可用于运营判断，但仍需显示来源和不确定性。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 答案输出 ID |
| `runId` | string | Q&A run ID |
| `schemaVersion` | string | 输出 schema 版本 |
| `answerText` | string | 面向运营的简洁回答 |
| `sections` | object[] | 可选分段，如规格依据、推荐理由、直播话术、注意事项 |
| `citations` | `QaAnswerCitation[]` | 引用列表 |
| `uncertaintyLevel` | enum | `low`、`medium`、`high`、`unknown` |
| `answerBasis` | enum | `reviewed_source`、`team_experience`、`mixed_reviewed`、`insufficient` |
| `inferenceNotes` | string[] | AI 措辞、推断或假设说明 |
| `recommendedAction` | enum | `use_in_live`、`review_before_use`、`add_missing_knowledge`、`ask_clarifying_question`、`do_not_use` |
| `createdAt` | datetime | 生成时间 |

### QaAnswerCitation

答案引用。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 引用 ID |
| `answerOutputId` | string | 答案输出 ID |
| `evidenceId` | string | 证据 ID |
| `label` | string | 展示标签，例如型号、来源标题或团队经验名 |
| `sourceType` | enum | `official_brand`、`official_platform`、`authorized_retailer`、`team_note`、`published_knowledge`、`session_summary` |
| `sourceUrl` | string | 公开 URL，可为空 |
| `sourceVersionId` | string | 来源版本 ID，可为空 |
| `quotedRange` | string | 未来可选的段落或字段定位 |
| `reviewState` | enum | `approved`、`published` |

### QaAnswerValidationResult

答案校验结果。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 校验记录 ID |
| `runId` | string | Q&A run ID |
| `checkType` | enum | `schema`、`citation_presence`、`source_grounding`、`stale_source`、`fact_conflict`、`sensitive_data`、`prompt_injection`、`permission_scope`、`answer_length` |
| `status` | enum | `passed`、`warning`、`failed`、`blocked` |
| `message` | string | 面向审核或调试的说明 |
| `affectedEvidenceIds` | string[] | 受影响证据 |
| `recoverable` | boolean | 是否可重试、换检索或人工处理 |

### QaFeedbackSignal

运营反馈。反馈不是知识事实，必须作为质量信号处理。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 反馈 ID |
| `runId` | string | Q&A run ID |
| `answerOutputId` | string | 答案输出 ID |
| `signalType` | enum | `thumbs_up`、`thumbs_down`、`edited`、`regenerate_requested`、`missing_knowledge`、`wrong_source`、`unclear` |
| `reason` | string | 反馈原因 |
| `editedAnswer` | string | 用户编辑答案，可为空 |
| `routesTo` | enum | `evaluation_set`、`knowledge_review`、`retrieval_review`、`prompt_review`、`none` |
| `reviewPriority` | enum | `low`、`normal`、`high`、`urgent` |
| `createdBy` | string | 反馈人 |
| `createdAt` | datetime | 反馈时间 |

### MissingKnowledgeSignal

缺失知识信号。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 缺口 ID |
| `runId` | string | Q&A run ID |
| `questionId` | string | 问题 ID |
| `gapType` | enum | `missing_racket_spec`、`missing_player_fit`、`missing_objection_reply`、`stale_source`、`conflicting_source`、`missing_team_experience`、`missing_platform_rule` |
| `description` | string | 缺失内容说明 |
| `suggestedSourceType` | enum | `official_brand`、`authorized_retailer`、`team_note`、`session_review`、`public_web`、`unknown` |
| `reviewPriority` | enum | `low`、`normal`、`high`、`urgent` |
| `reviewState` | enum | `open`、`triaged`、`reviewing`、`resolved`、`dismissed` |

### QaSourceDiscoveryDraft

未来公开来源发现草案。它不是权威知识，不能直接 grounding 后续答案。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 发现草案 ID |
| `runId` | string | Q&A run ID |
| `missingKnowledgeSignalId` | string | 缺口 ID，可为空 |
| `sourceTitle` | string | 来源标题 |
| `sourceUrl` | string | 来源 URL |
| `sourceType` | enum | `official_brand`、`official_platform`、`authorized_retailer`、`professional_reference`、`unknown` |
| `allowlistState` | enum | `allowed`、`needs_review`、`blocked` |
| `retrievedAt` | datetime | 获取时间 |
| `candidateClaims` | object[] | 候选 claim 摘要 |
| `trustSuggestion` | enum | `official`、`authorized`、`research`、`unknown` |
| `reviewState` | enum | `review_only`、`submitted_to_knowledge_review`、`approved`、`rejected`、`blocked` |

## Commands / Queries

### Commands

未来命令边界：

- `AskQaAgentQuestionCommand`
- `ClassifyQaQuestionIntentCommand`
- `PrepareQaRetrievalSnapshotCommand`
- `RecordQaAnswerRunCommand`
- `ValidateQaAnswerOutputCommand`
- `RecordQaAnswerFeedbackCommand`
- `CreateMissingKnowledgeSignalCommand`
- `RequestQaAnswerRegenerationCommand`
- `CreateQaSourceDiscoveryDraftCommand`
- `SubmitQaDiscoveryFindingForReviewCommand`
- `ArchiveQaAnswerRunCommand`

命令必须带 `tenantId`、`teamId`、actor、幂等键或审计上下文。写操作必须做权限检查、
输入校验、状态机检查、敏感数据检查和审计记录。

### Queries

未来查询边界：

- `GetQaAnswerRunDetailQuery`
- `ListQaAnswerRunsQuery`
- `GetQaAnswerTimelineQuery`
- `ListQaFeedbackSignalsQuery`
- `ListMissingKnowledgeSignalsQuery`
- `ListQaSourceDiscoveryDraftsQuery`
- `GetQaEvaluationCandidateQuery`

查询必须按 tenant/team 过滤。普通 UI 不得返回完整 prompt、完整 provider 请求体、完整
检索上下文、客户个人信息、未脱敏私信、跨团队知识或被权限阻断的来源内容。

## Request Shape

### AskQaAgentQuestionCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "user_001",
  "idempotencyKey": "ask-qa-001",
  "questionText": "疾速 900 适合进阶双打选手吗？直播间怎么解释不适合重杀？",
  "linkedEntityType": "racket_product",
  "linkedEntityIds": ["racket_001"],
  "answerPolicy": {
    "knowledgeScope": "reviewed_only",
    "excludeStale": true,
    "excludeConflicts": true,
    "allowTeamExperience": true,
    "allowWebDiscovery": false
  }
}
```

### PrepareQaRetrievalSnapshotCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "user_001",
  "runId": "qa_run_001",
  "intentType": "player_fit",
  "filters": {
    "racketProductIds": ["racket_001"],
    "claimTypes": ["racket_spec", "selling_experience", "objection_reply"],
    "trustLevel": ["official", "team"],
    "excludeStale": true,
    "excludeConflicts": true
  },
  "limit": 8
}
```

### RecordQaAnswerFeedbackCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "user_002",
  "runId": "qa_run_001",
  "answerOutputId": "qa_answer_001",
  "signalType": "thumbs_down",
  "reason": "引用里没有说明杆硬度，直播话术不够稳",
  "routesTo": "knowledge_review",
  "reviewPriority": "high"
}
```

## Response Shape

### QaAnswerRunDetail

```json
{
  "run": {
    "id": "qa_run_001",
    "status": "answered",
    "questionId": "question_001",
    "intentType": "player_fit",
    "uncertaintyLevel": "medium",
    "recommendedAction": "review_before_use"
  },
  "answer": {
    "answerText": "疾速 900 更适合进阶到中高级的双打连贯型选手。直播间可以强调挥速和防守转换，但如果客户主要追求后场重杀，需要提醒它不是最强头重压迫取向。",
    "sections": [
      {
        "title": "适合人群",
        "items": ["进阶双打", "平抽挡", "防守反击"]
      },
      {
        "title": "注意事项",
        "items": ["后场重杀压迫感弱于头重拍", "建议结合客户发力水平说明"]
      }
    ],
    "citations": [
      {
        "label": "疾速 900 已审核产品规格",
        "sourceType": "published_knowledge",
        "sourceVersionId": "knowledge_version_001"
      }
    ],
    "inferenceNotes": ["直播话术为 AI 组织措辞，规格依据来自已审核知识"]
  },
  "retrieval": {
    "snapshotId": "qa_snapshot_001",
    "evidenceCount": 3,
    "freshnessState": "current",
    "conflictState": "none"
  },
  "validation": {
    "status": "passed",
    "warnings": []
  },
  "feedback": {
    "canRecord": true,
    "allowedSignals": ["thumbs_up", "thumbs_down", "edited", "missing_knowledge"]
  }
}
```

### InsufficientKnowledgeResponse

```json
{
  "run": {
    "id": "qa_run_002",
    "status": "insufficient_knowledge",
    "intentType": "racket_spec",
    "uncertaintyLevel": "high"
  },
  "message": "已审核知识里没有找到该型号的推荐磅数，暂不能给出直播可用答案。",
  "checkedEvidence": ["racket_alias_001", "knowledge_version_010"],
  "missingKnowledgeSignal": {
    "gapType": "missing_racket_spec",
    "description": "缺少疾速 900 推荐磅数的已审核来源",
    "suggestedSourceType": "official_brand",
    "reviewPriority": "high"
  },
  "nextAction": "add_missing_knowledge"
}
```

## State Machine

未来状态流：

```text
draft
  -> received
  -> classified
  -> retrieving
  -> insufficient_knowledge
  -> answering
  -> validating
  -> answered
  -> feedback_recorded
  -> archived
```

可选分支：

- `classified -> needs_review`：问题太模糊、疑似敏感或需要人工确认。
- `retrieving -> insufficient_knowledge`：无可用证据、证据过期或冲突。
- `retrieving -> needs_review`：证据跨团队、敏感或权限不明。
- `answering -> provider_failed`：provider 超时、拒绝、限流、不可用或部分输出。
- `validating -> validation_failed`：schema、引用、敏感数据或 grounding 校验失败。
- `insufficient_knowledge -> needs_review`：缺口需要知识审核人员处理。
- `insufficient_knowledge -> web_discovery_candidate`：未来阶段允许公开来源发现时创建草案。

状态规则：

- `answered` 前必须有通过校验的 `QaAnswerOutput`，或明确的 insufficient response。
- `feedback_recorded` 不改变权威知识，只增加质量信号。
- `web_discovery_candidate` 不能直接进入 `answered` 的 grounding。
- 重新生成必须创建新的 run 或 parent-child run，不覆盖历史审计。

## Error Cases

| 错误码 | 触发条件 | 处理 |
| --- | --- | --- |
| `QUESTION_EMPTY` | 问题为空或只有空白 | 阻止运行，提示补充问题 |
| `QUESTION_TOO_LONG` | 问题超过输入限制 | 要求缩短或拆分 |
| `QUESTION_NEEDS_CLARIFICATION` | 意图不清或缺少型号/场景 | 返回澄清需求 |
| `SENSITIVE_INPUT_BLOCKED` | 包含手机号、地址、订单号、私信、内部策略或秘密 | 脱敏、阻止或转人工 |
| `PROMPT_INJECTION_DETECTED` | 问题试图覆盖系统规则、泄露 prompt 或绕过来源审核 | 阻止或降级 |
| `UNAUTHORIZED_TENANT` | actor 无租户权限 | 拒绝 |
| `FORBIDDEN_ROLE` | actor 无提问、查看、反馈或审核权限 | 拒绝 |
| `NO_REVIEWED_KNOWLEDGE` | 没有可用已审核知识 | 返回知识不足和缺口信号 |
| `STALE_KNOWLEDGE_BLOCKED` | 证据过期且策略禁止使用 | 返回知识不足 |
| `CONFLICTING_KNOWLEDGE_BLOCKED` | 来源冲突且未解决 | 返回需要审核 |
| `RETRIEVAL_UNAVAILABLE` | 检索服务或 repository 不可用 | 非成功状态，可重试 |
| `PROVIDER_TIMEOUT` | provider 超时 | 非成功状态，可重试 |
| `PROVIDER_RATE_LIMITED` | provider 限流 | 非成功状态，提示稍后重试 |
| `PROVIDER_REFUSAL` | provider 拒绝 | 非成功状态，记录原因 |
| `OUTPUT_SCHEMA_MISMATCH` | 结构化输出不符合 schema | validation failed，不保存为可用答案 |
| `CITATION_MISSING` | 答案缺少必要引用 | validation failed |
| `WEB_DISCOVERY_NOT_ALLOWED` | 当前阶段或策略不允许公开来源发现 | 不创建 discovery draft |
| `SOURCE_NOT_ALLOWED` | 来源权限、条款或可信度不满足 | 标记 blocked 或 needs review |

## Authorization

未来运行时必须服务端执行权限，不能依赖前端隐藏控件。

| 操作 | 允许角色 | 规则 |
| --- | --- | --- |
| 提问 | `operator`、`host`、`reviewer`、`admin` | 只能访问所在 tenant/team 的知识和场次 |
| 查看答案 | `operator`、`host`、`reviewer`、`admin` | 只看有权限的 run 和引用 |
| 记录反馈 | `operator`、`host`、`reviewer`、`admin` | 反馈必须绑定 actor |
| 请求重新生成 | `operator`、`reviewer`、`admin` | 必须记录 parent run |
| 创建 discovery draft | `reviewer`、`admin` 或未来允许的 operator 流程 | 仅 review-only |
| 提交知识审核 | `reviewer`、`admin` | 进入 knowledge lifecycle |
| 查看 provider/debug metadata | `reviewer`、`admin` | 不返回密钥、完整 prompt 或完整敏感上下文 |

## Sensitive Data

默认敏感数据：

- 客户评论、私信、订单、手机号、地址和平台账号。
- 直播转录、运营笔记、GMV、转化率、价格策略、供应链和活动策略。
- Prompt 模板、provider 请求体、完整检索上下文、AI 输出和评测样本。
- 公开来源全文、未审核 web discovery 内容和团队内部经验。

处理规则：

- 问题和证据进入 provider 前必须最小化字段并检查脱敏状态。
- 普通日志不得包含完整问题、完整 prompt、完整检索上下文、客户个人信息或 secret。
- 回答引用展示来源摘要和版本，不默认展示完整原文。
- 反馈中的 edited answer 可能包含敏感业务信息，必须按业务数据保护。
- Web discovery 内容在审核通过前不得成为 authoritative knowledge。

## Audit Metadata

未来持久化记录必须保留：

- `createdBy`、`updatedBy`、`reviewedBy`、`feedbackBy`。
- `createdAt`、`updatedAt`、`reviewedAt`、`feedbackAt`。
- `requestId`、`idempotencyKey`、`tenantId`、`teamId`。
- `questionId`、`questionHash`、`runId`、`parentRunId`。
- `retrievalSnapshotId`、`evidenceIds`、`knowledgeVersionIds`、`sourceVersionIds`。
- `promptVersionId`、`provider`、`model`、`providerInvocationId`、`responseId`。
- `validationResultIds`、`feedbackSignalIds`、`missingKnowledgeSignalIds`。
- `discoveryDraftIds`、`knowledgeReviewIds`、`evaluationExampleIds`。

## Verification

未来实现本契约时至少验证：

- OpenSpec：对应 change 通过 `openspec validate <change-name>`。
- Schema：问题输入、检索 snapshot、答案输出、引用、反馈、缺口和 discovery draft 校验。
- 权限：未登录、跨 tenant/team、角色不足、调试信息访问。
- 输入：空问题、过短、过长、混合中英文型号、重复型号、别名冲突、模糊人群描述。
- 检索：无已审核知识、过期知识、冲突知识、权限外知识、只返回最小必要字段。
- AI：provider 超时、限流、拒绝、不可用、partial output、malformed output。
- 安全：prompt injection、敏感数据脱敏、日志脱敏、引用不泄露私密来源。
- 答案：引用正确性、事实/团队经验/AI 措辞区分、不确定性显示、知识不足路径。
- 反馈：点赞、点踩、编辑、原因、重新生成、缺失知识路由。
- Web discovery：allowlist、禁止来源、失效链接、冲突来源、review-only 状态。
- UI：未来页面变化需要覆盖 loading、empty、error、success、disabled、移动端、桌面端和文本溢出。
- 评测：prompt、模型、检索规则、chunk/ranking 或答案策略变更前后用代表性运营问题比较。

## Open Questions

- Auth provider 和角色模型尚未确定，需要 `auth-team-tenant` OpenSpec。
- PostgreSQL schema、Drizzle migration、Zod 或等价校验命名需要数据基础 OpenSpec。
- 首个 Q&A UI 是否需要 streaming，还是先用同步回答加状态轮询。
- Prompt version、evaluation dataset 和 answer policy 的版本命名需要未来 AI/RAG OpenSpec。
- 公开来源 allowlist 需要结合品牌官网、平台规则、授权经销商和专业羽毛球资料做单独审核。
- 哪些团队经验可以作为已审核经验进入回答，需要真实业务负责人确认。
