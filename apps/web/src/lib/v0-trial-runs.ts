import {
  readInternalTrialApiBody,
  scopedInternalTrialApiUrl,
  trialAccessUserMessage,
  type OperatorV0Scope,
} from "./internal-trial-access"
import type {
  V0TrialFeedbackEvaluatorRole,
  V0TrialFeedbackIssueType,
} from "./v0-trial-feedback"

export const v0TrialRunCsrfHeaderName = "x-operation-csrf"
export const v0TrialRunCsrfHeaderValue = "v0-trial-run"

export const v0TrialRunStepOptions = [
  {
    href: "/sessions",
    label: "直播场次",
    stepId: "sessions",
    task: "检查摘要、客户问题和购买异议是否能承接复盘。",
  },
  {
    href: "/rackets",
    label: "球拍产品",
    stepId: "rackets",
    task: "检查型号、卖点、别名、来源和发布状态。",
  },
  {
    href: "/knowledge",
    label: "资料来源",
    stepId: "knowledge",
    task: "检查资料来源、团队经验和审核状态。",
  },
  {
    href: "/ai-review",
    label: "智能复盘",
    stepId: "ai_review",
    task: "生成或查看复盘建议，并判断证据是否可信。",
  },
  {
    href: "/talk-tracks",
    label: "话术资产",
    stepId: "talk_tracks",
    task: "检查已采纳内容是否能沉淀成可复核话术。",
  },
  {
    href: "/next-actions",
    label: "下场任务",
    stepId: "next_actions",
    task: "检查下场动作是否有负责人、检查项和状态。",
  },
] as const

export type V0TrialRunStepId = (typeof v0TrialRunStepOptions)[number]["stepId"]
export type V0TrialRunStatus =
  | "active"
  | "completed"
  | "abandoned"
  | "archived"
export type V0TrialRunStepStatus =
  | "pending"
  | "passed"
  | "issue"
  | "skipped"
export type V0TrialRunFrictionType = V0TrialFeedbackIssueType

export type V0TrialRunStepView = {
  completedAt: string | null
  frictionType: V0TrialRunFrictionType | null
  id: string
  note: string
  runId: string
  status: V0TrialRunStepStatus
  stepId: V0TrialRunStepId
  updatedAt: string
}

export type V0TrialRunSummary = {
  activeRunCount: number
  completedRunCount: number
  issueStepCount: number
  latestRunId: string | null
  nextAction: {
    href: string | null
    label: string
    stepId: V0TrialRunStepId | null
  }
  skippedStepCount: number
  stepCoverage: Record<V0TrialRunStepId, number>
  totalRuns: number
}

export type V0TrialRunDetail = {
  actorId: string
  completedAt: string | null
  createdAt: string
  evaluatorRole: V0TrialFeedbackEvaluatorRole
  id: string
  startedAt: string
  status: V0TrialRunStatus
  steps: V0TrialRunStepView[]
  summary: V0TrialRunSummary
  summaryNote: string
  teamId: string
  tenantId: string
  updatedAt: string
}

export type V0TrialRunApiErrorBody = {
  ok?: false
  code?: string
  requestId?: string
  retryable?: boolean
  userMessage?: string
}

export type V0TrialRunListBody =
  | V0TrialRunApiErrorBody
  | {
      ok: true
      requestId: string
      runs: V0TrialRunDetail[]
      summary: V0TrialRunSummary
    }

export type V0TrialRunSingleBody =
  | V0TrialRunApiErrorBody
  | {
      ok: true
      requestId: string
      run: V0TrialRunDetail
    }

type TrialRunFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>

export function trialRunUserMessage(body: unknown): string {
  if (body && typeof body === "object" && "userMessage" in body) {
    const message = (body as { userMessage?: unknown }).userMessage

    if (typeof message === "string" && message.trim()) {
      return message
    }
  }

  return trialAccessUserMessage(body)
}

export function trialRunStepStatusLabel(status: V0TrialRunStepStatus): string {
  switch (status) {
    case "pending":
      return "待检查"
    case "passed":
      return "通过"
    case "issue":
      return "有卡点"
    case "skipped":
      return "跳过"
  }
}

