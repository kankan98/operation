# Next Session Task Contract

Status: draft
Runtime: partially implemented, local-only

本契约定义未来下场任务的 API、Server Action、Repository、AI 复盘下游创建、
场次跟进、审核关闭、反馈信号和团队任务回看边界。当前仅有本地-only
PostgreSQL/Drizzle schema、server-only repository、受保护 Route Handler 和
`next-actions:check` / `next-actions:route-check` 回滚式验证；没有任何 Server Action、
浏览器保存流程、AI provider 调用、队列、通知、日历同步、导出或真实生产任务行为。

## Use Case

面向直播运营、主播/助播、商品负责人、审核人员和团队负责人，把直播场次记录、
客户问题、购买异议、知识缺口、AI 复盘建议、话术资产改进和短视频选题转成有负责人、
截止时间、来源证据、状态和结果回看的下场准备任务。

核心目标：

- 让复盘建议不只停留在笔记里，而是变成能在下一场直播前完成的具体动作。
- 让运营知道每个任务为什么存在、来自哪场直播或 AI 复盘、谁负责、何时完成、是否被阻塞。
- 保留人工任务、AI 建议、知识缺口、话术改进和实际完成结果之间的边界。
- 防止未审核 AI 输出、未脱敏客户信息、完整转录、prompt 或供应链/价格策略被复制进任务正文。
- 为后续数据库、接口、AI 复盘 MVP、任务看板、反馈学习和团队回看提供稳定契约。

## Stage Gates

本契约最初是阶段 1 的文档边界；当前已部分进入阶段 4 的本地-only repository
runtime。后续对外保存、AI 下游创建、通知、日历、导出和团队看板仍必须按技术路线分阶段：

| 阶段 | 可实现内容 | 不能提前做的事 |
| --- | --- | --- |
| 阶段 3 | PostgreSQL、schema validation、repository、tenant/team ownership、审计；本地-only schema 和 repository 已部分实现 | UI 直接保存任务或跳过数据基础 |
| 阶段 4 | 手动创建、编辑、指派、状态更新、列表筛选、审核关闭、反馈信号和归档；当前 repository 和 local-only 受保护 API runtime 已部分落地，浏览器 CRUD 未实现 | 从静态页面状态反推数据库结构，或在没有真实登录边界时开放公开 CRUD |
| 阶段 5 | AI review 下游任务候选、人工采纳、重复检测、审核关闭 | AI 输出直接创建团队义务任务 |
| 阶段 8 | 任务完成、拒绝、重开和阻塞信号进入反馈学习 | 反馈自动改写权威知识、话术或 prompt |
| 阶段 9 | 通知、队列、日历、导出、报表和外部平台集成 | 无脱敏、授权和备份策略就处理真实任务数据 |

## Runtime Boundary

未来实现必须保留调用方向：

```text
Next-actions UI
  -> Route Handler / thin Server Action
  -> NextSessionTask domain service
  -> NextSessionTaskRepository
  -> Data foundation repository adapter
```

AI review 下游创建必须保留：

```text
AiReviewRun accepted section
  -> downstream artifact candidate
  -> NextSessionTaskCandidate
  -> duplicate/source/sensitive-data checks
  -> human acceptance or configured review policy
  -> NextSessionTask assigned/draft record
```

规则：

- UI 不直接调用数据库、AI provider、RAG、队列、通知或日历服务。
- Server Action 只能作为薄 mutation wrapper，不拥有任务状态机、权限、AI gating 或重复检测规则。
- 任务正文保存可执行摘要，敏感来源保留在源记录，通过 ID、版本和 redaction state 引用。
- AI review 只能提出候选任务；是否创建团队任务由状态机、权限、重复检测和人工/策略审核决定。

## Domain Entities

### NextSessionTask

未来下场任务主记录。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 任务 ID |
| `tenantId` / `teamId` | string | 租户和团队 |
| `title` | string | 任务标题，面向运营可扫读 |
| `summary` | string | 可执行摘要，不包含原始敏感内容 |
| `taskType` | enum | `prepare_product_info`、`fix_talk_track`、`review_knowledge_gap`、`follow_up_question`、`plan_short_video`、`update_session_theme`、`assign_review`、`export_or_report`、`other` |
| `priority` | enum | `low`、`normal`、`high`、`urgent` |
| `status` | enum | `draft`、`assigned`、`in_progress`、`blocked`、`done`、`reviewing`、`closed`、`reopened`、`canceled`、`archived` |
| `ownerId` | string | 主要负责人，可为空表示草稿未指派 |
| `createdBy` / `updatedBy` | string | 审计 actor |
| `targetSessionId` | string | 目标下场直播，可为空 |
| `sourceWorkflow` | enum | `session_capture`、`ai_review`、`knowledge_gap`、`talk_track`、`qa_feedback`、`manual` |
| `sourceId` | string | 来源记录 ID |
| `sourceState` | enum | `draft`、`candidate`、`review_ready`、`accepted`、`partially_accepted`、`manual` |
| `reviewRequired` | boolean | 完成后是否需要审核关闭 |
| `dueAt` | datetime | 截止时间，可为空 |
| `deadlinePolicy` | enum | `absolute`、`before_next_session`、`no_due_date` |
| `blockedReason` | string | 阻塞原因，可为空 |
| `createdAt` / `updatedAt` | datetime | 审计时间 |

