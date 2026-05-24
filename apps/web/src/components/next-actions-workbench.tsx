"use client"

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  ClipboardList,
  Loader2,
  LogIn,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react"

import { MotionListItem, MotionPanel } from "@/components/workspace-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  aiReviewMutationCsrfHeaderName,
  aiReviewMutationCsrfHeaderValue,
  authSessionBodyToScope,
  bootstrapBodyToScope,
  createAiReviewDownstreamPayload,
  createManualNextActionSource,
  createNextActionPayloadFromSource,
  defaultNextActionDraft,
  defaultOperatorV0Scope,
  eligibleDownstreamSections,
  formatDownstreamDate,
  isNextActionEligibleSection,
  nextActionMutationCsrfHeaderName,
  nextActionMutationCsrfHeaderValue,
  operatorV0ActorId,
  operatorV0BootstrapCsrfHeaderName,
  operatorV0BootstrapCsrfHeaderValue,
  priorityLabels,
  readApiBody,
  readStoredOperatorV0Scope,
  scopedApi,
  sectionTypeLabels,
  storeOperatorV0Scope,
  taskStatusLabels,
  taskTypeLabels,
  userMessageFromDownstreamError,
  type AiReviewDownstreamBody,
  type AiReviewRunDetail,
  type AiReviewRunDetailBody,
  type AiReviewRunListBody,
  type AuthSessionBody,
  type BootstrapBody,
  type DownstreamApiErrorBody,
  type DownstreamSource,
  type NextActionCreateBody,
  type NextActionListBody,
  type NextActionUpdateBody,
  type NextSessionTaskView,
  type OperatorV0Scope,
} from "@/lib/downstream-v0-workflow"
import { cn } from "@/lib/utils"

type WorkbenchPhase = "checking" | "entry" | "ready" | "error"
type ActionState = "idle" | "entering" | "loading" | "saving" | "updating"

type NextActionDraft = {
  title: string
  summary: string
}

const fieldClassName =
  "min-h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"

const textareaClassName = cn(fieldClassName, "min-h-28 resize-y leading-6")

const blockerLabels: Record<string, string> = {
  sensitive_data_needs_review: "需敏感内容复核",
  missing_owner: "缺负责人",
  draft: "仍是草稿",
  task_blocked: "任务已阻塞",
  checklist_incomplete: "必做检查项未完成",
  dependency_blocked: "依赖未解决",
  review_required: "需要复核",
  not_completed: "尚未完成",
  canceled: "已取消",
  archived: "已归档",
}

function sourceKey(source: DownstreamSource): string {
  if (source.sourceKind === "manual") {
    return source.sourceId
  }

  return `${source.run.id}:${source.section.id}`
}

function sourceTitle(source: DownstreamSource): string {
  if (source.sourceKind === "manual") {
    return "人工补充任务"
  }

  return source.section.title || sectionTypeLabels[source.section.sectionType]
}

function sourceDescription(source: DownstreamSource): string {
  if (source.sourceKind === "manual") {
    return "适合补一条开播前必须跟进的动作。"
  }

  return `${sectionTypeLabels[source.section.sectionType]} · ${source.section.summary}`
}

function updateTaskList(
  tasks: NextSessionTaskView[],
  nextTask: NextSessionTaskView,
): NextSessionTaskView[] {
  const existingIndex = tasks.findIndex((task) => task.id === nextTask.id)

  if (existingIndex === -1) {
    return [nextTask, ...tasks]
  }

  return tasks.map((task) => (task.id === nextTask.id ? nextTask : task))
}

function taskBlockerText(task: NextSessionTaskView): string {
  const blockers = task.readiness.blockedBy

  if (blockers.length === 0) {
    return "任务已满足关闭条件"
  }

  return blockers.map((blocker) => blockerLabels[blocker] ?? "待处理").join("、")
}

