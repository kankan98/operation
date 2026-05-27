import {
  type ApiErrorBody as SessionApiErrorBody,
  type OperatorV0Scope,
  type SessionCaptureView,
} from "@/lib/session-capture-workflow"
import {
  bootstrapBodyToInternalTrialScope,
  defaultInternalTrialScope,
  internalTrialScopeStorageKey,
  operatorV0BootstrapCsrfHeaderName,
  operatorV0BootstrapCsrfHeaderValue,
  readInternalTrialApiBody,
  readStoredInternalTrialScopeOrDefault,
  scopedInternalTrialApiUrl,
  sessionBodyToInternalTrialScope,
  storeInternalTrialScope,
} from "@/lib/internal-trial-access"

export {
  operatorV0BootstrapCsrfHeaderName,
  operatorV0BootstrapCsrfHeaderValue,
}

export const aiReviewMutationCsrfHeaderName = "x-operation-csrf"
export const aiReviewMutationCsrfHeaderValue = "ai-review"
export const operatorV0ScopeStorageKey = internalTrialScopeStorageKey

export type AiReviewApiErrorCode =
  | "UNAUTHENTICATED"
  | "AUTH_SCOPE_REQUIRED"
  | "CSRF_HEADER_REQUIRED"
  | "AI_REVIEW_LIVE_MODEL_DISABLED"
  | "OPERATOR_V0_AI_REVIEW_DISABLED"
  | "VALIDATION_ERROR"
  | "SESSION_NOT_REVIEW_READY"
  | "SENSITIVE_DATA_NEEDS_REVIEW"
  | "LONG_INPUT_LIMIT_EXCEEDED"
  | "INSUFFICIENT_EVIDENCE"
  | "PROMPT_VERSION_INACTIVE"
  | "AI_PROVIDER_CONFIG_MISSING"
  | "RUN_NOT_EXECUTABLE"
  | "STATE_TRANSITION_INVALID"
  | "FORBIDDEN_PERMISSION"
  | "NOT_FOUND"
  | "DATABASE_OPERATION_FAILED"
  | string

export type AiReviewApiErrorBody = SessionApiErrorBody & {
  code?: AiReviewApiErrorCode
  retryable?: boolean
  requestId?: string
}

export type AiReviewRunStatus =
  | "draft"
  | "input_ready"
  | "blocked"
  | "queued"
  | "generating"
  | "provider_failed"
  | "validating"
  | "validation_failed"
  | "review_ready"
  | "reviewing"
  | "accepted"
  | "partially_accepted"
  | "rejected"
  | "regeneration_requested"
  | "regenerated"
  | "downstream_ready"
  | "archived"

export type AiReviewSectionType =
  | "live_recap"
  | "product_diagnosis"
  | "question_cluster"
  | "objection_pattern"
  | "talk_track_candidate"
  | "short_video_topic"
  | "next_session_action"

export type AiReviewRunView = {
  id: string
  sessionId: string
  status: AiReviewRunStatus
  runType: string
  requestedSections: AiReviewSectionType[]
  createdAt: string
  updatedAt: string
}

export type AiReviewSectionView = {
  id: string
  sectionType: AiReviewSectionType
  title: string
  summary: string
  items: Array<Record<string, unknown>>
  sourceRefs: string[]
  confidence: "high" | "medium" | "low" | "unknown"
  reviewState: "pending" | "accepted" | "edited" | "rejected" | "regenerate_requested"
  position: number
}

export type AiReviewValidationView = {
  id: string
  checkType:
    | "schema"
    | "empty_section"
    | "source_grounding"
    | "stale_source"
    | "sensitive_data"
    | "fact_conflict"
    | "long_input"
    | "policy"
  status: "passed" | "warning" | "failed" | "blocked"
  message: string
  recoverable: boolean
}

export type AiReviewDecisionView = {
  id: string
  targetType: "run" | "section" | "item"
  targetId: string
  decision:
    | "accept"
    | "edit_accept"
    | "reject"
    | "request_regeneration"
    | "mark_needs_source"
  reason: string
}

export type AiReviewFeedbackSignalType =
  | "accepted"
  | "edited"
  | "rejected"
  | "regenerated"
  | "missing_knowledge"
  | "wrong_source"
  | "evidence_weak"
  | "downstream_used"

export type AiReviewFeedbackPriority = "low" | "normal" | "high" | "urgent"

export type AiReviewFeedbackRoute =
  | "evaluation_set"
  | "knowledge_review"
  | "prompt_review"
  | "none"

export type AiReviewFeedbackSignalView = {
  id: string
  runId: string
  sectionId: string | null
  signalType: AiReviewFeedbackSignalType
  reason: string
  reviewPriority: AiReviewFeedbackPriority
  routesTo: AiReviewFeedbackRoute
  actorId: string
  createdAt: string
}

export type AiReviewRunDetail = {
  run: AiReviewRunView
  inputSnapshot: {
    title: string
    sessionStatus: SessionCaptureView["status"]
    operatorSummary: string
    questionSummaries: Array<Record<string, unknown>>
    objectionSummaries: Array<Record<string, unknown>>
    noteHighlights: Array<Record<string, unknown>>
    redactionState: "not_needed" | "redacted" | "needs_review" | "blocked"
    longInputPolicy: "within_limit" | "chunked" | "truncated_with_notice" | "blocked"
  } | null
  knowledgeSnapshot: {
    knowledgeVersionIds: string[]
    racketProductVersionIds: string[]
    sourceIds: string[]
    trustSummary: Record<string, unknown>
    conflictState: "none" | "low_risk" | "blocked"
    freshnessState: "current" | "stale_warning" | "stale_blocked"
    reviewState: "published_only" | "approved_candidates" | "insufficient" | "blocked"
    intendedUse: string[]
  } | null
  output: {
    schemaVersion: string
    overallConfidence: "high" | "medium" | "low" | "unknown"
    evidenceSummary: Record<string, unknown>
  } | null
  sections: AiReviewSectionView[]
  validationResults: AiReviewValidationView[]
  decisions: AiReviewDecisionView[]
  feedbackSignals: AiReviewFeedbackSignalView[]
}

