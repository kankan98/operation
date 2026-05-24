# Talk Track Asset Contract

Status: draft
Runtime: partially implemented, local-only

本契约定义未来话术资产、版本、场景、区块、异议回应、来源引用、AI 候选、人工审核、复用反馈、
Q&A/RAG 可用性和审计边界。当前仅已实现本地-only PostgreSQL/Drizzle schema、server-only
repository 和 `talk-tracks:check` 回滚式验证，用于验证 tenant/team scope、版本、来源引用、
AI 候选审核阻断、发布门禁、重复场景和复用反馈。当前没有任何面向用户的 Route Handler、
Server Action、浏览器保存、搜索 UI、AI provider 调用、RAG 检索、web discovery 或公开话术资产
工作流。

## Use Case

面向主播/助播、直播运营、商品负责人、审核人员和团队负责人，把直播中反复有效的讲解结构、
异议回应、产品对比、短视频开场和收口提醒沉淀为可审核、可复用、可追溯的话术资产。

核心目标：

- 让主播快速找到适合当前球拍、打法、人群、价格带和客户异议的话术。
- 让运营把场次问题、讲解缺口和 AI 复盘建议转成待审核资产，而不是散落在笔记里。
- 让商品负责人和审核人员确认话术里的规格、卖点、适用人群和来源是否可靠。
- 让团队负责人看到哪些话术被复用、编辑、拒绝或需要更新。
- 防止 AI 建议、未审核经验或过期来源直接变成可对外使用的销售话术。

## Stage Gates

本契约是阶段 1 的文档边界，不代表运行时已实现。后续实现必须按技术路线分阶段：

| 阶段 | 可实现内容 | 不能提前做的事 |
| --- | --- | --- |
| 阶段 3 | PostgreSQL、schema validation、repository、tenant/team ownership、审计；本地-only slice 已部分落地 | UI 直接保存话术或跳过数据基础 |
| 阶段 4 | 话术资产 CRUD、版本、审核、搜索、复用反馈；当前仅 repository 验证，公开 CRUD 未实现 | 把 AI 输出直接发布为话术 |
| 阶段 5 | AI review downstream talk-track candidate | 未经人工审核进入 published |
| 阶段 6 | Q&A/RAG 引用已发布话术作为团队经验 | 检索草稿、拒绝或过期话术作为答案依据 |
| 阶段 8 | 反馈学习和评测使用话术复用信号 | 反馈自动改写权威话术 |

## Runtime Boundary

未来实现必须保留调用方向：

```text
Talk-track UI
  -> Route Handler / thin Server Action
  -> TalkTrack domain service
  -> TalkTrackRepository
  -> Data foundation repository adapter
```

AI review 下游创建必须保留：

```text
AiReviewRun accepted section
  -> downstream artifact draft
  -> TalkTrackCandidate
  -> human review
  -> TalkTrackVersion published
```

## Domain Entities

### TalkTrackAsset

话术资产主记录，表达一个可复用话术主题。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 资产 ID |
| `tenantId` / `teamId` | string | 租户和团队 |
| `assetType` | enum | `product_intro`、`feature_benefit`、`comparison`、`objection_reply`、`closing_prompt`、`short_video_hook`、`transition`、`qa_reply` |
| `title` | string | 话术标题 |
| `status` | enum | `draft`、`reviewing`、`published`、`deprecated`、`archived`、`rejected` |
| `ownerRole` | enum | `operator`、`host`、`product_owner`、`reviewer`、`admin` |
| `currentVersionId` | string | 当前版本 ID |
| `createdBy` / `updatedBy` | string | 审计 actor |
| `createdAt` / `updatedAt` | datetime | 审计时间 |

### TalkTrackVersion

