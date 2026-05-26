export type TrialWorkflowStepId =
  | "sessions"
  | "rackets"
  | "knowledge"
  | "ai-review"
  | "talk-tracks"
  | "next-actions"

export type TrialWorkflowStepStatus = "empty" | "started" | "error"

export type TrialWorkflowSummaryStatus =
  | "empty"
  | "partial"
  | "complete"
  | "error"

export type TrialWorkflowCollectionKey =
  | "sessions"
  | "products"
  | "sources"
  | "runs"
  | "assets"
  | "tasks"

export type TrialWorkflowStepDefinition = {
  id: TrialWorkflowStepId
  title: string
  href: string
  apiPath: string
  collectionKey: TrialWorkflowCollectionKey
  emptyLabel: string
  startedLabel: string
  nextActionLabel: string
}

export type TrialWorkflowStepCheck = {
  id: TrialWorkflowStepId
  ok: boolean
  count?: number
  message?: string
}

export type TrialWorkflowStepSummary = TrialWorkflowStepDefinition & {
  count: number
  countLabel: string
  message: string
  status: TrialWorkflowStepStatus
  statusLabel: string
}

export type TrialWorkflowReadinessSummary = {
  emptySteps: number
  failedSteps: number
  headline: string
  nextStep: TrialWorkflowStepSummary
  progressLabel: string
  startedSteps: number
  status: TrialWorkflowSummaryStatus
  steps: TrialWorkflowStepSummary[]
  totalSteps: number
}

export const trialWorkflowSteps: readonly TrialWorkflowStepDefinition[] = [
  {
    id: "sessions",
    title: "直播场次",
    href: "/sessions",
    apiPath: "/api/sessions/captures",
    collectionKey: "sessions",
    emptyLabel: "先记录本场直播",
    startedLabel: "已有场次",
    nextActionLabel: "记录直播场次",
  },
  {
    id: "rackets",
    title: "球拍产品",
    href: "/rackets",
    apiPath: "/api/rackets/products",
    collectionKey: "products",
    emptyLabel: "补充主推型号",
    startedLabel: "已有产品",
    nextActionLabel: "复核球拍资料",
  },
  {
    id: "knowledge",
    title: "资料来源",
    href: "/knowledge",
    apiPath: "/api/knowledge/sources",
    collectionKey: "sources",
    emptyLabel: "登记可信来源",
    startedLabel: "已有来源",
    nextActionLabel: "整理可信来源",
  },
  {
    id: "ai-review",
    title: "智能复盘",
    href: "/ai-review",
    apiPath: "/api/ai-review/runs",
    collectionKey: "runs",
    emptyLabel: "生成复盘建议",
    startedLabel: "已有复盘",
    nextActionLabel: "生成复盘建议",
  },
  {
    id: "talk-tracks",
    title: "话术资产",
    href: "/talk-tracks",
    apiPath: "/api/talk-tracks/assets",
    collectionKey: "assets",
    emptyLabel: "沉淀可用话术",
    startedLabel: "已有话术",
    nextActionLabel: "沉淀话术资产",
  },
  {
    id: "next-actions",
    title: "下场任务",
    href: "/next-actions",
    apiPath: "/api/next-actions/tasks",
    collectionKey: "tasks",
    emptyLabel: "安排下场任务",
    startedLabel: "已有任务",
    nextActionLabel: "安排下场任务",
  },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function safeCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0
  }

  return Math.floor(value)
}

export function extractTrialWorkflowCollectionCount(
  body: unknown,
  collectionKey: TrialWorkflowCollectionKey,
): number | null {
  if (!isRecord(body) || body.ok !== true) {
    return null
  }

  const collection = body[collectionKey]

  if (!Array.isArray(collection)) {
    return null
  }

  return collection.length
}

export function buildTrialWorkflowReadinessSummary(
  checks: readonly TrialWorkflowStepCheck[],
): TrialWorkflowReadinessSummary {
  const checksById = new Map(checks.map((check) => [check.id, check]))
  const steps = trialWorkflowSteps.map((step) => {
    const check = checksById.get(step.id)
    const count = safeCount(check?.count)
    const isOk = check?.ok === true
    const status: TrialWorkflowStepStatus = isOk
      ? count > 0
        ? "started"
        : "empty"
      : "error"
    const statusLabel =
      status === "started"
        ? step.startedLabel
        : status === "empty"
          ? step.emptyLabel
          : "检查失败"

    return {
      ...step,
      count,
      countLabel: status === "error" ? "待重试" : `${count} 条`,
      message:
        status === "error"
          ? (check?.message ?? "进度检查失败，请重试")
          : statusLabel,
      status,
      statusLabel,
    }
  })
  const totalSteps = steps.length
  const failedSteps = steps.filter((step) => step.status === "error").length
  const startedSteps = steps.filter((step) => step.status === "started").length
  const emptySteps = steps.filter((step) => step.status === "empty").length
  const firstEmptyStep = steps.find((step) => step.status === "empty")
  const firstFailedStep = steps.find((step) => step.status === "error")
  const status: TrialWorkflowSummaryStatus =
    failedSteps > 0
      ? "error"
      : startedSteps === 0
        ? "empty"
        : startedSteps === totalSteps
          ? "complete"
          : "partial"
  const nextStep =
    firstEmptyStep ?? firstFailedStep ?? steps[steps.length - 1] ?? steps[0]
  const progressLabel = `${startedSteps}/${totalSteps} 已开始`
  const headline =
    status === "complete"
      ? "V0 路径已填充"
      : status === "partial"
        ? `继续${nextStep.nextActionLabel}`
        : status === "error"
          ? "进度检查需要重试"
          : "先记录直播场次"

  return {
    emptySteps,
    failedSteps,
    headline,
    nextStep,
    progressLabel,
    startedSteps,
    status,
    steps,
    totalSteps,
  }
}
