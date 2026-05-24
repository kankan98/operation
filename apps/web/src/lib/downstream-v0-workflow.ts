import {
  aiReviewMutationCsrfHeaderName,
  aiReviewMutationCsrfHeaderValue,
  authSessionBodyToScope,
  bootstrapBodyToScope,
  defaultOperatorV0Scope,
  operatorV0BootstrapCsrfHeaderName,
  operatorV0BootstrapCsrfHeaderValue,
  readApiBody,
  readStoredOperatorV0Scope,
  reviewStateLabels,
  scopedApi,
  sectionTypeLabels,
  storeOperatorV0Scope,
  userMessageFromAiReviewError,
  type AiReviewRunDetail,
  type AiReviewRunView,
  type AiReviewSectionView,
  type AuthSessionBody,
  type BootstrapBody,
} from "@/lib/ai-review-v0-workflow"
import type { ApiErrorBody, OperatorV0Scope } from "@/lib/session-capture-workflow"

export {
  aiReviewMutationCsrfHeaderName,
  aiReviewMutationCsrfHeaderValue,
  authSessionBodyToScope,
  bootstrapBodyToScope,
  defaultOperatorV0Scope,
  operatorV0BootstrapCsrfHeaderName,
  operatorV0BootstrapCsrfHeaderValue,
  readApiBody,
  readStoredOperatorV0Scope,
  reviewStateLabels,
  scopedApi,
  sectionTypeLabels,
  storeOperatorV0Scope,
  userMessageFromAiReviewError,
}

export const talkTrackMutationCsrfHeaderName = "x-operation-csrf"
export const talkTrackMutationCsrfHeaderValue = "talk-track-assets"
export const nextActionMutationCsrfHeaderName = "x-operation-csrf"
export const nextActionMutationCsrfHeaderValue = "next-session-tasks"
export const operatorV0ActorId = "operation_v0_operator"

export type {
  AiReviewRunDetail,
  AiReviewRunView,
  AiReviewSectionView,
  AuthSessionBody,
  BootstrapBody,
  OperatorV0Scope,
}

export type DownstreamApiErrorBody = ApiErrorBody & {
  retryable?: boolean
  requestId?: string
}

export type DownstreamArtifactType =
  | "talk_track"
  | "short_video_topic"
  | "next_session_task"

export type DownstreamSource =
  | {
      sourceKind: "ai_review"
      run: AiReviewRunView
      section: AiReviewSectionView
      promptVersionId?: string
    }
  | {
      sourceKind: "manual"
      sourceId: string
    }

export type TalkTrackAssetView = {
  id: string
  assetType:
    | "product_intro"
    | "feature_benefit"
    | "comparison"
    | "objection_reply"
    | "closing_prompt"
    | "short_video_hook"
    | "transition"
    | "qa_reply"
  title: string
  status: "draft" | "reviewing" | "published" | "deprecated" | "archived" | "rejected"
  ownerRole: "operator" | "host" | "product_owner" | "reviewer" | "admin"
  currentVersionId: string | null
  scenario: {
    liveScene: string
    playerLevel: string
    playStyle: string
    priceBand: string
    hostRole: string
    objectionType: string | null
  } | null
  currentVersion: {
    id: string
    status: TalkTrackAssetView["status"]
    body: string
    readiness: {
      ready: boolean
      blockedBy: string[]
    }
    sourceGrounding: {
      sourceType: string
      aiRunId: string | null
      claimSummary: string
    } | null
  } | null
  updatedAt: string
  createdAt: string
}