export function NextActionsWorkbench() {
  const [phase, setPhase] = useState<WorkbenchPhase>("checking")
  const [actionState, setActionState] = useState<ActionState>("idle")
  const [scope, setScope] = useState<OperatorV0Scope>(() => defaultOperatorV0Scope())
  const [tasks, setTasks] = useState<NextSessionTaskView[]>([])
  const [aiSources, setAiSources] = useState<DownstreamSource[]>([])
  const [manualSource, setManualSource] = useState<DownstreamSource>(() =>
    createManualNextActionSource(),
  )
  const [selectedSourceKey, setSelectedSourceKey] = useState("")
  const [draft, setDraft] = useState<NextActionDraft>(() => defaultNextActionDraft(null))
  const [message, setMessage] = useState("正在检查登录状态")
  const [error, setError] = useState("")

  const isBusy = actionState !== "idle"
  const selectedSource = useMemo(() => {
    if (selectedSourceKey === sourceKey(manualSource) || !selectedSourceKey) {
      return manualSource
    }

    return aiSources.find((source) => sourceKey(source) === selectedSourceKey) ?? manualSource
  }, [aiSources, manualSource, selectedSourceKey])
  const canSave = Boolean(draft.title.trim() && draft.summary.trim() && !isBusy)

  const loadAiReviewSources = useCallback(
    async (nextScope: OperatorV0Scope): Promise<DownstreamSource[]> => {
      const runsResponse = await fetch(scopedApi("/api/ai-review/runs", nextScope), {
        credentials: "include",
        cache: "no-store",
      })
      const runsBody = await readApiBody<AiReviewRunListBody>(runsResponse)

      if (!runsResponse.ok || !("ok" in runsBody) || runsBody.ok !== true) {
        throw new Error(userMessageFromDownstreamError(runsBody as DownstreamApiErrorBody))
      }

      const details = await Promise.all(
        runsBody.runs.slice(0, 8).map(async (run) => {
          const detailResponse = await fetch(
            scopedApi(`/api/ai-review/runs/${run.id}`, nextScope),
            {
              credentials: "include",
              cache: "no-store",
            },
          )
          const detailBody = await readApiBody<AiReviewRunDetailBody>(detailResponse)

          if (
            !detailResponse.ok ||
            !("ok" in detailBody) ||
            detailBody.ok !== true
          ) {
            throw new Error(userMessageFromDownstreamError(detailBody as DownstreamApiErrorBody))
          }

          return detailBody.detail
        }),
      )

      return eligibleDownstreamSections(
        details as AiReviewRunDetail[],
        isNextActionEligibleSection,
      )
    },
    [],
  )

  const loadWorkspace = useCallback(
    async (nextScope: OperatorV0Scope) => {
      setActionState("loading")
      setError("")

      const [tasksResponse, sources] = await Promise.all([
        fetch(scopedApi("/api/next-actions/tasks?limit=50", nextScope), {
          credentials: "include",
          cache: "no-store",
        }),
        loadAiReviewSources(nextScope),
      ])
      const tasksBody = await readApiBody<NextActionListBody>(tasksResponse)

      if (!tasksResponse.ok || !("ok" in tasksBody) || tasksBody.ok !== true) {
        throw new Error(userMessageFromDownstreamError(tasksBody as DownstreamApiErrorBody))
      }

      setTasks(tasksBody.tasks)
      setAiSources(sources)
      setMessage(
        tasksBody.tasks.length > 0
          ? "已加载下场任务"
          : sources.length > 0
            ? "可从已采纳复盘动作创建任务"
            : "暂无下场任务，可先手动创建",
      )
    },
    [loadAiReviewSources],
  )

  const verifyContext = useCallback(async () => {
    const nextScope = readStoredOperatorV0Scope()
    setActionState("loading")
    setError("")

    try {
      const response = await fetch(scopedApi("/api/auth/session", nextScope), {
        credentials: "include",
        cache: "no-store",
      })
      const body = await readApiBody<AuthSessionBody>(response)

      if ("authenticated" in body && body.authenticated === true) {
        const verifiedScope = authSessionBodyToScope(body)
        setScope(verifiedScope)
        storeOperatorV0Scope(verifiedScope)
        setPhase("ready")
        await loadWorkspace(verifiedScope)
      } else {
        setPhase("entry")
        setMessage("进入团队后可以整理下场任务")
      }
    } catch (caught) {
      setPhase("error")
      setError(caught instanceof Error ? caught.message : "登录状态检查失败")
    } finally {
      setActionState("idle")
    }
  }, [loadWorkspace])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void verifyContext()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [verifyContext])

  async function enterOperatorV0() {
    setActionState("entering")
    setError("")

    try {
      const response = await fetch("/api/auth/operator-v0-session", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          [operatorV0BootstrapCsrfHeaderName]: operatorV0BootstrapCsrfHeaderValue,
        },
      })
      const body = await readApiBody<BootstrapBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromDownstreamError(body as DownstreamApiErrorBody))
      }

      const nextScope = bootstrapBodyToScope(body)
      setScope(nextScope)
      storeOperatorV0Scope(nextScope)
      setPhase("ready")
      await loadWorkspace(nextScope)
      setMessage("已进入下场任务工作台")
    } catch (caught) {
      setPhase("entry")
      setError(caught instanceof Error ? caught.message : "进入失败")
    } finally {
      setActionState("idle")
    }
  }

  function chooseSource(source: DownstreamSource) {
    setSelectedSourceKey(sourceKey(source))
    setDraft(defaultNextActionDraft(source))
    setError("")
  }

  function chooseFreshManualSource() {
    const nextSource = createManualNextActionSource()
    setManualSource(nextSource)
    chooseSource(nextSource)
  }

  async function saveTask() {
    if (!canSave) {
      return
    }

    setActionState("saving")
    setError("")

    try {
      if (selectedSource.sourceKind === "ai_review") {
        const downstreamResponse = await fetch(
          scopedApi(
            `/api/ai-review/runs/${selectedSource.run.id}/downstream-artifacts`,
            scope,
          ),
          {
            method: "POST",
            credentials: "include",
            cache: "no-store",
            headers: {
              "content-type": "application/json",
              [aiReviewMutationCsrfHeaderName]: aiReviewMutationCsrfHeaderValue,
            },
            body: JSON.stringify(createAiReviewDownstreamPayload(selectedSource.section)),
          },
        )
        const downstreamBody =
          await readApiBody<AiReviewDownstreamBody>(downstreamResponse)

        if (
          !downstreamResponse.ok ||
          !("ok" in downstreamBody) ||
          downstreamBody.ok !== true
        ) {
          throw new Error(
            userMessageFromDownstreamError(downstreamBody as DownstreamApiErrorBody),
          )
        }
      }

      const createResponse = await fetch(scopedApi("/api/next-actions/tasks", scope), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          [nextActionMutationCsrfHeaderName]: nextActionMutationCsrfHeaderValue,
        },
        body: JSON.stringify(
          createNextActionPayloadFromSource({
            source: selectedSource,
            title: draft.title,
            summary: draft.summary,
            ownerId: operatorV0ActorId,
          }),
        ),
      })
      const createBody = await readApiBody<NextActionCreateBody>(createResponse)

      if (!createResponse.ok || !("ok" in createBody) || createBody.ok !== true) {
        throw new Error(userMessageFromDownstreamError(createBody as DownstreamApiErrorBody))
      }

      setTasks((current) => updateTaskList(current, createBody.task))
      setMessage(
        selectedSource.sourceKind === "ai_review"
          ? "已从复盘动作创建任务"
          : "已创建人工下场任务",
      )

      if (selectedSource.sourceKind === "manual") {
        const nextSource = createManualNextActionSource()
        setManualSource(nextSource)
        setSelectedSourceKey(sourceKey(nextSource))
        setDraft(defaultNextActionDraft(nextSource))
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存下场任务失败")
    } finally {
      setActionState("idle")
    }
  }

  async function updateTaskStatus(task: NextSessionTaskView) {
    if (isBusy || task.status !== "assigned") {
      return
    }

    setActionState("updating")
    setError("")

    try {
      const response = await fetch(
        scopedApi(`/api/next-actions/tasks/${task.id}/status`, scope),
        {
          method: "PATCH",
          credentials: "include",
          cache: "no-store",
          headers: {
            "content-type": "application/json",
            [nextActionMutationCsrfHeaderName]: nextActionMutationCsrfHeaderValue,
          },
          body: JSON.stringify({
            fromStatus: task.status,
            toStatus: "in_progress",
            reason: "开始处理下场任务",
          }),
        },
      )
      const body = await readApiBody<NextActionUpdateBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromDownstreamError(body as DownstreamApiErrorBody))
      }

      setTasks((current) => updateTaskList(current, body.task))
      setMessage("任务已开始处理")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "更新任务状态失败")
    } finally {
      setActionState("idle")
    }
  }

  async function updateChecklistItem(
    task: NextSessionTaskView,
    itemId: string,
    status: "done" | "blocked",
  ) {
    if (isBusy) {
      return
    }

    setActionState("updating")
    setError("")

    try {
      const response = await fetch(
        scopedApi(`/api/next-actions/tasks/${task.id}/checklist/${itemId}`, scope),
        {
          method: "PATCH",
          credentials: "include",
          cache: "no-store",
          headers: {
            "content-type": "application/json",
            [nextActionMutationCsrfHeaderName]: nextActionMutationCsrfHeaderValue,
          },
          body: JSON.stringify({
            status,
          }),
        },
      )
      const body = await readApiBody<NextActionUpdateBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromDownstreamError(body as DownstreamApiErrorBody))
      }

      setTasks((current) => updateTaskList(current, body.task))
      setMessage(status === "done" ? "检查项已完成" : "检查项已标记阻塞")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "更新检查项失败")
    } finally {
      setActionState("idle")
    }
  }

  if (phase === "checking") {
    return (
      <div className="workspace-page">
        <MotionPanel className="workbench-panel p-6">
          <StatusMessage icon={Loader2} title="正在载入" message={message} spin />
        </MotionPanel>
      </div>
    )
  }

  if (phase === "entry" || phase === "error") {
    return (
      <div className="workspace-page xl:grid-cols-[minmax(0,1fr)_minmax(300px,var(--workspace-aside-width-md))]">
        <MotionPanel className="workbench-panel overflow-hidden">
          <div className="border-b bg-surface px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="workspace-readable">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">下场任务</Badge>
                  <Badge variant="outline">需要进入团队</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
                  进入任务工作台
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  进入后可以查看团队任务，也可以把已采纳复盘动作整理成下场前的检查项。
                </p>
              </div>
              <Button
                onClick={enterOperatorV0}
                disabled={actionState === "entering"}
                className="w-full sm:w-fit"
              >
                {actionState === "entering" ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <LogIn data-icon="inline-start" />
                )}
                进入工作台
              </Button>
            </div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            <EntryPoint icon={Bot} title="接收动作" description="只使用已采纳的下场建议。" />
            <EntryPoint icon={ClipboardList} title="形成任务" description="标题、摘要和检查项一起保存。" />
            <EntryPoint icon={ClipboardCheck} title="推进进度" description="可开始任务并处理检查项。" />
          </div>
          {error ? (
            <div className="border-t px-5 py-4" role="alert">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : null}
        </MotionPanel>
      </div>
    )
  }

  return (
    <div className="workspace-page xl:grid-cols-[minmax(260px,0.34fr)_minmax(0,1fr)_minmax(300px,var(--workspace-aside-width-md))]">
      <aside className="space-y-5">
        <MotionPanel className="workbench-panel p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge variant="secondary">已进入团队</Badge>
              <h2 className="mt-3 truncate text-base font-semibold">{scope.teamName}</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {scope.actorName} · {scope.tenantName}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="重新加载下场任务"
              onClick={() => void loadWorkspace(scope).finally(() => setActionState("idle"))}
              disabled={isBusy}
            >
              <RefreshCcw />
            </Button>
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel overflow-hidden" delay={0.04}>
          <div className="border-b px-5 py-4">
            <h2 className="text-base font-semibold">任务来源</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              选择人工补充，或使用已采纳复盘动作。
            </p>
          </div>
          <div className="max-h-[560px] divide-y overflow-y-auto">
            <SourceButton
              source={manualSource}
              active={selectedSource.sourceKind === "manual"}
              onClick={chooseFreshManualSource}
            />
            {aiSources.length === 0 ? (
              <EmptyList message="暂无已采纳下场动作。可先到智能复盘采纳任务区块。" />
            ) : (
              aiSources.map((source, index) => (
                <MotionListItem key={sourceKey(source)} delay={index * 0.02}>
                  <SourceButton
                    source={source}
                    active={sourceKey(selectedSource) === sourceKey(source)}
                    onClick={() => chooseSource(source)}
                  />
                </MotionListItem>
              ))
            )}
          </div>
        </MotionPanel>
      </aside>

      <section className="min-w-0 space-y-5">
        <MotionPanel className="workbench-panel overflow-hidden">
          <div className="border-b bg-surface px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="workspace-readable">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">下场任务</Badge>
                  <Badge variant="outline">
                    {selectedSource.sourceKind === "ai_review" ? "复盘来源" : "人工补充"}
                  </Badge>
                </div>
                <h2 className="mt-3 break-words text-2xl font-semibold tracking-normal md:text-3xl">
                  创建下场前跟进任务
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  把复盘里的动作变成负责人可推进的任务，检查项未完成前不隐藏阻塞原因。
                </p>
              </div>
              <Button onClick={saveTask} disabled={!canSave} className="w-full sm:w-fit">
                {actionState === "saving" ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <Save data-icon="inline-start" />
                )}
                保存任务
              </Button>
            </div>
          </div>

          <div className="grid gap-0 divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
            <Metric label="任务数量" value={`${tasks.length}`} description="当前团队已保存任务" />
            <Metric label="可用来源" value={`${aiSources.length}`} description="来自已采纳复盘动作" />
            <Metric
              label="当前状态"
              value={actionState === "updating" ? "更新中" : "可处理"}
              description={message}
            />
          </div>
        </MotionPanel>

        {error ? (
          <MotionPanel className="workbench-panel border-destructive/30 p-5" delay={0.03}>
            <StatusMessage icon={AlertTriangle} title="操作失败" message={error} />
          </MotionPanel>
        ) : null}

        <MotionPanel delay={0.06}>
          <section className="workbench-panel" aria-labelledby="next-action-draft-title">
            <SectionHeader
              id="next-action-draft-title"
              icon={Plus}
              title="任务内容"
              description="保存后会进入团队任务列表，并带上来源和检查项。"
              badge={selectedSource.sourceKind === "ai_review" ? "AI 建议任务" : "人工任务"}
            />
            <div className="grid gap-4 p-5">
              <LabeledInput
                id="next-action-title"
                label="任务标题"
                value={draft.title}
                onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
                disabled={isBusy}
              />
              <LabeledTextarea
                id="next-action-summary"
                label="任务摘要"
                value={draft.summary}
                onChange={(value) => setDraft((current) => ({ ...current, summary: value }))}
                disabled={isBusy}
              />
            </div>
          </section>
        </MotionPanel>

        <MotionPanel delay={0.1}>
          <section className="workbench-panel" aria-labelledby="next-actions-list-title">
            <SectionHeader
              id="next-actions-list-title"
              icon={ClipboardList}
              title="任务列表"
              description="可以开始已分配任务，并处理必做检查项。"
              badge={tasks.length ? `${tasks.length} 条` : "暂无"}
            />
            {tasks.length === 0 ? (
              <div className="p-5">
                <StatusMessage
                  icon={CircleDashed}
                  title="暂无下场任务"
                  message="先保存一条人工任务，或从已采纳复盘动作创建。"
                />
              </div>
            ) : (
              <div className="grid gap-3 p-5">
                {tasks.map((task, index) => (
                  <NextActionTaskCard
                    key={task.id}
                    task={task}
                    delay={index * 0.025}
                    busy={isBusy}
                    onStart={() => void updateTaskStatus(task)}
                    onChecklist={(itemId, status) =>
                      void updateChecklistItem(task, itemId, status)
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </MotionPanel>
      </section>

      <aside className="space-y-5">
        <MotionPanel className="workbench-panel p-5" delay={0.12}>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-base font-semibold">当前来源</h2>
          </div>
          <div className="mt-4 workbench-row p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {selectedSource.sourceKind === "ai_review" ? "复盘动作" : "人工补充"}
              </Badge>
              {selectedSource.sourceKind === "ai_review" ? (
                <Badge variant="outline">
                  {sectionTypeLabels[selectedSource.section.sectionType]}
                </Badge>
              ) : null}
            </div>
            <h3 className="mt-3 break-words text-sm font-semibold">
              {sourceTitle(selectedSource)}
            </h3>
            <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">
              {sourceDescription(selectedSource)}
            </p>
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.16}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" />
            <h2 className="text-base font-semibold">完成门槛</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <CheckItem label="必做检查项完成前不关闭任务" />
            <CheckItem label="阻塞原因保留在任务卡片" />
            <CheckItem label="AI 来源保留 run 和区块引用" />
          </div>
        </MotionPanel>
      </aside>
    </div>
  )
}

function SourceButton({
  source,
  active,
  onClick,
}: {
  source: DownstreamSource
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full px-5 py-4 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        active && "bg-muted",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 break-words text-sm font-medium leading-6">
          {sourceTitle(source)}
        </span>
        <Badge variant="outline">
          {source.sourceKind === "ai_review" ? "已采纳" : "新建"}
        </Badge>
      </div>
      <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
        {sourceDescription(source)}
      </p>
    </button>
  )
}

function NextActionTaskCard({
  task,
  delay,
  busy,
  onStart,
  onChecklist,
}: {
  task: NextSessionTaskView
  delay: number
  busy: boolean
  onStart: () => void
  onChecklist: (itemId: string, status: "done" | "blocked") => void
}) {
  return (
    <MotionListItem delay={delay} className="workbench-row p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{taskStatusLabels[task.status]}</Badge>
            <Badge variant="outline">{priorityLabels[task.priority]}</Badge>
            <Badge variant="outline">{taskTypeLabels[task.taskType]}</Badge>
          </div>
          <h3 className="mt-3 break-words text-sm font-semibold">{task.title}</h3>
          <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
            {task.summary}
          </p>
        </div>
        <Button
          size="sm"
          variant={task.status === "assigned" ? "default" : "outline"}
          onClick={onStart}
          disabled={busy || task.status !== "assigned"}
          className="w-full lg:w-fit"
        >
          {busy ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <ClipboardCheck data-icon="inline-start" />
          )}
          开始处理
        </Button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.42fr)]">
        <div className="grid gap-2">
          {task.checklist.length === 0 ? (
            <p className="text-sm leading-6 text-muted-foreground">暂无检查项。</p>
          ) : (
            task.checklist.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border bg-surface px-3 py-3 text-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="break-words leading-6">
                    {item.title}
                    {item.required ? " · 必做" : ""}
                  </span>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => onChecklist(item.id, "done")}
                    disabled={busy || item.status === "done"}
                  >
                    完成
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => onChecklist(item.id, "blocked")}
                    disabled={busy || item.status === "blocked"}
                  >
                    阻塞
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="rounded-lg border bg-surface px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">完成门槛</span>
            <Badge variant={task.readiness.ready ? "secondary" : "outline"}>
              {task.readiness.ready ? "可关闭" : "待处理"}
            </Badge>
          </div>
          <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">
            {taskBlockerText(task)}
          </p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            更新于 {formatDownstreamDate(task.updatedAt)}
          </p>
        </div>
      </div>
    </MotionListItem>
  )
}