export type AuthSessionBody =
  | AiReviewApiErrorBody
  | {
      authenticated: true
      actor: {
        displayName: string
      }
      tenant: {
        id: string
        name: string
      }
      team: {
        id: string
        name: string
      }
    }

export type BootstrapBody =
  | AiReviewApiErrorBody
  | {
      ok: true
      actor: {
        displayName: string
      }
      tenant: {
        id: string
        name: string
      }
      team: {
        id: string
        name: string
      }
    }

export type SessionListBody =
  | AiReviewApiErrorBody
  | {
      ok: true
      sessions: SessionCaptureView[]
    }

export type RunListBody =
  | AiReviewApiErrorBody
  | {
      ok: true
      runs: AiReviewRunView[]
    }

export type RunCreateBody =
  | AiReviewApiErrorBody
  | {
      ok: true
      run: AiReviewRunView
    }

export type PromptVersionBody =
  | AiReviewApiErrorBody
  | {
      ok: true
      promptVersion: {
        id: string
      }
    }

export type RunExecuteBody =
  | AiReviewApiErrorBody
  | {
      ok: true
      result: {
        reviewReady: boolean
        validationStatus: "passed" | "warning" | "failed"
        detail: AiReviewRunDetail
      }
    }

export type AiReviewGenerationMode = "fake" | "live"

export type AiReviewLiveModelStatus = {
  enabled: boolean
  configured: boolean
  ready: boolean
  provider: "deepseek"
  providerApi: "chat_completions"
  model: string
  modeLabel: "真实模型"
  code:
    | "AI_REVIEW_LIVE_MODEL_READY"
    | "AI_REVIEW_LIVE_MODEL_DISABLED"
    | "AI_PROVIDER_CONFIG_MISSING"
    | "AI_PROVIDER_CONFIG_INVALID"
  userMessage: string
}

export type LiveModelStatusBody =
  | AiReviewApiErrorBody
  | {
      ok: true
      liveModel: AiReviewLiveModelStatus
    }

export type RunDetailBody =
  | AiReviewApiErrorBody
  | {
      ok: true
      detail: AiReviewRunDetail
    }

export type DecisionBody =
  | AiReviewApiErrorBody
  | {
      ok: true
      decision: AiReviewDecisionView
    }

export type FeedbackSignalBody =
  | AiReviewApiErrorBody
  | {
      ok: true
      signal: AiReviewFeedbackSignalView
    }

export const runStatusLabels: Record<AiReviewRunStatus, string> = {
  draft: "草稿",
  input_ready: "待生成",
  blocked: "已阻断",
  queued: "排队中",
  generating: "生成中",
  provider_failed: "生成失败",
  validating: "校验中",
  validation_failed: "校验失败",
  review_ready: "待审核",
  reviewing: "审核中",
  accepted: "已采纳",
  partially_accepted: "部分采纳",
  rejected: "已拒绝",
  regeneration_requested: "需重生成",
  regenerated: "已重生成",
  downstream_ready: "可下游使用",
  archived: "已归档",
}

export const sectionTypeLabels: Record<AiReviewSectionType, string> = {
  live_recap: "直播摘要",
  product_diagnosis: "讲解诊断",
  question_cluster: "问题聚类",
  objection_pattern: "异议模式",
  talk_track_candidate: "话术候选",
  short_video_topic: "短视频选题",
  next_session_action: "下场任务",
}

export const reviewStateLabels: Record<AiReviewSectionView["reviewState"], string> = {
  pending: "待审核",
  accepted: "已采纳",
  edited: "已编辑采纳",
  rejected: "已拒绝",
  regenerate_requested: "需重生成",
}

export const validationStatusLabels: Record<AiReviewValidationView["status"], string> = {
  passed: "通过",
  warning: "提醒",
  failed: "失败",
  blocked: "阻断",
}

export const feedbackSignalLabels: Record<AiReviewFeedbackSignalType, string> = {
  accepted: "已采纳",
  edited: "已编辑采纳",
  rejected: "已拒绝",
  regenerated: "需重生成",
  missing_knowledge: "缺知识",
  wrong_source: "来源不准",
  evidence_weak: "证据弱",
  downstream_used: "已下游使用",
}

export const feedbackRouteLabels: Record<AiReviewFeedbackRoute, string> = {
  evaluation_set: "评测样本",
  knowledge_review: "知识复核",
  prompt_review: "提示词复核",
  none: "仅记录",
}

export const feedbackPriorityLabels: Record<AiReviewFeedbackPriority, string> = {
  low: "低",
  normal: "普通",
  high: "高",
  urgent: "紧急",
}

export const requestedReviewSections: AiReviewSectionType[] = [
  "live_recap",
  "product_diagnosis",
  "question_cluster",
  "objection_pattern",
  "talk_track_candidate",
  "short_video_topic",
  "next_session_action",
]

export function defaultOperatorV0Scope(): OperatorV0Scope {
  return defaultInternalTrialScope()
}

export function readStoredOperatorV0Scope(): OperatorV0Scope {
  return readStoredInternalTrialScopeOrDefault()
}

export function storeOperatorV0Scope(scope: OperatorV0Scope) {
  storeInternalTrialScope(scope)
}

