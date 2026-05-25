import {
  operatorV0BootstrapCsrfHeaderName,
  operatorV0BootstrapCsrfHeaderValue,
  operatorV0TeamId,
  operatorV0TenantId,
  type OperatorV0Scope,
} from "@/lib/internal-trial-access"

export {
  operatorV0BootstrapCsrfHeaderName,
  operatorV0BootstrapCsrfHeaderValue,
  operatorV0TeamId,
  operatorV0TenantId,
}
export type { OperatorV0Scope }

export const sessionCaptureMutationCsrfHeaderName = "x-operation-csrf"
export const sessionCaptureMutationCsrfHeaderValue = "session-captures"

export type SessionCaptureStatus =
  | "draft"
  | "autosaved"
  | "submitted"
  | "review_ready"
  | "processing"
  | "processed"
  | "failed"
  | "archived"
  | "deleted"

export type SessionCaptureApiErrorCode =
  | "UNAUTHENTICATED"
  | "AUTH_SCOPE_REQUIRED"
  | "CSRF_HEADER_REQUIRED"
  | "VALIDATION_ERROR"
  | "LONG_INPUT_LIMIT_EXCEEDED"
  | "DUPLICATE_SESSION_LABEL"
  | "STALE_DRAFT_VERSION"
  | "MISSING_REQUIRED_FIELD"
  | "SENSITIVE_DATA_NEEDS_REVIEW"
  | "STATE_TRANSITION_INVALID"
  | "FORBIDDEN_PERMISSION"
  | "NOT_FOUND"
  | "AUTH_OPERATION_FAILED"
  | "DATABASE_OPERATION_FAILED"
  | "OPERATOR_V0_BOOTSTRAP_DISABLED"
  | "BOOTSTRAP_UNAVAILABLE"
  | string

export type SessionCaptureView = {
  id: string
  title: string
  sessionDate: string
  platform: "douyin" | "kuaishou" | "video_account" | "offline_notes" | "other"
  status: SessionCaptureStatus
  summary: string
  sourceMode: "manual" | "transcript_import" | "mixed"
  draftVersion: number
  sensitiveRedactionState: "not_needed" | "redacted" | "needs_review"
  lastAutosavedAt: string | null
  submittedAt: string | null
  hostRoles: Array<{
    id: string
    displayName: string
    role: "host" | "assistant" | "operator" | "product_specialist" | "reviewer"
    responsibility: string
  }>
  productOrder: Array<{
    id: string
    displayModel: string
    orderIndex: number
    roleInSession:
      | "opening_compare"
      | "main_offer"
      | "objection_bridge"
      | "alternative"
      | "closing_push"
    talkingPoints: string[]
    customerFit: string[]
    evidenceState: "linked_product" | "manual_only" | "needs_review"
  }>
  notes: Array<{
    id: string
    noteType:
      | "opening"
      | "product_explanation"
      | "customer_question"
      | "objection"
      | "deal_signal"
      | "gap"
      | "follow_up"
    content: string
    source: "manual" | "transcript_excerpt" | "operator_summary"
    sequence: number
    reviewState: "unreviewed" | "reviewed" | "needs_clarification"
  }>
  customerQuestions: Array<{
    id: string
    questionText: string
    topic:
      | "fit"
      | "tension"
      | "weight"
      | "balance"
      | "price"
      | "durability"
      | "comparison"
      | "after_sales"
      | "other"
    answerGiven: string
    needsKnowledge: boolean
    sensitiveRedactionState: "not_needed" | "redacted" | "needs_review"
  }>
  customerObjections: Array<{
    id: string
    objectionType:
      | "price"
      | "skill_level"
      | "too_stiff"
      | "too_head_heavy"
      | "durability"
      | "similar_owned"
      | "trust"
      | "other"
    content: string
    responseUsed: string
    resolvedState: "resolved" | "partially_resolved" | "unresolved" | "unknown"
    followUpNeeded: boolean
  }>
  downstreamReadiness: Array<{
    workflow: "ai_review" | "talk_tracks" | "next_actions" | "knowledge_gap"
    ready: boolean
    blockedBy: string[]
  }>
  createdAt: string
  updatedAt: string
}