每次发布或重要修改生成版本，不能静默覆盖历史话术。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 版本 ID |
| `assetId` | string | 资产 ID |
| `version` | string | 版本号 |
| `status` | enum | `draft`、`reviewing`、`published`、`deprecated`、`archived`、`rejected` |
| `body` | string | 话术正文 |
| `tone` | enum | `professional`、`friendly`、`urgent`、`educational`、`comparison` |
| `language` | enum | `zh_CN`、`mixed_zh_en` |
| `reviewDecisionId` | string | 审核记录 ID，可为空 |
| `sourceGroundingId` | string | 来源引用记录 ID，可为空 |
| `createdBy` / `createdAt` | string / datetime | 创建审计 |

### TalkTrackScenario

描述适用场景，防止泛化话术被误用。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 场景 ID |
| `assetId` | string | 资产 ID |
| `racketProductIds` | string[] | 适用球拍 |
| `playerLevel` | enum | `beginner`、`intermediate`、`advanced`、`professional`、`unknown` |
| `playStyle` | enum | `control`、`attack`、`defense`、`doubles`、`singles`、`all_round`、`unknown` |
| `priceBand` | enum | `entry`、`mid`、`premium`、`unknown` |
| `liveScene` | enum | `opening`、`product_demo`、`comparison`、`objection_handling`、`closing`、`short_video`、`qa` |
| `hostRole` | enum | `host`、`assistant`、`operator` |
| `usageConstraints` | string[] | 使用限制 |

### TalkTrackSegment

话术可拆成区块，方便短视频、直播讲解和 Q&A 复用。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 区块 ID |
| `versionId` | string | 版本 ID |
| `segmentType` | enum | `hook`、`product_fact`、`benefit`、`demo_step`、`comparison_point`、`objection_reply`、`cta`、`transition` |
| `text` | string | 区块文字 |
| `requiredEvidence` | boolean | 是否必须有来源 |
| `position` | number | 顺序 |

### ObjectionReplyPattern

常见异议回应模式。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 模式 ID |
| `assetId` | string | 资产 ID |
| `objectionType` | enum | `price`、`beginner_fit`、`durability`、`weight`、`stiffness`、`string_tension`、`authenticity`、`comparison`、`after_sales` |
| `customerQuestionExample` | string | 脱敏问题示例 |
| `replyStrategy` | enum | `clarify_need`、`compare_options`、`explain_tradeoff`、`recommend_alternative`、`defer_to_review` |
| `riskLevel` | enum | `low`、`medium`、`high` |

### TalkTrackSourceGrounding

话术依据。事实归知识/产品契约所有，话术这里只引用。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 引用记录 ID |
| `assetId` / `versionId` | string | 资产和版本 |
| `sourceType` | enum | `racket_product_version`、`knowledge_version`、`session_example`、`ai_review_run`、`team_experience` |
| `sourceIds` | string[] | 来源 ID |
| `freshnessState` | enum | `current`、`stale_warning`、`stale_blocked`、`unknown` |
| `conflictState` | enum | `none`、`needs_review`、`blocked` |
| `claimSummary` | string | 支撑的声明摘要 |

### TalkTrackReviewDecision

人工审核记录。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 审核 ID |
| `assetId` / `versionId` | string | 审核对象 |
| `decision` | enum | `approve`、`approve_with_edits`、`reject`、`request_changes`、`deprecate` |
| `reason` | string | 审核原因 |
| `reviewedBy` | string | 审核人 |
| `reviewedAt` | datetime | 审核时间 |
| `editedBody` | string | 编辑后文本，可为空 |

### TalkTrackCandidate

来自 AI 复盘或人工整理的候选草案。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 候选 ID |
| `candidateSource` | enum | `ai_review`、`session_capture`、`manual`、`qa_feedback` |
| `aiRunId` | string | AI run ID，可为空 |
| `aiSectionId` | string | AI section ID，可为空 |
| `promptVersion` | string | prompt 版本，可为空 |
| `proposedBody` | string | 候选话术 |
| `validationState` | enum | `unchecked`、`passed`、`warning`、`blocked` |
| `reviewState` | enum | `pending`、`accepted`、`edited`、`rejected` |

### TalkTrackUsageSignal