### TaskSource

任务来源引用。来源记录拥有事实，任务只保存摘要和引用。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 来源引用 ID |
| `taskId` | string | 任务 ID |
| `sourceWorkflow` | enum | 同 `NextSessionTask.sourceWorkflow` |
| `sourceId` | string | 来源记录 ID |
| `sourceVersionId` | string | 来源版本 ID，可为空 |
| `sourceSectionId` | string | 来源区块 ID，可为空 |
| `aiRunId` | string | AI run ID，可为空 |
| `promptVersion` | string | prompt 版本，可为空 |
| `knowledgeVersionIds` | string[] | 关联知识版本 |
| `racketProductIds` | string[] | 关联球拍 |
| `talkTrackAssetIds` | string[] | 关联话术资产 |
| `sensitiveRedactionState` | enum | `not_needed`、`redacted`、`needs_review`、`blocked` |

### TaskAssignee

任务协作人员。主要负责人仍在 `NextSessionTask.ownerId`。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 指派记录 ID |
| `taskId` | string | 任务 ID |
| `userId` | string | 成员 ID |
| `role` | enum | `owner`、`collaborator`、`reviewer`、`watcher` |
| `assignmentState` | enum | `active`、`inactive`、`transferred`、`removed` |
| `assignedBy` / `assignedAt` | string / datetime | 指派审计 |

### TaskChecklistItem

任务可拆成检查项，方便直播前准备。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 检查项 ID |
| `taskId` | string | 任务 ID |
| `title` | string | 检查项标题 |
| `status` | enum | `todo`、`done`、`blocked`、`canceled` |
| `position` | number | 排序 |
| `required` | boolean | 是否完成任务前必须完成 |
| `completedBy` / `completedAt` | string / datetime | 完成审计，可为空 |

### TaskDependency

任务依赖和阻塞来源。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 依赖 ID |
| `taskId` | string | 当前任务 |
| `dependsOnType` | enum | `task`、`session`、`product`、`knowledge_version`、`talk_track`、`review_decision` |
| `dependsOnId` | string | 依赖记录 ID |
| `dependencyState` | enum | `pending`、`satisfied`、`blocked`、`waived` |
| `reason` | string | 依赖原因 |

### TaskReviewResult

需要审核关闭的任务结果。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 审核结果 ID |
| `taskId` | string | 任务 ID |
| `decision` | enum | `approve_close`、`request_changes`、`reject_result`、`reopen`、`cancel` |
| `reason` | string | 审核原因 |
| `reviewedBy` / `reviewedAt` | string / datetime | 审核审计 |
| `resultSummary` | string | 完成结果摘要，不包含敏感原文 |

### TaskRecurrence

未来重复准备任务配置。当前只是预留，不代表已实现。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 重复配置 ID |
| `templateTaskId` | string | 模板任务 ID |
| `recurrenceType` | enum | `before_each_session`、`weekly`、`manual_clone` |
| `status` | enum | `draft`、`active`、`paused`、`archived` |
| `nextRunAt` | datetime | 下次生成时间，可为空 |
| `createdBy` | string | 创建 actor |

### TaskFeedbackSignal

任务质量和闭环反馈，不直接改写权威知识或 prompt。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 反馈 ID |
| `taskId` | string | 任务 ID |
| `sourceWorkflow` | enum | `session_capture`、`ai_review`、`qa_feedback`、`talk_track`、`manual` |
| `signalType` | enum | `completed`、`reopened`、`blocked`、`duplicate`、`not_useful`、`helped_next_session`、`missed_due_date`、`needs_better_source` |
| `reason` | string | 反馈原因 |
| `routesTo` | enum | `team_review`、`knowledge_review`、`prompt_review`、`workflow_review`、`none` |
| `actorId` / `createdAt` | string / datetime | 反馈审计 |

## Commands / Queries

### Commands

未来命令边界：

