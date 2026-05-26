import {
  readInternalTrialApiBody,
  scopedInternalTrialApiUrl,
  trialAccessUserMessage,
  type OperatorV0Scope,
} from "./internal-trial-access"

export const v0TrialFeedbackCsrfHeaderName = "x-operation-csrf"
export const v0TrialFeedbackCsrfHeaderValue = "v0-trial-feedback"

export const v0TrialFeedbackEvaluatorRoleOptions = [
  { value: "live_operator", label: "直播运营" },
  { value: "host_assistant", label: "主播/助播" },
  { value: "product_owner", label: "商品负责人" },
  { value: "team_lead", label: "团队负责人" },
  { value: "reviewer", label: "评估人员" },
  { value: "other", label: "其他" },
] as const

export const v0TrialFeedbackWorkbenchOptions = [
  { value: "overview", label: "总览" },
  { value: "trial", label: "试用入口" },
  { value: "sessions", label: "直播场次" },
  { value: "rackets", label: "球拍产品" },
  { value: "knowledge", label: "资料来源" },
  { value: "ai_review", label: "智能复盘" },
  { value: "talk_tracks", label: "话术资产" },
  { value: "next_actions", label: "下场任务" },
] as const

export const v0TrialFeedbackIssueTypeOptions = [
  { value: "copy_confusion", label: "文案不清楚" },
  { value: "missing_data", label: "缺少数据" },
  { value: "ai_quality", label: "复盘质量" },
  { value: "workflow_break", label: "流程卡住" },
  { value: "mobile_layout", label: "移动端体验" },
  { value: "source_trust", label: "来源信任" },
  { value: "downstream_action", label: "下游动作" },
  { value: "performance", label: "加载速度" },
  { value: "other", label: "其他" },
] as const

export const v0TrialFeedbackRealWorkSignalOptions = [
  { value: "yes", label: "可以" },
  { value: "maybe", label: "需要打磨" },
  { value: "no", label: "暂不能" },
  { value: "not_sure", label: "不确定" },
] as const

export type V0TrialFeedbackEvaluatorRole =
  (typeof v0TrialFeedbackEvaluatorRoleOptions)[number]["value"]
export type V0TrialFeedbackWorkbench =
  (typeof v0TrialFeedbackWorkbenchOptions)[number]["value"]
export type V0TrialFeedbackIssueType =
  (typeof v0TrialFeedbackIssueTypeOptions)[number]["value"]
export type V0TrialFeedbackRealWorkSignal =
  (typeof v0TrialFeedbackRealWorkSignalOptions)[number]["value"]

export type V0TrialFeedbackInput = {
  evaluatorRole: V0TrialFeedbackEvaluatorRole
  workbench: V0TrialFeedbackWorkbench
  pagePath: string
  usefulnessRating: number
  clarityRating: number
  issueType: V0TrialFeedbackIssueType
  note: string
  realWorkSignal: V0TrialFeedbackRealWorkSignal
}

export type V0TrialFeedbackItem = V0TrialFeedbackInput & {
  actorId: string
  createdAt: string
  id: string
}

export type V0TrialFeedbackEvidenceFocus =
  | "collect_more_feedback"
  | "experience_polish"
  | "sample_data"
  | "ai_quality"
  | "source_trust"
  | "downstream_workflow"
  | "production_readiness"

export type V0TrialFeedbackCountBucket = {
  count: number
  value: string
}

export type V0TrialFeedbackHotspot = {
  count: number
  issueType: V0TrialFeedbackIssueType
  lowRatingCount: number
  realWorkBlockerCount: number
  workbench: V0TrialFeedbackWorkbench
}

export type V0TrialFeedbackRecentNote = {
  clarityRating: number
  createdAt: string
  id: string
  issueType: V0TrialFeedbackIssueType
  note: string
  realWorkSignal: V0TrialFeedbackRealWorkSignal | null
  usefulnessRating: number
  workbench: V0TrialFeedbackWorkbench
}

export type V0TrialFeedbackEvidenceRecommendation = {
  focus: V0TrialFeedbackEvidenceFocus
  issueType: V0TrialFeedbackIssueType | null
  rationale: string
  workbench: V0TrialFeedbackWorkbench | null
}

export type V0TrialFeedbackEvidenceSummary = {
  hotspots: V0TrialFeedbackHotspot[]
  includedCount: number
  issueTypeCounts: V0TrialFeedbackCountBucket[]
  lowClarityCount: number
  lowUsefulnessCount: number
  realWorkSignals: Record<V0TrialFeedbackRealWorkSignal | "unknown", number>
  recentNotes: V0TrialFeedbackRecentNote[]
  recommendation: V0TrialFeedbackEvidenceRecommendation
  totalCount: number
  workbenchCounts: V0TrialFeedbackCountBucket[]
}

export type V0TrialFeedbackApiErrorBody = {
  ok?: false
  code?: string
  requestId?: string
  retryable?: boolean
  userMessage?: string
}

export type V0TrialFeedbackListBody =
  | V0TrialFeedbackApiErrorBody
  | {
      ok: true
      requestId: string
      feedback: V0TrialFeedbackItem[]
      summary: V0TrialFeedbackEvidenceSummary
    }

export type V0TrialFeedbackCreateBody =
  | V0TrialFeedbackApiErrorBody
  | {
      ok: true
      requestId: string
      feedback: V0TrialFeedbackItem
    }

export function trialFeedbackUserMessage(body: unknown): string {
  if (body && typeof body === "object" && "userMessage" in body) {
    const message = (body as { userMessage?: unknown }).userMessage

    if (typeof message === "string" && message.trim()) {
      return message
    }
  }

  return trialAccessUserMessage(body)
}

export async function listV0TrialFeedback(input: {
  scope: OperatorV0Scope
  limit?: number
}): Promise<{
  body: V0TrialFeedbackListBody
  ok: boolean
  status: number
}> {
  const url = scopedInternalTrialApiUrl(
    `/api/trial-feedback?limit=${input.limit ?? 3}`,
    input.scope,
  )
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  })
  const body = await readInternalTrialApiBody<V0TrialFeedbackListBody>(response)

  return {
    body,
    ok: response.ok && "ok" in body && body.ok === true,
    status: response.status,
  }
}

export async function submitV0TrialFeedback(input: {
  feedback: V0TrialFeedbackInput
  scope: OperatorV0Scope
}): Promise<{
  body: V0TrialFeedbackCreateBody
  ok: boolean
  status: number
}> {
  const response = await fetch(scopedInternalTrialApiUrl("/api/trial-feedback", input.scope), {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      [v0TrialFeedbackCsrfHeaderName]: v0TrialFeedbackCsrfHeaderValue,
    },
    body: JSON.stringify(input.feedback),
  })
  const body = await readInternalTrialApiBody<V0TrialFeedbackCreateBody>(response)

  return {
    body,
    ok: response.ok && "ok" in body && body.ok === true,
    status: response.status,
  }
}

export function feedbackOptionLabel(
  options: readonly { label: string; value: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value
}