复用和质量反馈，不直接自动改写话术。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 反馈 ID |
| `assetId` / `versionId` | string | 话术版本 |
| `sourceWorkflow` | enum | `live_session`、`ai_review`、`qa_answer`、`short_video`、`manual` |
| `signalType` | enum | `used`、`edited_before_use`、`rejected_in_use`、`reported_wrong`、`needs_update` |
| `reason` | string | 原因 |
| `actorId` | string | actor |
| `createdAt` | datetime | 时间 |

## Commands / Queries

### Commands

- `CreateTalkTrackAssetCommand`
- `CreateTalkTrackVersionCommand`
- `CreateTalkTrackCandidateCommand`
- `SubmitTalkTrackForReviewCommand`
- `RecordTalkTrackReviewDecisionCommand`
- `PublishTalkTrackVersionCommand`
- `DeprecateTalkTrackVersionCommand`
- `ArchiveTalkTrackAssetCommand`
- `RestoreTalkTrackAssetCommand`
- `RecordTalkTrackUsageSignalCommand`

命令必须带 `tenantId`、`teamId`、actor、validated input、幂等键或审计上下文。发布和弃用必须记录
审核原因和来源状态。

### Queries

- `ListTalkTrackAssetsQuery`
- `GetTalkTrackAssetDetailQuery`
- `SearchTalkTrackAssetsQuery`
- `ListTalkTrackCandidatesQuery`
- `GetTalkTrackVersionHistoryQuery`
- `ListTalkTrackUsageSignalsQuery`
- `GetTalkTrackDownstreamReadinessQuery`

查询必须按 tenant/team 过滤。Q&A/RAG 只能检索 `published`、未过期、未冲突、当前团队可见的版本。

## Request Shape

### CreateTalkTrackCandidateCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "user_001",
  "idempotencyKey": "talk-track-candidate-001",
  "candidateSource": "ai_review",
  "sourceRefs": {
    "aiRunId": "run_001",
    "aiSectionId": "section_talk_track_001",
    "knowledgeVersionIds": ["knowledge_version_001"],
    "racketProductVersionIds": ["racket_version_001"]
  },
  "scenario": {
    "liveScene": "objection_handling",
    "objectionType": "price",
    "playerLevel": "intermediate"
  },
  "proposedBody": "这支拍更适合想提升连续进攻的人，预算有限的话可以先对比同系列中端款。"
}
```

### PublishTalkTrackVersionCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "reviewer_001",
  "assetId": "talk_track_001",
  "versionId": "talk_track_version_002",
  "reviewDecisionId": "review_001",
  "publishNote": "已核对产品规格和价格带表达，适合中阶进攻型用户。"
}
```

## Response Shape

```ts
type TalkTrackCommandResponse<TRecord> =
  | {
      ok: true;
      record: TRecord;
      reviewState: "draft" | "reviewing" | "published" | "rejected";
      auditEventId: string;
    }
  | {
      ok: false;
      errorCode: TalkTrackErrorCode;
      message: string;
      requestId: string;
      retryable: boolean;
    };
```

列表响应必须包含 `items`、`nextCursor`、`filterSummary`。普通列表不返回 rejected candidate 的完整正文，
除非 actor 有审核权限。

## State Machine

### Asset State

- `draft -> reviewing`
- `reviewing -> published`
- `reviewing -> rejected`
- `published -> deprecated`
- `published -> archived`
- `deprecated -> archived`
- `archived -> draft`

### Version State

- `draft -> reviewing`
- `reviewing -> published`
- `reviewing -> rejected`
- `published -> deprecated`
- `deprecated -> archived`

### Candidate State

- `pending -> accepted`
- `pending -> edited`
- `pending -> rejected`
- `accepted -> published`
- `edited -> published`
- `rejected -> archived`

## Error Cases