export function scopedApi(path: string, scope: OperatorV0Scope): string {
  return scopedInternalTrialApiUrl(path, scope)
}

export async function readApiBody<T>(response: Response): Promise<T> {
  return readInternalTrialApiBody<T>(response)
}

export function bootstrapBodyToScope(
  body: Extract<BootstrapBody, { ok: true }>,
): OperatorV0Scope {
  return bootstrapBodyToInternalTrialScope(body)
}

export function authSessionBodyToScope(
  body: Extract<AuthSessionBody, { authenticated: true }>,
): OperatorV0Scope {
  return sessionBodyToInternalTrialScope(body)
}

export function userMessageFromAiReviewError(error: AiReviewApiErrorBody): string {
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
    case "AI_REVIEW_LIVE_MODEL_DISABLED":
      return "真实模型未开启，当前可使用本地演示生成"
    case "OPERATOR_V0_AI_REVIEW_DISABLED":
      return "当前环境未开启 V0 复盘入口"
    case "SESSION_NOT_REVIEW_READY":
      return "场次尚未准备好复盘"
    case "SENSITIVE_DATA_NEEDS_REVIEW":
      return "复盘输入需要先脱敏"
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return "复盘输入过长，请先整理"
    case "INSUFFICIENT_EVIDENCE":
      return "复盘参考资料不足"
    case "PROMPT_VERSION_INACTIVE":
      return "复盘提示词暂不可用"
    case "AI_PROVIDER_CONFIG_MISSING":
      return "AI 服务配置暂不可用"
    case "RUN_NOT_EXECUTABLE":
      return "当前复盘状态暂不能生成"
    case "STATE_TRANSITION_INVALID":
      return "当前复盘状态暂不能执行该操作"
    case "FORBIDDEN_PERMISSION":
      return "需要智能复盘权限"
    case "NOT_FOUND":
      return "未找到复盘记录"
    default:
      return "操作暂时失败，请稍后重试"
  }
}

export function isSessionReadyForAiReview(session: SessionCaptureView): boolean {
  const aiReviewReadiness = session.downstreamReadiness.find(
    (item) => item.workflow === "ai_review",
  )

  return (
    (session.status === "review_ready" || session.status === "processed") &&
    aiReviewReadiness?.ready !== false
  )
}

export function sessionAiReviewBlockers(session: SessionCaptureView): string[] {
  const aiReviewReadiness = session.downstreamReadiness.find(
    (item) => item.workflow === "ai_review",
  )

  if (aiReviewReadiness?.blockedBy.length) {
    return aiReviewReadiness.blockedBy
  }

  if (!isSessionReadyForAiReview(session)) {
    return ["not_review_ready"]
  }

  return []
}

function trimText(value: string, maxLength: number): string {
  const trimmed = value.trim()

  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return `${trimmed.slice(0, maxLength - 8)}...[已截断]`
}

function sessionLongInputPolicy(
  session: SessionCaptureView,
): "within_limit" | "truncated_with_notice" {
  const totalLength =
    session.summary.length +
    session.notes.reduce((sum, note) => sum + note.content.length, 0) +
    session.customerQuestions.reduce(
      (sum, question) =>
        sum + question.questionText.length + question.answerGiven.length,
      0,
    ) +
    session.customerObjections.reduce(
      (sum, objection) =>
        sum + objection.content.length + objection.responseUsed.length,
      0,
    )

  return totalLength > 4800 ? "truncated_with_notice" : "within_limit"
}

export function createAiReviewPreparePayload(session: SessionCaptureView) {
  return {
    sessionId: session.id,
    runType: "initial_review",
    requestedSections: requestedReviewSections,
    inputSnapshot: {
      sessionStatus: session.status,
      title: session.title,
      sessionDate: session.sessionDate,
      platform: session.platform,
      hostRoles: session.hostRoles.map((host) => ({
        id: host.id,
        displayName: host.displayName,
        role: host.role,
        responsibility: host.responsibility,
      })),
      productOrder: session.productOrder.map((product) => ({
        id: product.id,
        displayModel: product.displayModel,
        orderIndex: product.orderIndex,
        roleInSession: product.roleInSession,
        talkingPoints: product.talkingPoints,
        customerFit: product.customerFit,
        evidenceState: product.evidenceState,
      })),
      operatorSummary: trimText(session.summary, 4800),
      questionSummaries: session.customerQuestions.map((question) => ({
        id: question.id,
        topic: question.topic,
        questionText: question.questionText,
        answerGiven: question.answerGiven,
        needsKnowledge: question.needsKnowledge,
      })),
      objectionSummaries: session.customerObjections.map((objection) => ({
        id: objection.id,
        objectionType: objection.objectionType,
        content: objection.content,
        responseUsed: objection.responseUsed,
        resolvedState: objection.resolvedState,
        followUpNeeded: objection.followUpNeeded,
      })),
      noteHighlights: session.notes.map((note) => ({
        id: note.id,
        noteType: note.noteType,
        content: note.content,
        source: note.source,
        reviewState: note.reviewState,
      })),
      redactionState:
        session.sensitiveRedactionState === "needs_review"
          ? "needs_review"
          : session.sensitiveRedactionState,
      longInputPolicy: sessionLongInputPolicy(session),
    },
    knowledgeSnapshot: {
      knowledgeVersionIds: ["operator_v0_knowledge_review_baseline"],
      racketProductVersionIds: ["operator_v0_racket_review_baseline"],
      sourceIds: ["operator_v0_source_review_baseline"],
      trustSummary: {
        mode: "local_v0_review_baseline",
        note: "本地 V0 复盘基线，仅用于验证浏览器工作流。",
      },
      conflictState: "none",
      freshnessState: "current",
      reviewState: "published_only",
      intendedUse: requestedReviewSections,
    },
  } as const
}