export type SessionCaptureFormState = {
  title: string
  sessionDate: string
  platform: SessionCaptureView["platform"]
  hostName: string
  hostResponsibility: string
  productModel: string
  productRole: SessionCaptureView["productOrder"][number]["roleInSession"]
  talkingPoints: string
  customerFit: string
  evidenceState: SessionCaptureView["productOrder"][number]["evidenceState"]
  summary: string
  noteContent: string
  questionText: string
  questionTopic: SessionCaptureView["customerQuestions"][number]["topic"]
  answerGiven: string
  needsKnowledge: boolean
  objectionContent: string
  objectionType: SessionCaptureView["customerObjections"][number]["objectionType"]
  responseUsed: string
  followUpNeeded: boolean
}

export type ApiErrorBody = {
  ok?: false
  authenticated?: false
  code?: SessionCaptureApiErrorCode
  userMessage?: string
}

export const sessionStatusLabels: Record<SessionCaptureStatus, string> = {
  draft: "草稿",
  autosaved: "已保存",
  submitted: "已提交",
  review_ready: "可复盘",
  processing: "处理中",
  processed: "已处理",
  failed: "失败",
  archived: "已归档",
  deleted: "已删除",
}

export const readinessLabels: Record<
  SessionCaptureView["downstreamReadiness"][number]["workflow"],
  string
> = {
  ai_review: "智能复盘",
  talk_tracks: "话术资产",
  next_actions: "下场任务",
  knowledge_gap: "知识缺口",
}

export const blockerLabels: Record<string, string> = {
  not_submitted: "尚未提交",
  missing_host_role: "缺主播",
  missing_product_order: "缺商品顺序",
  needs_redaction_review: "需敏感内容审核",
  processing: "处理中",
  failed: "处理失败",
  archived: "已归档",
  deleted: "已删除",
  not_ready: "暂未就绪",
}

export function createDefaultSessionCaptureForm(): SessionCaptureFormState {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())

  return {
    title: "高端进攻拍对比与中高级球友选择",
    sessionDate: now.toISOString().slice(0, 16),
    platform: "douyin",
    hostName: "主讲",
    hostResponsibility: "主讲产品卖点和适用人群",
    productModel: "进攻型高端拍",
    productRole: "main_offer",
    talkingPoints: "中杆硬度, 后场进攻, 推荐磅数",
    customerFit: "中高级, 后场进攻",
    evidenceState: "manual_only",
    summary: "围绕中高级球友的进攻拍选择做手动复盘。",
    noteContent: "平衡点解释不够清楚，需要下次补充对比话术。",
    questionText: "双打后场能不能用",
    questionTopic: "fit",
    answerGiven: "适合力量较好的后场进攻型球友。",
    needsKnowledge: false,
    objectionContent: "预算超过预期",
    objectionType: "price",
    responseUsed: "先对比上手门槛和耐用性，再给替代型号。",
    followUpNeeded: true,
  }
}

export function sessionToForm(
  session: SessionCaptureView,
): SessionCaptureFormState {
  const base = createDefaultSessionCaptureForm()
  const host = session.hostRoles[0]
  const product = session.productOrder[0]
  const note = session.notes[0]
  const question = session.customerQuestions[0]
  const objection = session.customerObjections[0]
  const sessionDate = new Date(session.sessionDate)
  sessionDate.setMinutes(sessionDate.getMinutes() - sessionDate.getTimezoneOffset())

  return {
    ...base,
    title: session.title,
    sessionDate: sessionDate.toISOString().slice(0, 16),
    platform: session.platform,
    hostName: host?.displayName ?? base.hostName,
    hostResponsibility: host?.responsibility ?? base.hostResponsibility,
    productModel: product?.displayModel ?? base.productModel,
    productRole: product?.roleInSession ?? base.productRole,
    talkingPoints: product?.talkingPoints.join(", ") ?? base.talkingPoints,
    customerFit: product?.customerFit.join(", ") ?? base.customerFit,
    evidenceState: product?.evidenceState ?? base.evidenceState,
    summary: session.summary,
    noteContent: note?.content ?? "",
    questionText: question?.questionText ?? "",
    questionTopic: question?.topic ?? base.questionTopic,
    answerGiven: question?.answerGiven ?? "",
    needsKnowledge: question?.needsKnowledge ?? false,
    objectionContent: objection?.content ?? "",
    objectionType: objection?.objectionType ?? base.objectionType,
    responseUsed: objection?.responseUsed ?? "",
    followUpNeeded: objection?.followUpNeeded ?? false,
  }
}