function responseOk(body: V0TrialRunListBody | V0TrialRunSingleBody): boolean {
  return "ok" in body && body.ok === true
}

export async function listV0TrialRuns(input: {
  fetcher?: TrialRunFetch
  limit?: number
  scope: OperatorV0Scope
  status?: V0TrialRunStatus
}): Promise<{
  body: V0TrialRunListBody
  ok: boolean
  status: number
}> {
  const fetcher = input.fetcher ?? fetch
  const params = new URLSearchParams()

  params.set("limit", String(input.limit ?? 5))

  if (input.status) {
    params.set("status", input.status)
  }

  const response = await fetcher(
    scopedInternalTrialApiUrl(`/api/trial-runs?${params.toString()}`, input.scope),
    {
      cache: "no-store",
      credentials: "include",
      method: "GET",
    },
  )
  const body = await readInternalTrialApiBody<V0TrialRunListBody>(response)

  return {
    body,
    ok: response.ok && responseOk(body),
    status: response.status,
  }
}

export async function startV0TrialRun(input: {
  evaluatorRole: V0TrialFeedbackEvaluatorRole
  fetcher?: TrialRunFetch
  scope: OperatorV0Scope
}): Promise<{
  body: V0TrialRunSingleBody
  ok: boolean
  status: number
}> {
  const fetcher = input.fetcher ?? fetch
  const response = await fetcher(scopedInternalTrialApiUrl("/api/trial-runs", input.scope), {
    body: JSON.stringify({
      evaluatorRole: input.evaluatorRole,
    }),
    cache: "no-store",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      [v0TrialRunCsrfHeaderName]: v0TrialRunCsrfHeaderValue,
    },
    method: "POST",
  })
  const body = await readInternalTrialApiBody<V0TrialRunSingleBody>(response)

  return {
    body,
    ok: response.ok && responseOk(body),
    status: response.status,
  }
}

export async function updateV0TrialRunStep(input: {
  fetcher?: TrialRunFetch
  input: {
    frictionType?: V0TrialRunFrictionType | null
    note: string
    status: V0TrialRunStepStatus
  }
  runId: string
  scope: OperatorV0Scope
  stepId: V0TrialRunStepId
}): Promise<{
  body: V0TrialRunSingleBody
  ok: boolean
  status: number
}> {
  const fetcher = input.fetcher ?? fetch
  const response = await fetcher(
    scopedInternalTrialApiUrl(
      `/api/trial-runs/${encodeURIComponent(input.runId)}/steps/${input.stepId}`,
      input.scope,
    ),
    {
      body: JSON.stringify(input.input),
      cache: "no-store",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        [v0TrialRunCsrfHeaderName]: v0TrialRunCsrfHeaderValue,
      },
      method: "PATCH",
    },
  )
  const body = await readInternalTrialApiBody<V0TrialRunSingleBody>(response)

  return {
    body,
    ok: response.ok && responseOk(body),
    status: response.status,
  }
}

export async function completeV0TrialRun(input: {
  fetcher?: TrialRunFetch
  runId: string
  scope: OperatorV0Scope
  summaryNote?: string
}): Promise<{
  body: V0TrialRunSingleBody
  ok: boolean
  status: number
}> {
  const fetcher = input.fetcher ?? fetch
  const response = await fetcher(
    scopedInternalTrialApiUrl(
      `/api/trial-runs/${encodeURIComponent(input.runId)}`,
      input.scope,
    ),
    {
      body: JSON.stringify({
        status: "completed",
        summaryNote: input.summaryNote ?? "",
      }),
      cache: "no-store",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        [v0TrialRunCsrfHeaderName]: v0TrialRunCsrfHeaderValue,
      },
      method: "PATCH",
    },
  )
  const body = await readInternalTrialApiBody<V0TrialRunSingleBody>(response)

  return {
    body,
    ok: response.ok && responseOk(body),
    status: response.status,
  }
}
