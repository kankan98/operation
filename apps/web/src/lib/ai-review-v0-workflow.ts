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