function splitList(value: string): string[] {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function toIsoDateTime(value: string): string {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString()
  }

  return parsed.toISOString()
}

export function createSessionCapturePayload(form: SessionCaptureFormState) {
  return {
    title: form.title.trim(),
    sessionDate: toIsoDateTime(form.sessionDate),
    platform: form.platform,
    sourceMode: "manual",
    summary: form.summary.trim(),
    hostRoles: [
      {
        displayName: form.hostName.trim(),
        role: "host",
        responsibility: form.hostResponsibility.trim(),
      },
    ],
    productOrder: [
      {
        displayModel: form.productModel.trim(),
        orderIndex: 1,
        roleInSession: form.productRole,
        talkingPoints: splitList(form.talkingPoints),
        customerFit: splitList(form.customerFit),
        evidenceState: form.evidenceState,
      },
    ],
    notes: form.noteContent.trim()
      ? [
          {
            noteType: "gap",
            content: form.noteContent.trim(),
            source: "manual",
            sequence: 1,
          },
        ]
      : [],
    customerQuestions: form.questionText.trim()
      ? [
          {
            questionText: form.questionText.trim(),
            topic: form.questionTopic,
            relatedProductIds: [],
            answerGiven: form.answerGiven.trim(),
            needsKnowledge: form.needsKnowledge,
            sensitiveRedactionState: "not_needed",
          },
        ]
      : [],
    customerObjections: form.objectionContent.trim()
      ? [
          {
            objectionType: form.objectionType,
            content: form.objectionContent.trim(),
            responseUsed: form.responseUsed.trim(),
            resolvedState: "unknown",
            followUpNeeded: form.followUpNeeded,
          },
        ]
      : [],
  } as const
}

export function createSessionCaptureDraftPayload(
  session: SessionCaptureView,
  form: SessionCaptureFormState,
) {
  return {
    draftVersion: session.draftVersion,
    summary: form.summary.trim(),
    notes: form.noteContent.trim()
      ? [
          {
            noteType: "gap",
            content: form.noteContent.trim(),
            source: "manual",
            sequence: 1,
          },
        ]
      : [],
    customerQuestions: form.questionText.trim()
      ? [
          {
            questionText: form.questionText.trim(),
            topic: form.questionTopic,
            relatedProductIds: [],
            answerGiven: form.answerGiven.trim(),
            needsKnowledge: form.needsKnowledge,
            sensitiveRedactionState: "not_needed",
          },
        ]
      : [],
    customerObjections: form.objectionContent.trim()
      ? [
          {
            objectionType: form.objectionType,
            content: form.objectionContent.trim(),
            responseUsed: form.responseUsed.trim(),
            resolvedState: "unknown",
            followUpNeeded: form.followUpNeeded,
          },
        ]
      : [],
  } as const
}

export function isSessionFormReady(form: SessionCaptureFormState): boolean {
  return Boolean(
    form.title.trim() &&
      form.sessionDate.trim() &&
      form.hostName.trim() &&
      form.productModel.trim(),
  )
}

export function userMessageFromApiError(error: ApiErrorBody): string {
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
    case "STALE_DRAFT_VERSION":
      return "草稿已更新，请刷新后再保存"
    case "DUPLICATE_SESSION_LABEL":
      return "当天已存在同名场次"
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return "内容过长，请拆分后再保存"
    case "MISSING_REQUIRED_FIELD":
      return "请先补齐主播和商品顺序"
    case "SENSITIVE_DATA_NEEDS_REVIEW":
      return "敏感内容需要先审核"
    case "OPERATOR_V0_BOOTSTRAP_DISABLED":
      return "当前环境未开启演示入口"
    default:
      return "操作暂时失败，请稍后重试"
  }
}