export type NextSessionTaskView = {
  id: string
  title: string
  summary: string
  taskType:
    | "fix_talk_track"
    | "review_knowledge_gap"
    | "update_product_info"
    | "prepare_comparison"
    | "follow_up_customer_question"
    | "review_ai_suggestion"
    | "other"
  priority: "low" | "normal" | "high" | "urgent"
  status:
    | "draft"
    | "assigned"
    | "in_progress"
    | "blocked"
    | "done"
    | "reviewing"
    | "closed"
    | "reopened"
    | "canceled"
    | "archived"
  owner: {
    id: string
    displayName: string
    status: string
  } | null
  sourceTrail: {
    sourceWorkflow: string
    sourceId: string
    sourceSectionId: string | null
    aiRunId: string | null
    sourceState: string
  }
  checklistProgress: {
    total: number
    completed: number
    blocked: number
  }
  checklist: Array<{
    id: string
    title: string
    status: "todo" | "done" | "blocked" | "canceled"
    required: boolean
  }>
  readiness: {
    ready: boolean
    blockedBy: string[]
  }
  reviewRequired: boolean
  updatedAt: string
  createdAt: string
}

export type TalkTrackListBody =
  | DownstreamApiErrorBody
  | {
      ok: true
      assets: TalkTrackAssetView[]
    }

export type TalkTrackCreateBody =
  | DownstreamApiErrorBody
  | {
      ok: true
      asset: TalkTrackAssetView
    }

export type NextActionListBody =
  | DownstreamApiErrorBody
  | {
      ok: true
      tasks: NextSessionTaskView[]
    }

export type NextActionCreateBody =
  | DownstreamApiErrorBody
  | {
      ok: true
      task: NextSessionTaskView
    }

export type NextActionUpdateBody =
  | DownstreamApiErrorBody
  | {
      ok: true
      task: NextSessionTaskView
    }

export type AiReviewRunListBody =
  | DownstreamApiErrorBody
  | {
      ok: true
      runs: AiReviewRunView[]
    }

export type AiReviewRunDetailBody =
  | DownstreamApiErrorBody
  | {
      ok: true
      detail: AiReviewRunDetail
    }

export type AiReviewDownstreamBody =
  | DownstreamApiErrorBody
  | {
      ok: true
      artifact: {
        id: string
        runId: string
        sectionId: string
        artifactType: DownstreamArtifactType | "knowledge_gap"
        status: "draft" | "reviewing" | "accepted" | "archived"
      }
    }

export const talkTrackStatusLabels: Record<TalkTrackAssetView["status"], string> = {
  draft: "草稿",
  reviewing: "审核中",
  published: "已发布",
  deprecated: "已停用",
  archived: "已归档",
  rejected: "已拒绝",
}

export const taskStatusLabels: Record<NextSessionTaskView["status"], string> = {
  draft: "草稿",
  assigned: "待处理",
  in_progress: "处理中",
  blocked: "已阻塞",
  done: "已完成",
  reviewing: "待复核",
  closed: "已关闭",
  reopened: "已重开",
  canceled: "已取消",
  archived: "已归档",
}

export const priorityLabels: Record<NextSessionTaskView["priority"], string> = {
  low: "低",
  normal: "普通",
  high: "高",
  urgent: "紧急",
}

export const talkTrackAssetTypeLabels: Record<TalkTrackAssetView["assetType"], string> = {
  product_intro: "商品开场",
  feature_benefit: "卖点转收益",
  comparison: "对比讲解",
  objection_reply: "异议回应",
  closing_prompt: "收口催单",
  short_video_hook: "短视频钩子",
  transition: "转场话术",
  qa_reply: "问答回应",
}

export const taskTypeLabels: Record<NextSessionTaskView["taskType"], string> = {
  fix_talk_track: "优化话术",
  review_knowledge_gap: "复核知识缺口",
  update_product_info: "更新商品信息",
  prepare_comparison: "准备对比",
  follow_up_customer_question: "跟进问题",
  review_ai_suggestion: "复核 AI 建议",
  other: "其他任务",
}