function SectionHeader({
  id,
  icon: Icon,
  title,
  description,
  badge,
}: {
  id: string
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  badge: string
}) {
  return (
    <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <h2 id={id} className="text-base font-semibold">
            {title}
          </h2>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <Badge variant="outline" className="w-fit">
        {badge}
      </Badge>
    </div>
  )
}

function Metric({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <MotionListItem className="min-h-28 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="rounded-4xl border px-2 py-0.5 text-xs font-medium workbench-status-info">
          {value}
        </span>
      </div>
      <p className="mt-5 text-xs leading-5 text-muted-foreground">{description}</p>
    </MotionListItem>
  )
}

function EntryPoint({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="workbench-row min-h-28 p-4">
      <Icon className="size-4 text-primary" />
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  )
}

function StatusMessage({
  icon: Icon,
  title,
  message,
  spin = false,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  message: string
  spin?: boolean
}) {
  return (
    <div className="grid grid-cols-[36px_1fr] gap-3">
      <span className="workbench-icon-surface">
        <Icon className={cn("size-4 text-primary", spin && "animate-spin")} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-muted-foreground">
          {message}
        </span>
      </span>
    </div>
  )
}

function EmptyList({ message }: { message: string }) {
  return <div className="p-5 text-sm leading-6 text-muted-foreground">{message}</div>
}

function LabeledInput({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
}) {
  return (
    <label htmlFor={id} className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        id={id}
        className={fieldClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </label>
  )
}

function LabeledTextarea({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
}) {
  return (
    <label htmlFor={id} className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        id={id}
        className={textareaClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </label>
  )
}

function CheckItem({ label }: { label: string }) {
  return (
    <div className="workbench-row flex items-center gap-3 p-3 text-sm">
      <CheckCircle2 className="size-4 shrink-0 text-primary" />
      <span className="leading-6">{label}</span>
    </div>
  )
}
