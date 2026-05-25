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