export function createAiReviewPromptVersionPayload() {
  return createAiReviewPromptVersionPayloadForMode("fake")
}

export function createAiReviewPromptVersionPayloadForMode(
  mode: AiReviewGenerationMode,
) {
  if (mode === "live") {
    return {
      name: "MVP AI 复盘真实模型结构化输出",
      version: "2026-05-25-live-mvp",
      purpose: "full_review",
      inputSchemaVersion: "session-review-input-v1",
      outputSchemaVersion: "ai-review-output-v1",
      modelPolicy: "gated DeepSeek live model structured output policy",
      status: "active",
    } as const
  }

  return {
    name: "V0 AI 复盘结构化输出",
    version: "2026-05-24-v0",
    purpose: "full_review",
    inputSchemaVersion: "session-review-input-v1",
    outputSchemaVersion: "ai-review-output-v1",
    modelPolicy: "local V0 fake-provider structured output policy",
    status: "active",
  } as const
}

export function createAiReviewProviderPolicy() {
  return createAiReviewProviderPolicyForMode("fake")
}

export function createAiReviewProviderPolicyForMode(
  mode: AiReviewGenerationMode,
  liveModel?: AiReviewLiveModelStatus | null,
) {
  if (mode === "live" && liveModel?.ready) {
    return {
      provider: liveModel.provider,
      providerApi: liveModel.providerApi,
      model: liveModel.model,
      structuredOutputRequired: true,
    } as const
  }

  return {
    provider: "local-v0-fake-provider",
    providerApi: "fake-json",
    model: "operator-v0-ai-review",
    structuredOutputRequired: true,
  } as const
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "暂无"
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function summarizeSectionItems(items: Array<Record<string, unknown>>): string {
  const firstItem = items[0]

  if (!firstItem) {
    return "暂无建议项"
  }

  const text =
    typeof firstItem.action === "string"
      ? firstItem.action
      : typeof firstItem.text === "string"
        ? firstItem.text
        : ""

  return text || "建议项待人工确认"
}

export type AiReviewFeedbackPayload = {
  sectionId: string
  signalType: AiReviewFeedbackSignalType
  reason: string
  reviewPriority: AiReviewFeedbackPriority
  routesTo: AiReviewFeedbackRoute
}

export type AiReviewFeedbackSummary = {
  total: number
  accepted: number
  rejected: number
  missingKnowledge: number
  wrongSource: number
  evidenceWeak: number
  downstreamUsed: number
  routedReview: number
}

export type AiReviewEvidenceTone = "success" | "warning" | "info" | "muted"

export type AiReviewEvidenceConfidenceSummary = {
  stage: {
    label: string
    description: string
    tone: AiReviewEvidenceTone
  }
  confidence: {
    label: string
    description: string
    tone: AiReviewEvidenceTone
  }
  sourceCoverage: {
    totalSections: number
    sectionsWithSources: number
    totalSourceRefs: number
    label: string
    tone: AiReviewEvidenceTone
  }
  validation: {
    warningCount: number
    blockerCount: number
    label: string
    tone: AiReviewEvidenceTone
  }
  reviewProgress: {
    totalSections: number
    reviewedSections: number
    acceptedSections: number
    rejectedSections: number
    pendingSections: number
    label: string
    tone: AiReviewEvidenceTone
  }
  feedback: AiReviewFeedbackSummary & {
    hotspotLabel: string
    hotspotDescription: string
    tone: AiReviewEvidenceTone
  }
  nextAction: {
    label: string
    description: string
    tone: AiReviewEvidenceTone
  }
  downstreamReady: boolean
}

export type AiReviewSectionEvidenceSummary = {
  confidenceLabel: string
  sourceLabel: string
  issueLabels: string[]
  guidanceLabel: string
  guidanceDescription: string
  tone: AiReviewEvidenceTone
  downstreamState: "not_supported" | "review_first" | "review_issue" | "ready"
}

export type AiReviewQualityRepairRoute =
  | "generate_review"
  | "validation_repair"
  | "knowledge_review"
  | "source_review"
  | "prompt_review"
  | "human_review"
  | "downstream_draft"
  | "evaluation_review"
  | "none"

export type AiReviewQualityPriorityKey =
  | "not_generated"
  | "validation_blocked"
  | "knowledge_gap"
  | "source_review"
  | "evidence_repair"
  | "human_review"
  | "downstream_ready"
  | "review_complete"

export type AiReviewQualityTriageSection = {
  sectionId: string
  sectionType: AiReviewSectionType
  title: string
  priorityKey: AiReviewQualityPriorityKey
  priorityLabel: string
  guidanceLabel: string
  guidanceDescription: string
  repairRoute: AiReviewQualityRepairRoute
  repairRouteLabel: string
  repairReasons: string[]
  tone: AiReviewEvidenceTone
  downstreamState: AiReviewSectionEvidenceSummary["downstreamState"]
}

export type AiReviewQualityTriageSummary = {
  priority: {
    key: AiReviewQualityPriorityKey
    label: string
    description: string
    tone: AiReviewEvidenceTone
  }
  repairRoute: AiReviewQualityRepairRoute
  repairRouteLabel: string
  affectedSections: number
  totalSections: number
  downstreamReady: boolean
  nextAction: {
    label: string
    description: string
    tone: AiReviewEvidenceTone
  }
  sections: AiReviewQualityTriageSection[]
}

const confidenceEvidenceLabels: Record<
  AiReviewSectionView["confidence"],
  {
    label: string
    description: string
    tone: AiReviewEvidenceTone
  }
> = {
  high: {
    label: "置信度高",
    description: "仍需人工确认事实和表达。",
    tone: "success",
  },
  medium: {
    label: "置信度中",
    description: "适合作为草案，请核对来源。",
    tone: "info",
  },
  low: {
    label: "置信度低",
    description: "先补证据或人工改写。",
    tone: "warning",
  },
  unknown: {
    label: "置信度未知",
    description: "缺少足够判断依据。",
    tone: "warning",
  },
}

const qualityRepairRouteLabels: Record<AiReviewQualityRepairRoute, string> = {
  generate_review: "生成复盘",
  validation_repair: "校验修复",
  knowledge_review: "知识复核",
  source_review: "来源复核",
  prompt_review: "提示词复核",
  human_review: "人工审核",
  downstream_draft: "下游草稿",
  evaluation_review: "评测样本",
  none: "无需处理",
}

function supportedDownstreamSection(section: AiReviewSectionView): boolean {
  return (
    section.sectionType === "talk_track_candidate" ||
    section.sectionType === "short_video_topic" ||
    section.sectionType === "next_session_action"
  )
}

function isSectionAcceptedForDownstream(section: AiReviewSectionView): boolean {
  return section.reviewState === "accepted" || section.reviewState === "edited"
}

function feedbackIssueLabels(signals: AiReviewFeedbackSignalView[]): string[] {
  const labels = new Set<string>()

  for (const signal of signals) {
    if (signal.signalType === "missing_knowledge") {
      labels.add("缺知识")
    }

    if (signal.signalType === "wrong_source") {
      labels.add("来源不准")
    }

    if (signal.signalType === "evidence_weak") {
      labels.add("证据弱")
    }

    if (signal.signalType === "rejected" || signal.signalType === "regenerated") {
      labels.add(feedbackSignalLabels[signal.signalType])
    }
  }

  return Array.from(labels)
}

function validationCounts(results: AiReviewValidationView[]) {
  return results.reduce(
    (counts, result) => {
      if (result.status === "warning") {
        counts.warning += 1
      }

      if (result.status === "failed" || result.status === "blocked") {
        counts.blocker += 1
      }

      return counts
    },
    {
      warning: 0,
      blocker: 0,
    },
  )
}

const feedbackDefaults: Record<
  AiReviewFeedbackSignalType,
  {
    reason: string
    reviewPriority: AiReviewFeedbackPriority
    routesTo: AiReviewFeedbackRoute
  }
> = {
  accepted: {
    reason: "运营采纳该复盘建议，可进入后续评测样本。",
    reviewPriority: "normal",
    routesTo: "evaluation_set",
  },
  edited: {
    reason: "运营编辑后采纳该复盘建议，需保留为评测样本。",
    reviewPriority: "normal",
    routesTo: "evaluation_set",
  },
  rejected: {
    reason: "运营暂不使用该复盘建议，后续复核提示词或输出质量。",
    reviewPriority: "normal",
    routesTo: "prompt_review",
  },
  regenerated: {
    reason: "运营认为该建议需要重新生成，后续复核提示词或输出质量。",
    reviewPriority: "normal",
    routesTo: "prompt_review",
  },
  missing_knowledge: {
    reason: "运营标记该建议缺少可审核知识支撑。",
    reviewPriority: "high",
    routesTo: "knowledge_review",
  },
  wrong_source: {
    reason: "运营标记该建议引用或依据不准确。",
    reviewPriority: "high",
    routesTo: "knowledge_review",
  },
  evidence_weak: {
    reason: "运营标记该建议证据不足，需要复核提示词或依据。",
    reviewPriority: "normal",
    routesTo: "prompt_review",
  },
  downstream_used: {
    reason: "运营已将该建议用于下游草稿，保留为后续评测样本。",
    reviewPriority: "normal",
    routesTo: "evaluation_set",
  },
}

export function createAiReviewFeedbackPayload(
  section: AiReviewSectionView,
  signalType: AiReviewFeedbackSignalType,
): AiReviewFeedbackPayload {
  return {
    sectionId: section.id,
    signalType,
    ...feedbackDefaults[signalType],
  }
}

function hasFeedbackSignal(
  signals: AiReviewFeedbackSignalView[],
  signalType: AiReviewFeedbackSignalType,
): boolean {
  return signals.some((signal) => signal.signalType === signalType)
}

export function summarizeAiReviewFeedback(
  signals: AiReviewFeedbackSignalView[],
): AiReviewFeedbackSummary {
  return signals.reduce<AiReviewFeedbackSummary>(
    (summary, signal) => {
      summary.total += 1

      if (signal.signalType === "accepted" || signal.signalType === "edited") {
        summary.accepted += 1
      }

      if (signal.signalType === "rejected" || signal.signalType === "regenerated") {
        summary.rejected += 1
      }

      if (signal.signalType === "missing_knowledge") {
        summary.missingKnowledge += 1
      }

      if (signal.signalType === "wrong_source") {
        summary.wrongSource += 1
      }

      if (signal.signalType === "evidence_weak") {
        summary.evidenceWeak += 1
      }

      if (signal.signalType === "downstream_used") {
        summary.downstreamUsed += 1
      }

      if (signal.routesTo !== "none") {
        summary.routedReview += 1
      }

      return summary
    },
    {
      total: 0,
      accepted: 0,
      rejected: 0,
      missingKnowledge: 0,
      wrongSource: 0,
      evidenceWeak: 0,
      downstreamUsed: 0,
      routedReview: 0,
    },
  )
}

export function summarizeAiReviewEvidenceConfidence(
  detail: AiReviewRunDetail,
): AiReviewEvidenceConfidenceSummary {
  const totalSections = detail.sections.length
  const sectionsWithSources = detail.sections.filter(
    (section) => section.sourceRefs.length > 0,
  ).length
  const totalSourceRefs = detail.sections.reduce(
    (sum, section) => sum + section.sourceRefs.length,
    0,
  )
  const validation = validationCounts(detail.validationResults)
  const feedback = summarizeAiReviewFeedback(detail.feedbackSignals)
  const acceptedSections = detail.sections.filter((section) =>
    isSectionAcceptedForDownstream(section),
  ).length
  const rejectedSections = detail.sections.filter(
    (section) => section.reviewState === "rejected",
  ).length
  const pendingSections = detail.sections.filter(
    (section) => section.reviewState === "pending",
  ).length
  const reviewedSections = totalSections - pendingSections
  const overallConfidence = detail.output?.overallConfidence ?? "unknown"
  const confidence = confidenceEvidenceLabels[overallConfidence]
  const hasFeedbackHotspot =
    feedback.missingKnowledge > 0 ||
    feedback.wrongSource > 0 ||
    feedback.evidenceWeak > 0
  const downstreamReady = detail.sections.some(
    (section) =>
      supportedDownstreamSection(section) && isSectionAcceptedForDownstream(section),
  )

  const hotspot =
    feedback.missingKnowledge > 0
      ? {
          hotspotLabel: "缺知识",
          hotspotDescription: "有建议缺少可审核知识支撑。",
          tone: "warning" as const,
        }
      : feedback.wrongSource > 0
        ? {
            hotspotLabel: "来源不准",
            hotspotDescription: "有建议需要复核引用或依据。",
            tone: "warning" as const,
          }
        : feedback.evidenceWeak > 0
          ? {
              hotspotLabel: "证据弱",
              hotspotDescription: "有建议证据不足，需要复核。",
              tone: "warning" as const,
            }
          : feedback.total === 0
            ? {
                hotspotLabel: "待反馈",
                hotspotDescription: "审核后会形成可复核质量信号。",
                tone: "muted" as const,
              }
            : {
                hotspotLabel: "已记录",
                hotspotDescription: "反馈信号已进入评测或复核记录。",
                tone: "success" as const,
              }

  const sourceCoverage =
    totalSections === 0
      ? {
          label: "待生成",
          tone: "muted" as const,
        }
      : sectionsWithSources === totalSections
        ? {
            label: "来源较完整",
            tone: "success" as const,
          }
        : sectionsWithSources > 0
          ? {
              label: "部分有来源",
              tone: "info" as const,
            }
          : {
              label: "缺少来源",
              tone: "warning" as const,
            }

  const validationLabel =
    validation.blocker > 0
      ? "存在阻断"
      : validation.warning > 0
        ? "有校验提醒"
        : detail.validationResults.length > 0
          ? "校验通过"
          : "待校验"

  const validationTone =
    validation.blocker > 0 || validation.warning > 0
      ? "warning"
      : detail.validationResults.length > 0
        ? "success"
        : "muted"

  const reviewTone =
    totalSections === 0
      ? "muted"
      : pendingSections > 0
        ? "info"
        : rejectedSections > 0
          ? "warning"
          : "success"

  const stage =
    totalSections === 0
      ? {
          label: "待生成",
          description: "先生成建议，再判断证据和复用。",
          tone: "muted" as const,
        }
      : validation.blocker > 0
        ? {
            label: "先处理阻断",
            description: "存在阻断校验，暂不适合下游使用。",
            tone: "warning" as const,
          }
        : hasFeedbackHotspot
          ? {
              label: "先补证据",
              description: "有质量反馈，先复核来源或知识缺口。",
              tone: "warning" as const,
            }
          : pendingSections > 0
            ? {
                label: "待人工审核",
                description: "先采纳或暂不用，再进入下游。",
                tone: "info" as const,
              }
            : downstreamReady
              ? {
                  label: "可进入下游草稿",
                  description: "已有人工采纳区块，可继续创建草稿。",
                  tone: "success" as const,
                }
              : {
                  label: "继续复核",
                  description: "暂无可下游使用的采纳区块。",
                  tone: "info" as const,
                }

  const nextAction =
    validation.blocker > 0
      ? {
          label: "先处理校验阻断",
          description: "不要把阻断结果带入话术或任务。",
          tone: "warning" as const,
        }
      : hasFeedbackHotspot
        ? {
            label: "先复核证据",
            description: "优先处理缺知识、来源不准或证据弱的区块。",
            tone: "warning" as const,
          }
        : totalSections === 0
          ? {
              label: "先生成复盘建议",
              description: "生成后再检查来源、校验和反馈。",
              tone: "muted" as const,
            }
          : pendingSections > 0
            ? {
                label: "先审核生成区块",
                description: "逐段采纳、暂不用或标记质量问题。",
                tone: "info" as const,
              }
            : downstreamReady
              ? {
                  label: "进入下游草稿",
                  description: "把已采纳建议带到话术或任务工作台。",
                  tone: "success" as const,
                }
              : {
                  label: "选择可用建议",
                  description: "暂无可复用区块，继续人工复核。",
                  tone: "info" as const,
                }

  return {
    stage,
    confidence,
    sourceCoverage: {
      totalSections,
      sectionsWithSources,
      totalSourceRefs,
      label: sourceCoverage.label,
      tone: sourceCoverage.tone,
    },
    validation: {
      warningCount: validation.warning,
      blockerCount: validation.blocker,
      label: validationLabel,
      tone: validationTone,
    },
    reviewProgress: {
      totalSections,
      reviewedSections,
      acceptedSections,
      rejectedSections,
      pendingSections,
      label:
        totalSections === 0
          ? "待审核"
          : `${reviewedSections}/${totalSections} 已审核`,
      tone: reviewTone,
    },
    feedback: {
      ...feedback,
      ...hotspot,
    },
    nextAction,
    downstreamReady,
  }
}

export function summarizeAiReviewSectionEvidence(
  detail: AiReviewRunDetail,
  section: AiReviewSectionView,
): AiReviewSectionEvidenceSummary {
  const sectionFeedback = detail.feedbackSignals.filter(
    (signal) => signal.sectionId === section.id,
  )
  const issueLabels = feedbackIssueLabels(sectionFeedback)
  const validation = validationCounts(detail.validationResults)

  if (section.sourceRefs.length === 0) {
    issueLabels.push("缺来源")
  }

  if (section.confidence === "low" || section.confidence === "unknown") {
    issueLabels.push(confidenceEvidenceLabels[section.confidence].label)
  }

  if (validation.blocker > 0) {
    issueLabels.push("校验阻断")
  } else if (validation.warning > 0) {
    issueLabels.push("校验提醒")
  }

  const uniqueIssueLabels = Array.from(new Set(issueLabels))
  const supportedDownstream = supportedDownstreamSection(section)
  const accepted = isSectionAcceptedForDownstream(section)
  const hasEvidenceIssue = uniqueIssueLabels.length > 0
  const downstreamState: AiReviewSectionEvidenceSummary["downstreamState"] =
    !supportedDownstream
      ? "not_supported"
      : !accepted
        ? "review_first"
        : hasEvidenceIssue
          ? "review_issue"
          : "ready"

  const guidance =
    downstreamState === "not_supported"
      ? {
          label: "仅用于复盘参考",
          description: "这个区块不直接创建下游草稿。",
          tone: hasEvidenceIssue ? ("warning" as const) : ("muted" as const),
        }
      : downstreamState === "review_first"
        ? {
            label: "先人工审核",
            description: "采纳后才可以进入话术或任务草稿。",
            tone: hasEvidenceIssue ? ("warning" as const) : ("info" as const),
          }
        : downstreamState === "review_issue"
          ? {
              label: "可下游但需复核",
              description: "已采纳，但仍有证据或反馈问题需要跟进。",
              tone: "warning" as const,
            }
          : {
              label: "可进入下游草稿",
              description: "已采纳且暂无明显证据问题。",
              tone: "success" as const,
            }

  return {
    confidenceLabel: confidenceEvidenceLabels[section.confidence].label,
    sourceLabel:
      section.sourceRefs.length > 0 ? `来源 ${section.sourceRefs.length}` : "缺来源",
    issueLabels: uniqueIssueLabels,
    guidanceLabel: guidance.label,
    guidanceDescription: guidance.description,
    tone: guidance.tone,
    downstreamState,
  }
}

function summarizeAiReviewQualitySection(
  detail: AiReviewRunDetail,
  section: AiReviewSectionView,
): AiReviewQualityTriageSection {
  const sectionEvidence = summarizeAiReviewSectionEvidence(detail, section)
  const sectionFeedback = detail.feedbackSignals.filter(
    (signal) => signal.sectionId === section.id,
  )
  const validation = validationCounts(detail.validationResults)
  const repairReasons = new Set(sectionEvidence.issueLabels)
  const accepted = isSectionAcceptedForDownstream(section)

  if (section.reviewState === "pending") {
    repairReasons.add("待人工审核")
  }

  if (hasFeedbackSignal(sectionFeedback, "missing_knowledge")) {
    return {
      sectionId: section.id,
      sectionType: section.sectionType,
      title: section.title || sectionTypeLabels[section.sectionType],
      priorityKey: "knowledge_gap",
      priorityLabel: "先补知识",
      guidanceLabel: "补知识后再用",
      guidanceDescription: "该建议缺少可审核知识支撑，先进入知识复核。",
      repairRoute: "knowledge_review",
      repairRouteLabel: qualityRepairRouteLabels.knowledge_review,
      repairReasons: Array.from(repairReasons),
      tone: "warning",
      downstreamState: sectionEvidence.downstreamState,
    }
  }

  if (hasFeedbackSignal(sectionFeedback, "wrong_source")) {
    return {
      sectionId: section.id,
      sectionType: section.sectionType,
      title: section.title || sectionTypeLabels[section.sectionType],
      priorityKey: "source_review",
      priorityLabel: "先核来源",
      guidanceLabel: "复核来源",
      guidanceDescription: "该建议的引用或依据不稳，先核对来源再进入下游。",
      repairRoute: "source_review",
      repairRouteLabel: qualityRepairRouteLabels.source_review,
      repairReasons: Array.from(repairReasons),
      tone: "warning",
      downstreamState: sectionEvidence.downstreamState,
    }
  }

  if (validation.blocker > 0) {
    repairReasons.add("校验阻断")

    return {
      sectionId: section.id,
      sectionType: section.sectionType,
      title: section.title || sectionTypeLabels[section.sectionType],
      priorityKey: "validation_blocked",
      priorityLabel: "先处理阻断",
      guidanceLabel: "暂不下游",
      guidanceDescription: "本轮复盘存在阻断校验，先修复后再判断复用。",
      repairRoute: "validation_repair",
      repairRouteLabel: qualityRepairRouteLabels.validation_repair,
      repairReasons: Array.from(repairReasons),
      tone: "warning",
      downstreamState: sectionEvidence.downstreamState,
    }
  }

  if (
    hasFeedbackSignal(sectionFeedback, "evidence_weak") ||
    section.sourceRefs.length === 0 ||
    section.confidence === "low" ||
    section.confidence === "unknown" ||
    validation.warning > 0
  ) {
    if (hasFeedbackSignal(sectionFeedback, "evidence_weak")) {
      repairReasons.add("证据弱")
    }

    return {
      sectionId: section.id,
      sectionType: section.sectionType,
      title: section.title || sectionTypeLabels[section.sectionType],
      priorityKey: "evidence_repair",
      priorityLabel: "先补证据",
      guidanceLabel: "补证据再用",
      guidanceDescription: "该建议需要补充来源、置信度或校验依据。",
      repairRoute: "prompt_review",
      repairRouteLabel: qualityRepairRouteLabels.prompt_review,
      repairReasons: Array.from(repairReasons),
      tone: "warning",
      downstreamState: sectionEvidence.downstreamState,
    }
  }

  if (!accepted) {
    return {
      sectionId: section.id,
      sectionType: section.sectionType,
      title: section.title || sectionTypeLabels[section.sectionType],
      priorityKey: "human_review",
      priorityLabel: "先审核",
      guidanceLabel: "先人工判断",
      guidanceDescription: "采纳或暂不用后，再决定是否进入下游。",
      repairRoute: "human_review",
      repairRouteLabel: qualityRepairRouteLabels.human_review,
      repairReasons: Array.from(repairReasons),
      tone: "info",
      downstreamState: sectionEvidence.downstreamState,
    }
  }

  if (sectionEvidence.downstreamState === "ready") {
    return {
      sectionId: section.id,
      sectionType: section.sectionType,
      title: section.title || sectionTypeLabels[section.sectionType],
      priorityKey: "downstream_ready",
      priorityLabel: "可建草稿",
      guidanceLabel: "进入下游草稿",
      guidanceDescription: "已人工采纳，可继续创建话术或任务草稿。",
      repairRoute: "downstream_draft",
      repairRouteLabel: qualityRepairRouteLabels.downstream_draft,
      repairReasons: Array.from(repairReasons),
      tone: "success",
      downstreamState: sectionEvidence.downstreamState,
    }
  }

  return {
    sectionId: section.id,
    sectionType: section.sectionType,
    title: section.title || sectionTypeLabels[section.sectionType],
    priorityKey: "review_complete",
    priorityLabel: "已复核",
    guidanceLabel: "保留复盘参考",
    guidanceDescription: "该区块已复核，但不直接进入下游草稿。",
    repairRoute: "evaluation_review",
    repairRouteLabel: qualityRepairRouteLabels.evaluation_review,
    repairReasons: Array.from(repairReasons),
    tone: "muted",
    downstreamState: sectionEvidence.downstreamState,
  }
}

export function summarizeAiReviewQualityTriage(
  detail: AiReviewRunDetail,
): AiReviewQualityTriageSummary {
  const totalSections = detail.sections.length

  if (totalSections === 0) {
    return {
      priority: {
        key: "not_generated",
        label: "待生成建议",
        description: "先生成复盘建议，再判断质量卡点。",
        tone: "muted",
      },
      repairRoute: "generate_review",
      repairRouteLabel: qualityRepairRouteLabels.generate_review,
      affectedSections: 0,
      totalSections,
      downstreamReady: false,
      nextAction: {
        label: "先生成复盘建议",
        description: "生成后再检查来源、反馈、校验和人工审核状态。",
        tone: "muted",
      },
      sections: [],
    }
  }

  const sections = detail.sections.map((section) =>
    summarizeAiReviewQualitySection(detail, section),
  )
  const priorityOrder: AiReviewQualityPriorityKey[] = [
    "validation_blocked",
    "knowledge_gap",
    "source_review",
    "evidence_repair",
    "human_review",
    "downstream_ready",
    "review_complete",
    "not_generated",
  ]
  const prioritySection = sections
    .filter((section) => section.priorityKey !== "review_complete")
    .sort(
      (left, right) =>
        priorityOrder.indexOf(left.priorityKey) -
        priorityOrder.indexOf(right.priorityKey),
    )[0]
  const downstreamReady = sections.some(
    (section) => section.priorityKey === "downstream_ready",
  )
  const affectedSections = sections.filter(
    (section) =>
      section.priorityKey !== "downstream_ready" &&
      section.priorityKey !== "review_complete",
  ).length

  if (!prioritySection) {
    return {
      priority: {
        key: "review_complete",
        label: "已完成复核",
        description: "当前没有明显质量卡点，可保留为复盘参考。",
        tone: "success",
      },
      repairRoute: "evaluation_review",
      repairRouteLabel: qualityRepairRouteLabels.evaluation_review,
      affectedSections,
      totalSections,
      downstreamReady,
      nextAction: {
        label: downstreamReady ? "创建下游草稿" : "沉淀评测样本",
        description: downstreamReady
          ? "把已采纳建议带到话术或任务工作台。"
          : "保留复盘和人工判断，后续用于评测改进。",
        tone: downstreamReady ? "success" : "info",
      },
      sections,
    }
  }

  return {
    priority: {
      key: prioritySection.priorityKey,
      label: prioritySection.priorityLabel,
      description: prioritySection.guidanceDescription,
      tone: prioritySection.tone,
    },
    repairRoute: prioritySection.repairRoute,
    repairRouteLabel: prioritySection.repairRouteLabel,
    affectedSections,
    totalSections,
    downstreamReady: downstreamReady && affectedSections === 0,
    nextAction: {
      label: prioritySection.guidanceLabel,
      description:
        prioritySection.repairRoute === "downstream_draft"
          ? "把已采纳建议带到话术或任务工作台。"
          : prioritySection.guidanceDescription,
      tone: prioritySection.tone,
    },
    sections,
  }
}

export function recentAiReviewFeedback(
  signals: AiReviewFeedbackSignalView[],
  limit = 4,
): AiReviewFeedbackSignalView[] {
  return [...signals]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit)
}