| 错误码 | 场景 | 处理 |
| --- | --- | --- |
| `VALIDATION_FAILED` | 话术正文、场景、来源或版本字段不合法 | 返回字段级错误 |
| `SOURCE_REQUIRED` | 涉及产品事实但缺少已审核来源 | 阻断发布 |
| `SOURCE_STALE` | 引用来源过期 | 进入 warning 或阻断，取决于字段 |
| `SOURCE_CONFLICT` | 引用来源冲突 | 阻断发布 |
| `AI_CANDIDATE_NOT_REVIEWED` | AI 候选未审核 | 不允许发布或进入 Q&A grounding |
| `FORBIDDEN_ROLE` | actor 无权限创建、审核、发布或归档 | 拒绝并记录 |
| `DUPLICATE_SCENARIO` | 同一产品/场景已有相同用途已发布版本 | 提示合并或创建新版本 |
| `UNSAFE_CLAIM` | 包含夸大、无依据或平台风险表达 | 阻断发布并要求审核 |
| `SENSITIVE_DATA_BLOCKED` | 包含客户个人信息、订单、私信或内部敏感内容 | 阻断保存或脱敏后再提交 |
| `VERSION_CONFLICT` | 并发编辑版本 | 要求刷新并重新提交 |

## Authorization

| 操作 | 允许角色 |
| --- | --- |
| 查看已发布话术 | operator、host、product_owner、reviewer、admin、viewer |
| 创建草稿/候选 | operator、host、product_owner、reviewer、admin |
| 编辑草稿 | operator、host、product_owner、reviewer、admin |
| 提交审核 | operator、product_owner、reviewer、admin |
| 审核/发布/弃用 | product_owner、reviewer、admin |
| 归档/恢复 | reviewer、admin |
| 查看拒绝候选和审核原因 | product_owner、reviewer、admin |

所有操作必须按 tenant/team 过滤。跨团队访问失败，不能通过 URL、搜索或 Q&A 检索泄露资产存在性。

## Sensitive Data

默认敏感：

- 内部话术、价格策略、促销节奏、供应链信息、转化经验。
- 客户问题原文、私信、订单、电话、地址。
- AI prompt、AI output、审核意见、拒绝原因。
- 平台规则解读和未发布商品策略。

公开或半公开使用前必须确认：

- 产品规格、适用人群、打法建议来自已审核产品或知识版本。
- 短视频/直播口播不包含内部备注、客户个人信息或不适合对外的策略。
- AI 组织措辞必须标记来源并经人工审核。

## Audit Metadata

未来写入、审核、发布、弃用、复用反馈必须记录：

- `requestId`
- `actorId`
- `tenantId`
- `teamId`
- `assetId`
- `versionId`
- `candidateId`
- `sourceVersionIds`
- `aiRunId`
- `reviewDecisionId`
- `previousState`
- `nextState`
- `createdAt`
- 脱敏 `metadata`

## Verification

未来运行时实现必须覆盖：

- 单元测试：资产/版本/候选状态机、错误码、来源必填规则、AI 候选发布阻断。
- 集成测试：创建候选、提交审核、编辑后发布、弃用、归档、搜索、复用反馈。
- 权限测试：跨 team/tenant 访问失败，host 不能发布，viewer 不能看拒绝候选正文。
- 来源测试：缺来源、过期来源、冲突来源、产品规格变更后的话术 stale 状态。
- 敏感数据测试：客户个人信息、订单、私信、完整 prompt、内部价格策略不能进入公开话术。
- AI 测试：AI-generated candidate 必须保留 run/section/prompt/version 引用，未审核不得用于 Q&A/RAG。
- UI 测试：未来页面需覆盖 loading、empty、error、success、disabled、移动端长文本和搜索过滤。

## Open Questions

- 第一版话术资产 runtime 是先做产品讲解、异议回应，还是短视频 hook。
- 审核职责第一版由商品负责人、审核员还是团队管理员承担。
- 是否需要为不同主播维护同一话术的个性化变体。
- 发布后多久自动提醒复查，是否跟随产品/知识来源 stale 状态。
- Q&A 回答中是否允许逐字引用话术，还是只作为团队经验摘要。