- `CreateNextSessionTaskCommand`
- `CreateTaskFromAiReviewCommand`
- `CreateTaskFromSessionFollowUpCommand`
- `AssignNextSessionTaskCommand`
- `UpdateNextSessionTaskCommand`
- `UpdateTaskStatusCommand`
- `AddTaskChecklistItemCommand`
- `UpdateTaskChecklistItemCommand`
- `RecordTaskDependencyCommand`
- `ResolveTaskBlockerCommand`
- `RecordTaskReviewResultCommand`
- `RecordTaskFeedbackSignalCommand`
- `ArchiveNextSessionTaskCommand`
- `RestoreNextSessionTaskCommand`

命令必须带 `tenantId`、`teamId`、actor、validated input、幂等键或审计上下文。写操作必须做
权限检查、状态机检查、来源可用性检查、重复检测、敏感数据保护和审计记录。

### Queries

未来查询边界：

- `ListNextSessionTasksQuery`
- `GetNextSessionTaskDetailQuery`
- `SearchNextSessionTasksQuery`
- `ListTasksBySessionQuery`
- `ListTasksByOwnerQuery`
- `ListBlockedOrOverdueTasksQuery`
- `GetTaskSourceTrailQuery`
- `GetTaskReadinessForNextSessionQuery`
- `ListTaskFeedbackSignalsQuery`

查询必须按 tenant/team 过滤。普通 UI 不得返回完整客户消息、完整转录、完整 prompt、完整
provider 请求体、供应商细节或未脱敏业务敏感数据。

## Request Shape

### CreateTaskFromAiReviewCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "user_operator_001",
  "idempotencyKey": "next-task-ai-review-001",
  "source": {
    "sourceWorkflow": "ai_review",
    "aiRunId": "airun_001",
    "sourceSectionId": "section_next_action_001",
    "promptVersion": "prompt_ai_review_v1",
    "sourceState": "accepted"
  },
  "task": {
    "taskType": "fix_talk_track",
    "title": "补齐中高级进攻拍价格异议回应",
    "summary": "把本场高频价格异议整理成一条待审核回应话术。",
    "priority": "high",
    "ownerId": "user_host_001",
    "targetSessionId": "session_next_001",
    "deadlinePolicy": "before_next_session",
    "reviewRequired": true,
    "racketProductIds": ["racket_001"],
    "knowledgeVersionIds": ["knowledge_version_001"]
  }
}
```

### CreateNextSessionTaskCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "user_operator_001",
  "idempotencyKey": "manual-next-task-001",
  "task": {
    "taskType": "prepare_product_info",
    "title": "确认疾速 900 规格别名",
    "summary": "直播前核对型号别名、重量和推荐磅数，避免主播口径不一致。",
    "priority": "normal",
    "ownerId": "user_product_001",
    "dueAt": "2026-05-24T18:00:00+08:00",
    "deadlinePolicy": "absolute",
    "reviewRequired": false
  },
  "source": {
    "sourceWorkflow": "manual",
    "sourceId": "session_001",
    "sourceState": "manual"
  },
  "checklist": [
    {
      "title": "核对重量和中杆硬度",
      "required": true
    },
    {
      "title": "补充主播常用别名",
      "required": false
    }
  ]
}
```

### UpdateTaskStatusCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "user_host_001",
  "taskId": "next_task_001",
  "idempotencyKey": "next-task-status-001",
  "fromStatus": "assigned",
  "toStatus": "in_progress",
  "reason": "开始整理话术草稿"
}
```

### ListNextSessionTasksQuery

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "filters": {
    "status": ["assigned", "in_progress", "blocked", "reviewing"],
    "ownerId": "user_host_001",
    "targetSessionId": "session_next_001",
    "priority": ["high", "urgent"]
  },
  "sort": {
    "field": "dueAt",
    "direction": "asc"
  },
  "pagination": {
    "cursor": null,
    "limit": 20
  }
}
```

## Response Shape

```ts
type NextSessionTaskCommandResponse =
  | {
      ok: true;
      task: NextSessionTaskView;
      auditEventId: string;
      idempotencyStatus?: "created" | "replayed";
      duplicateOfTaskId?: string;
    }
  | {
      ok: false;
      errorCode: NextSessionTaskErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
      retryable?: boolean;
    };
```

```ts
type NextSessionTaskView = {
  id: string;
  title: string;
  summary: string;
  taskType: string;
  priority: string;
  status: string;
  owner: {
    id: string;
    displayName: string;
    active: boolean;
  } | null;
  dueAt: string | null;
  targetSessionId: string | null;
  sourceTrail: {
    sourceWorkflow: string;
    sourceId: string;
    sourceState: string;
    aiRunId?: string;
    sourceSectionId?: string;
  };
  checklistProgress: {
    total: number;
    completed: number;
    blocked: number;
  };
  reviewRequired: boolean;
  updatedAt: string;
};
```