export function userMessageFromDownstreamError(error: DownstreamApiErrorBody): string {
  if (error.userMessage) {
    return error.userMessage
  }

  switch (error.code) {
    case "UNAUTHENTICATED":
      return "请先进入运营工作台"
    case "AUTH_SCOPE_REQUIRED":
      return "请选择团队后再继续"
    case "CSRF_HEADER_REQUIRED":
      return "请求无效，请刷新后重试"
    case "FORBIDDEN_PERMISSION":
      return "当前账号缺少权限"
    case "DUPLICATE_SCENARIO":
      return "该场景已有活跃话术"
    case "DUPLICATE_TASK":
      return "已存在相同来源的活跃任务"
    case "SOURCE_NOT_REVIEW_READY":
    case "REVIEW_REQUIRED":
      return "来源需要先审核"
    case "SENSITIVE_DATA_BLOCKED":
      return "内容包含敏感信息，暂不能保存"
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return "内容过长，请拆分后再保存"
    case "NOT_FOUND":
      return "未找到对应记录"
    default:
      return "操作暂时失败，请稍后重试"
  }
}

export function isAcceptedSection(section: AiReviewSectionView): boolean {
  return section.reviewState === "accepted" || section.reviewState === "edited"
}

export function downstreamArtifactTypeForSection(
  section: AiReviewSectionView,
): DownstreamArtifactType | null {
  if (!isAcceptedSection(section)) {
    return null
  }

  if (section.sectionType === "talk_track_candidate") {
    return "talk_track"
  }

  if (section.sectionType === "short_video_topic") {
    return "short_video_topic"
  }

  if (section.sectionType === "next_session_action") {
    return "next_session_task"
  }

  return null
}

export function isTalkTrackEligibleSection(section: AiReviewSectionView): boolean {
  const artifactType = downstreamArtifactTypeForSection(section)

  return artifactType === "talk_track" || artifactType === "short_video_topic"
}

export function isNextActionEligibleSection(section: AiReviewSectionView): boolean {
  return downstreamArtifactTypeForSection(section) === "next_session_task"
}

export function eligibleDownstreamSections(
  details: AiReviewRunDetail[],
  predicate: (section: AiReviewSectionView) => boolean,
): DownstreamSource[] {
  return details.flatMap((detail) =>
    detail.sections
      .filter(predicate)
      .map((section) => ({
        sourceKind: "ai_review" as const,
        run: detail.run,
        section,
      })),
  )
}

export function createAiReviewDownstreamPayload(section: AiReviewSectionView) {
  const artifactType = downstreamArtifactTypeForSection(section)

  if (!artifactType) {
    throw new Error("该区块暂不能创建下游草稿")
  }

  return {
    sectionId: section.id,
    artifactType,
    status: "draft",
  }
}

export function createTalkTrackPayloadFromSource(input: {
  source: DownstreamSource
  title: string
  body: string
}) {
  if (input.source.sourceKind === "manual") {
    return {
      asset: {
        assetType: "objection_reply",
        title: input.title.trim(),
        ownerRole: "operator",
      },
      version: {
        body: input.body.trim(),
        tone: "professional",
        language: "zh_CN",
      },
      scenario: {
        racketProductIds: [],
        playerLevel: "intermediate",
        playStyle: "attack",
        priceBand: "premium",
        liveScene: "objection_handling",
        hostRole: "host",
        objectionType: "price",
        usageConstraints: [
          "人工录入草稿，发布前需复核",
          `V0 来源 ${input.source.sourceId}`,
        ],
      },
      segments: [
        {
          segmentType: "objection_reply",
          text: input.body.trim(),
          requiredEvidence: false,
        },
      ],
      sourceGrounding: {
        sourceType: "team_experience",
        sourceIds: [input.source.sourceId],
        knowledgeVersionIds: [],
        racketProductIds: [],
        freshnessState: "unknown",
        conflictState: "none",
        sensitiveRedactionState: "not_needed",
        claimSummary: "运营人工录入的 V0 话术草稿。",
      },
    }
  }

  const { run, section } = input.source
  const isShortVideo = section.sectionType === "short_video_topic"

  return {
    asset: {
      assetType: isShortVideo ? "short_video_hook" : "objection_reply",
      title: input.title.trim(),
      ownerRole: "operator",
    },
    version: {
      body: input.body.trim(),
      tone: isShortVideo ? "friendly" : "professional",
      language: "zh_CN",
    },
    scenario: {
      racketProductIds: run ? ["operator_v0_racket_downstream_baseline"] : [],
      playerLevel: "intermediate",
      playStyle: "attack",
      priceBand: "premium",
      liveScene: isShortVideo ? "short_video" : "objection_handling",
      hostRole: "host",
      objectionType: isShortVideo ? undefined : "price",
      usageConstraints: [
        "来自已采纳 AI 复盘区块，发布前需复核",
        `AI 区块 ${section.id}`,
      ],
    },
    segments: [
      {
        segmentType: isShortVideo ? "hook" : "objection_reply",
        text: input.body.trim(),
        requiredEvidence: false,
      },
    ],
    sourceGrounding: {
      sourceType: "ai_review_run",
      sourceIds: [run.id],
      knowledgeVersionIds: ["operator_v0_knowledge_downstream_baseline"],
      racketProductIds: ["operator_v0_racket_downstream_baseline"],
      aiRunId: run.id,
      freshnessState: "current",
      conflictState: "none",
      sensitiveRedactionState: "redacted",
      claimSummary: `来自已采纳 AI 复盘区块：${sectionTypeLabels[section.sectionType]}`,
    },
  }
}