列表响应必须支持 empty state、pagination、筛选摘要和红acted source trail。错误响应不得包含
原始敏感 payload。

## State Machine

```text
draft
  -> assigned
  -> in_progress
  -> done
  -> closed

draft -> canceled
assigned -> canceled
assigned -> blocked
in_progress -> blocked
blocked -> in_progress
done -> reviewing
reviewing -> closed
reviewing -> reopened
closed -> reopened
reopened -> assigned
done -> reopened
canceled -> archived
closed -> archived
```

任务状态规则：

| 状态 | 可编辑 | 可指派 | 可完成 | 可关闭 | 可用于反馈 |
| --- | --- | --- | --- | --- | --- |
| `draft` | 可编辑 | 可指派 | 不可完成 | 不可关闭 | 不可用 |
| `assigned` | 可编辑 | 可转交 | 可开始 | 不可关闭 | 可记录 |
| `in_progress` | 可编辑 | 可转交 | 可完成 | 不可关闭 | 可记录 |
| `blocked` | 可编辑阻塞信息 | 可转交 | 不可完成 | 不可关闭 | 可记录阻塞 |
| `done` | 只改结果摘要 | 不建议转交 | 已完成 | 无审核可关闭 | 可记录完成 |
| `reviewing` | 只改审核结果 | 不建议转交 | 已完成 | 审核后关闭 | 可记录审核 |
| `closed` | 不可编辑 | 不可指派 | 已完成 | 已关闭 | 可记录成效 |
| `reopened` | 可编辑 | 可指派 | 可重新完成 | 不可关闭 | 可记录重开 |
| `canceled` | 不可编辑 | 不可指派 | 不可完成 | 不可关闭 | 可记录取消 |
| `archived` | 只读 | 不可指派 | 不可完成 | 不可关闭 | 只读 |

下游来源可用规则：

| 来源状态 | 是否可创建任务 | 说明 |
| --- | --- | --- |
| AI run `review_ready` | 可作为候选 | 需要人工采纳或策略允许 |
| AI run `accepted` | 可创建 | 仍需重复检测和权限校验 |
| AI run `partially_accepted` | 仅已采纳区块可创建 | 未采纳区块不可创建 |
| AI run `rejected` / `provider_failed` / `validation_failed` | 不可创建 | 可记录失败反馈 |
| Session `review_ready` / `processed` | 可创建 | 来源必须脱敏 |
| Session `draft` / `autosaved` | 仅可人工草稿 | 不可作为 AI 下游任务 |
| Talk track `reviewing` / `published` | 可创建 | 用于修订或复用任务 |
| Knowledge gap `review_ready` | 可创建 | 需保留知识来源和审核状态 |

## Error Cases

- `VALIDATION_FAILED`：必填字段缺失、枚举非法、字符串过长。
- `AUTH_REQUIRED`：未登录或缺少有效 session。
- `UNAUTHORIZED_TENANT`：actor 访问其他租户或团队数据。
- `FORBIDDEN_ROLE`：角色不允许创建、指派、编辑、审核、归档或导出任务。
- `SOURCE_NOT_REVIEW_READY`：来源场次、AI run、区块或知识缺口状态不允许创建任务。
- `ASSIGNEE_NOT_ACTIVE`：负责人不是 active 成员或不属于当前团队。
- `DUE_DATE_INVALID`：截止时间早于允许范围或无法解析。
- `DUPLICATE_TASK`：同一来源、类型、负责人、目标场次和产品已有活动任务。
- `TASK_STATE_CONFLICT`：状态已被其他请求更新或 `fromStatus` 不匹配。
- `STATE_TRANSITION_INVALID`：状态流转非法。
- `CHECKLIST_REQUIRED_INCOMPLETE`：必填检查项未完成，不能进入完成或关闭。
- `DEPENDENCY_BLOCKED`：依赖未满足。
- `REVIEW_REQUIRED`：任务需要审核，不能直接关闭。
- `SENSITIVE_DATA_BLOCKED`：任务内容、检查项、评论、导出或审计元数据包含敏感信息。
- `IDEMPOTENCY_CONFLICT`：幂等键重复但请求摘要不一致。
- `NOT_FOUND`：任务、来源、负责人或目标场次不存在。
- `NETWORK_TIMEOUT`：保存、更新或查询超时。
- `PROVIDER_UNAVAILABLE`：未来 AI、通知、导出或外部集成 provider 不可用。

## Authorization

默认权限草案：

| 角色 | 可执行动作 |
| --- | --- |
| `viewer` | 查看已授权任务摘要 |
| `host` | 查看分配给自己的任务，更新自己的进度和检查项 |
| `operator` | 创建任务草案、指派普通任务、更新场次跟进任务、记录阻塞和完成 |
| `product_owner` | 处理产品资料、规格、知识缺口和产品相关审核任务 |
| `reviewer` | 审核 AI 来源任务、知识/话术相关任务结果、关闭 review-required 任务 |
| `admin` | 管理所有团队任务、转交、归档、导出和高风险设置 |

规则：

- 所有读写必须服务端检查 actor、tenantId、teamId、membership、role 和 target ownership。
- assignee 可以更新自己任务的进度，但不能越权修改来源、owner、review result 或导出。
- reviewer/admin 可以关闭需要审核的任务；普通 assignee 完成后进入 `reviewing`。
- UI 隐藏控件只改善体验，不作为权限边界。
- 任务导出和批量归档属于高风险操作，可要求管理员或 step-up auth。

## Sensitive Data

默认敏感数据：

- 客户原始评论、私信、订单号、手机号、地址、昵称和个人身份信息。
- 完整直播转录、完整聊天记录、未脱敏场次笔记和高敏运营数据。
- 供应商信息、内部价格策略、库存计划、转化率、GMV 或促销策略。
- 完整 prompt、provider 请求/响应、模型输出原文和评测数据。

处理规则：

- 任务正文只能保存可执行摘要和必要的低敏上下文。
- 原始敏感内容必须留在源记录，通过 `sourceId`、`sourceVersionId` 和 redaction state 引用。
- 日志、审计、错误响应、导出和截图不得包含原始敏感 payload。
- 检测到敏感内容时，未来实现必须阻止保存、脱敏或进入人工审核。

## Audit Metadata

未来任务相关写操作必须记录：

- `requestId`
- `idempotencyKey`
- `actorId`
- `tenantId`
- `teamId`
- `taskId`
- `sourceWorkflow`
- `sourceId`
- `sourceVersionId`
- `aiRunId`
- `promptVersion`
- `fromStatus`
- `toStatus`
- `createdAt` / `updatedAt`
- `reviewedBy` / `reviewedAt`
- `redactionState`

审计元数据必须脱敏，不保存完整 prompt、完整转录、客户个人信息或 provider payload。

## Verification

未来 runtime 实现至少覆盖：

- State machine tests：合法流转、非法流转、blocked 回到 in_progress、done 到 reviewing/closed、closed 重开。
- Authorization tests：跨 tenant/team 拒绝、角色权限、assignee 自己进度、reviewer 关闭、admin 归档。
- Source readiness tests：AI run、session、knowledge gap、talk track 不同状态下是否允许创建任务。
- Duplicate detection tests：同来源、类型、负责人、目标场次和产品的重复任务处理。
- Sensitive data tests：任务正文、检查项、评论、导出、日志和错误响应的脱敏/阻断。
- Idempotency tests：重复提交返回 replay，冲突提交返回 idempotency error。
- Repository tests：tenant/team scope、分页、筛选、排序、软归档和审计字段。
- UI/browser tests：未来页面变更时检查桌面/移动任务列表密度、状态标签、空态、错误态、禁用态和文字溢出。
- AI downstream tests：AI 候选只能从可用区块创建，未审核或失败输出不能进入团队任务。

已落地的本地验证：

- `DATABASE_URL="postgres://..." pnpm next-actions:check`：验证 repository 创建、列表/详情、
  重复任务、负责人活跃、权限、负责人进度、检查项/依赖、审核关闭、反馈、敏感来源、跨团队隔离和事务回滚。
- `DATABASE_URL="postgres://..." pnpm next-actions:route-check`：验证受保护 Route Handler 的
  cookie auth、tenant/team scope、CSRF mutation header、task create/list/detail、status、checklist、
  dependency、complete、review-result、feedback、跨团队隔离、no-store 响应、敏感元数据脱敏和事务回滚。

## Open Questions

- 首个浏览器任务看板切片应该从 AI 复盘采纳创建任务、人工场次跟进、知识缺口处理，还是团队负责人任务看板开始。
- 审核关闭规则应按任务类型、来源、优先级还是团队配置决定。
- `before_next_session` 截止策略是否需要等到场次排期/日历契约后再实现。
- 重复任务检测应只提示合并，还是支持显式创建重复任务并要求原因。
- 是否需要任务评论、通知、导出和报表独立契约，还是等阶段 9 外部集成再定义。