export function createManualTalkTrackSource(): DownstreamSource {
  return {
    sourceKind: "manual",
    sourceId: `manual_talk_track_${Date.now()}`,
  }
}

export function createNextActionPayloadFromSource(input: {
  source: DownstreamSource
  title: string
  summary: string
  ownerId?: string
}) {
  if (input.source.sourceKind === "manual") {
    return {
      task: {
        title: input.title.trim(),
        summary: input.summary.trim(),
        taskType: "other",
        priority: "normal",
        ownerId: input.ownerId,
        deadlinePolicy: "before_next_session",
        reviewRequired: false,
        relatedRacketProductIds: [],
      },
      source: {
        sourceWorkflow: "manual",
        sourceId: input.source.sourceId,
        sourceState: "manual",
        sensitiveRedactionState: "not_needed",
      },
      checklist: [
        {
          title: "整理可直接复用的讲解句",
          required: true,
        },
        {
          title: "开播前让主播确认",
          required: false,
        },
      ],
    }
  }

  const { run, section } = input.source

  return {
    task: {
      title: input.title.trim(),
      summary: input.summary.trim(),
      taskType: "fix_talk_track",
      priority: "high",
      ownerId: input.ownerId,
      targetSessionId: run.sessionId,
      deadlinePolicy: "before_next_session",
      reviewRequired: false,
      relatedRacketProductIds: ["operator_v0_racket_downstream_baseline"],
    },
    source: {
      sourceWorkflow: "ai_review",
      sourceId: run.id,
      sourceSectionId: section.id,
      aiRunId: run.id,
      sourceState: "accepted",
      knowledgeVersionIds: ["operator_v0_knowledge_downstream_baseline"],
      racketProductIds: ["operator_v0_racket_downstream_baseline"],
      sensitiveRedactionState: "redacted",
    },
    checklist: [
      {
        title: "整理可直接复用的讲解句",
        required: true,
      },
      {
        title: "开播前让主播确认",
        required: false,
      },
    ],
  }
}

export function createManualNextActionSource(): DownstreamSource {
  return {
    sourceKind: "manual",
    sourceId: `manual_next_action_${Date.now()}`,
  }
}

export function defaultTalkTrackDraft(source: DownstreamSource | null) {
  if (source?.sourceKind === "ai_review") {
    return {
      title:
        source.section.sectionType === "short_video_topic"
          ? "短视频选题草稿"
          : "直播异议回应草稿",
      body: source.section.summary,
    }
  }

  return {
    title: "预算异议回应草稿",
    body: "先确认球友打法和预算，再解释这支拍适合的人群，并给出更易上手的替代选择。",
  }
}

export function defaultNextActionDraft(source: DownstreamSource | null) {
  if (source?.sourceKind === "ai_review") {
    return {
      title: "补齐下场复盘动作",
      summary: source.section.summary,
    }
  }

  return {
    title: "下场前补齐预算异议回应",
    summary: "整理价格异议、替代型号和双打后场适配说明，开播前让主播确认。",
  }
}

export function formatDownstreamDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}
