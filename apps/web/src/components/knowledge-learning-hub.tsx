"use client"

import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  FileText,
  Loader2,
  LogIn,
  Plus,
  RefreshCcw,
  Save,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react"

import { MotionListItem, MotionPanel } from "@/components/workspace-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  authSessionBodyToScope,
  blockerText,
  bootstrapBodyToScope,
  createDefaultKnowledgeSourceDraft,
  createDefaultManualClaimDraft,
  createDefaultPublicationDraft,
  createDefaultReviewDecisionDraft,
  createDefaultTeamNoteDraft,
  createJsonMutationInit,
  createKnowledgePublicationPayload,
  createKnowledgeReviewDecisionPayload,
  createKnowledgeSourcePayload,
  createManualClaimPayload,
  createTeamNotePayload,
  defaultOperatorV0Scope,
  formatReferenceDate,
  isKnowledgeSourceDraftReady,
  knowledgeBlockerLabels,
  knowledgeClaimTypeLabels,
  knowledgeLifecycleMutationCsrfHeaderName,
  knowledgeLifecycleMutationCsrfHeaderValue,
  knowledgeRefreshCadenceLabels,
  knowledgeReviewStateLabels,
  knowledgeSourceTypeLabels,
  knowledgeTrustLevelLabels,
  knowledgeWorkflowLabels,
  operatorV0BootstrapCsrfHeaderName,
  operatorV0BootstrapCsrfHeaderValue,
  readApiBody,
  readStoredReferenceDataScope,
  reviewDecisionLabels,
  safeStatusLabel,
  scopedApi,
  storeReferenceDataScope,
  teamNoteTypeLabels,
  userMessageFromReferenceDataError,
  type AuthSessionBody,
  type BootstrapBody,
  type KnowledgeClaimCreateBody,
  type KnowledgePublicationDraft,
  type KnowledgeReviewDecisionBody,
  type KnowledgeReviewQueueBody,
  type KnowledgeReviewQueueItem,
  type KnowledgeSourceCreateBody,
  type KnowledgeSourceDraft,
  type KnowledgeSourceListBody,
  type KnowledgeSourceView,
  type KnowledgeVersionCreateBody,
  type ManualKnowledgeClaimDraft,
  type OperatorV0Scope,
  type ReferenceDataApiErrorBody,
  type TeamKnowledgeNoteCreateBody,
  type TeamKnowledgeNoteDraft,
} from "@/lib/reference-data-v0-workflow"
import { cn } from "@/lib/utils"

type WorkbenchPhase = "checking" | "entry" | "ready" | "error"
type ActionState =
  | "idle"
  | "entering"
  | "loading"
  | "saving-source"
  | "saving-claim"
  | "saving-note"
  | "reviewing"
  | "publishing"

const fieldClassName =
  "min-h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"

const textareaClassName = cn(fieldClassName, "min-h-24 resize-y leading-6")

const statusTone: Record<string, string> = {
  registered: "workbench-status-muted",
  extracting: "workbench-status-info",
  draft: "workbench-status-muted",
  pending: "workbench-status-warning",
  reviewing: "workbench-status-info",
  approved: "workbench-status-success",
  published: "workbench-status-success",
  rejected: "workbench-status-warning",
  stale: "workbench-status-warning",
  conflict: "workbench-status-warning",
  archived: "workbench-status-muted",
}

function queueTypeLabel(item: KnowledgeReviewQueueItem): string {
  if (item.targetType === "source") {
    return "来源"
  }

  if (item.targetType === "claim") {
    return "知识点"
  }

  return "团队笔记"
}

function queueItemSummary(item: KnowledgeReviewQueueItem): string {
  if (item.targetType === "source") {
    return `${item.source.owner} · ${knowledgeSourceTypeLabels[item.source.sourceType]}`
  }

  if (item.targetType === "claim") {
    return `${knowledgeClaimTypeLabels[item.claim.claimType]} · ${item.claim.subject}`
  }

  return `${teamNoteTypeLabels[item.teamNote.noteType]} · ${item.teamNote.knowledgeKey}`
}

function updateSources(
  sources: KnowledgeSourceView[],
  nextSource: KnowledgeSourceView,
): KnowledgeSourceView[] {
  const existingIndex = sources.findIndex((source) => source.id === nextSource.id)

  if (existingIndex === -1) {
    return [nextSource, ...sources]
  }

  return sources.map((source) => (source.id === nextSource.id ? nextSource : source))
}

function sourceReadyForAi(source: KnowledgeSourceView): boolean {
  return source.downstreamReadiness.some(
    (item) => item.workflow === "ai_review" && item.ready,
  )
}

export function KnowledgeLearningHub() {
  const [phase, setPhase] = useState<WorkbenchPhase>("checking")
  const [actionState, setActionState] = useState<ActionState>("idle")
  const [scope, setScope] = useState<OperatorV0Scope>(() => defaultOperatorV0Scope())
  const [sources, setSources] = useState<KnowledgeSourceView[]>([])
  const [reviewQueue, setReviewQueue] = useState<KnowledgeReviewQueueItem[]>([])
  const [sourceDraft, setSourceDraft] = useState<KnowledgeSourceDraft>(() =>
    createDefaultKnowledgeSourceDraft(),
  )
  const [claimDraft, setClaimDraft] = useState<ManualKnowledgeClaimDraft>(() =>
    createDefaultManualClaimDraft(),
  )
  const [noteDraft, setNoteDraft] = useState<TeamKnowledgeNoteDraft>(() =>
    createDefaultTeamNoteDraft(),
  )
  const [publicationDraft, setPublicationDraft] = useState<KnowledgePublicationDraft>(() =>
    createDefaultPublicationDraft(),
  )
  const [message, setMessage] = useState("正在检查登录状态")
  const [error, setError] = useState("")

  const isBusy = actionState !== "idle"
  const canSaveSource =
    phase === "ready" && isKnowledgeSourceDraftReady(sourceDraft) && !isBusy
  const canSaveClaim =
    phase === "ready" &&
    Boolean(claimDraft.sourceId.trim() && claimDraft.subject.trim() && claimDraft.claimText.trim()) &&
    !isBusy
  const canSaveNote =
    phase === "ready" &&
    Boolean(noteDraft.knowledgeKey.trim() && noteDraft.content.trim()) &&
    !isBusy
  const canPublish =
    phase === "ready" &&
    Boolean(
      publicationDraft.knowledgeKey.trim() &&
        publicationDraft.summary.trim() &&
        publicationDraft.sourceIds.trim() &&
        (publicationDraft.claimIds.trim() || publicationDraft.teamNoteIds.trim()),
    ) &&
    !isBusy

  const approvedSourceCount = sources.filter((source) => source.reviewState === "approved").length
  const aiReadySourceCount = sources.filter(sourceReadyForAi).length

  const metrics = useMemo(
    () => [
      {
        label: "来源",
        value: sources.length.toString(),
        description: sources.length > 0 ? "已登记到当前团队" : "暂无来源",
        tone: sources.length > 0 ? "success" : "muted",
      },
      {
        label: "待审核",
        value: reviewQueue.length.toString(),
        description: "包含来源、知识点和团队笔记",
        tone: reviewQueue.length > 0 ? "warning" : "success",
      },
      {
        label: "已审核来源",
        value: approvedSourceCount.toString(),
        description: "审核后仍需发布版本才能用于回答",
        tone: approvedSourceCount > 0 ? "success" : "info",
      },
      {
        label: "复盘可用",
        value: aiReadySourceCount.toString(),
        description: "按当前 readiness 返回判断",
        tone: aiReadySourceCount > 0 ? "success" : "warning",
      },
    ],
    [aiReadySourceCount, approvedSourceCount, reviewQueue.length, sources.length],
  )

  const loadWorkspace = useCallback(async (nextScope: OperatorV0Scope) => {
    setActionState("loading")
    setError("")

    const [sourcesResponse, queueResponse] = await Promise.all([
      fetch(scopedApi("/api/knowledge/sources?limit=50", nextScope), {
        credentials: "include",
        cache: "no-store",
      }),
      fetch(scopedApi("/api/knowledge/review-queue?limit=50", nextScope), {
        credentials: "include",
        cache: "no-store",
      }),
    ])
    const [sourcesBody, queueBody] = await Promise.all([
      readApiBody<KnowledgeSourceListBody>(sourcesResponse),
      readApiBody<KnowledgeReviewQueueBody>(queueResponse),
    ])

    if (!sourcesResponse.ok || !("ok" in sourcesBody) || sourcesBody.ok !== true) {
      throw new Error(
        userMessageFromReferenceDataError(sourcesBody as ReferenceDataApiErrorBody),
      )
    }

    if (!queueResponse.ok || !("ok" in queueBody) || queueBody.ok !== true) {
      throw new Error(
        userMessageFromReferenceDataError(queueBody as ReferenceDataApiErrorBody),
      )
    }

    setSources(sourcesBody.sources)
    setReviewQueue(queueBody.items)
    setClaimDraft((current) => ({
      ...current,
      sourceId: current.sourceId || sourcesBody.sources[0]?.id || "",
    }))
    setNoteDraft((current) => ({
      ...current,
      sourceIds: current.sourceIds || sourcesBody.sources[0]?.id || "",
    }))
    setPublicationDraft((current) => ({
      ...current,
      sourceIds: current.sourceIds || sourcesBody.sources[0]?.id || "",
    }))
    setMessage(
      sourcesBody.sources.length > 0
        ? "已加载资料来源"
        : "暂无来源，先登记一条可靠资料",
    )
  }, [])

  const verifyContext = useCallback(async () => {
    const nextScope = readStoredReferenceDataScope()
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
        storeReferenceDataScope(verifiedScope)
        setPhase("ready")
        await loadWorkspace(verifiedScope)
      } else {
        setPhase("entry")
        setMessage("进入团队后可以维护资料来源")
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
        throw new Error(userMessageFromReferenceDataError(body as ReferenceDataApiErrorBody))
      }

      const nextScope = bootstrapBodyToScope(body)
      setScope(nextScope)
      storeReferenceDataScope(nextScope)
      setPhase("ready")
      await loadWorkspace(nextScope)
      setMessage("已进入资料来源工作台")
    } catch (caught) {
      setPhase("entry")
      setError(caught instanceof Error ? caught.message : "进入失败")
    } finally {
      setActionState("idle")
    }
  }

  async function saveSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSaveSource) {
      return
    }

    setActionState("saving-source")
    setError("")

    try {
      const response = await fetch(
        scopedApi("/api/knowledge/sources", scope),
        createJsonMutationInit({
          csrfHeaderName: knowledgeLifecycleMutationCsrfHeaderName,
          csrfHeaderValue: knowledgeLifecycleMutationCsrfHeaderValue,
          body: createKnowledgeSourcePayload(sourceDraft),
        }),
      )
      const body = await readApiBody<KnowledgeSourceCreateBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromReferenceDataError(body as ReferenceDataApiErrorBody))
      }

      setSources((current) => updateSources(current, body.source))
      setClaimDraft(createDefaultManualClaimDraft(body.source.id))
      setNoteDraft(createDefaultTeamNoteDraft(body.source.id))
      setPublicationDraft(createDefaultPublicationDraft(body.source.id))
      setMessage("已登记来源，仍需审核")
      await loadWorkspace(scope)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存来源失败")
    } finally {
      setActionState("idle")
    }
  }

  async function saveClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSaveClaim) {
      return
    }

    setActionState("saving-claim")
    setError("")

    try {
      const response = await fetch(
        scopedApi("/api/knowledge/claims", scope),
        createJsonMutationInit({
          csrfHeaderName: knowledgeLifecycleMutationCsrfHeaderName,
          csrfHeaderValue: knowledgeLifecycleMutationCsrfHeaderValue,
          body: createManualClaimPayload(claimDraft),
        }),
      )
      const body = await readApiBody<KnowledgeClaimCreateBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromReferenceDataError(body as ReferenceDataApiErrorBody))
      }

      setPublicationDraft((current) => ({
        ...current,
        knowledgeKey: body.claim.knowledgeKey,
        claimIds: body.claim.id,
        sourceIds: body.claim.sourceId,
      }))
      setMessage("已保存知识点，等待审核")
      await loadWorkspace(scope)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存知识点失败")
    } finally {
      setActionState("idle")
    }
  }

  async function saveTeamNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSaveNote) {
      return
    }

    setActionState("saving-note")
    setError("")

    try {
      const response = await fetch(
        scopedApi("/api/knowledge/team-notes", scope),
        createJsonMutationInit({
          csrfHeaderName: knowledgeLifecycleMutationCsrfHeaderName,
          csrfHeaderValue: knowledgeLifecycleMutationCsrfHeaderValue,
          body: createTeamNotePayload(noteDraft),
        }),
      )
      const body = await readApiBody<TeamKnowledgeNoteCreateBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromReferenceDataError(body as ReferenceDataApiErrorBody))
      }

      setPublicationDraft((current) => ({
        ...current,
        knowledgeKey: body.teamNote.knowledgeKey,
        teamNoteIds: body.teamNote.id,
        sourceIds: body.teamNote.sourceIds.join(", "),
      }))
      setMessage("已保存团队笔记，等待审核")
      await loadWorkspace(scope)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存团队笔记失败")
    } finally {
      setActionState("idle")
    }
  }

  async function approveItem(item: KnowledgeReviewQueueItem) {
    if (isBusy) {
      return
    }

    setActionState("reviewing")
    setError("")

    try {
      const response = await fetch(
        scopedApi("/api/knowledge/review-decisions", scope),
        createJsonMutationInit({
          csrfHeaderName: knowledgeLifecycleMutationCsrfHeaderName,
          csrfHeaderValue: knowledgeLifecycleMutationCsrfHeaderValue,
          body: createKnowledgeReviewDecisionPayload(
            createDefaultReviewDecisionDraft(item),
          ),
        }),
      )
      const body = await readApiBody<KnowledgeReviewDecisionBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromReferenceDataError(body as ReferenceDataApiErrorBody))
      }

      setMessage(`${queueTypeLabel(item)}已通过审核`)
      await loadWorkspace(scope)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "审核失败")
    } finally {
      setActionState("idle")
    }
  }

  async function publishVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canPublish) {
      return
    }

    setActionState("publishing")
    setError("")

    try {
      const response = await fetch(
        scopedApi("/api/knowledge/versions", scope),
        createJsonMutationInit({
          csrfHeaderName: knowledgeLifecycleMutationCsrfHeaderName,
          csrfHeaderValue: knowledgeLifecycleMutationCsrfHeaderValue,
          body: createKnowledgePublicationPayload(publicationDraft),
        }),
      )
      const body = await readApiBody<KnowledgeVersionCreateBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromReferenceDataError(body as ReferenceDataApiErrorBody))
      }

      setMessage("已发布知识版本")
      await loadWorkspace(scope)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "发布被阻断")
    } finally {
      setActionState("idle")
    }
  }

  function updateSourceDraft(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const field = event.target.name as keyof KnowledgeSourceDraft

    setSourceDraft((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  function updateClaimDraft(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const field = event.target.name as keyof ManualKnowledgeClaimDraft

    setClaimDraft((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  function updateNoteDraft(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const field = event.target.name as keyof TeamKnowledgeNoteDraft

    setNoteDraft((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  function updatePublicationDraft(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const field = event.target.name as keyof KnowledgePublicationDraft

    setPublicationDraft((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  function selectSource(sourceId: string) {
    setClaimDraft((current) => ({ ...current, sourceId }))
    setNoteDraft((current) => ({ ...current, sourceIds: sourceId }))
    setPublicationDraft((current) => ({ ...current, sourceIds: sourceId }))
    setError("")
  }

  return (
    <div className="workspace-page xl:grid-cols-[minmax(0,1fr)_minmax(300px,var(--workspace-aside-width-lg))]">
      <section className="min-w-0 space-y-5">
        <MotionPanel className="workbench-panel overflow-hidden">
          <div className="border-b bg-surface px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="workspace-readable">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">资料来源</Badge>
                  <Badge variant="outline">V0 可保存</Badge>
                  <Badge variant="outline">审核后使用</Badge>
                  <Badge variant="outline">{message}</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
                  维护可信资料
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  先登记来源，再沉淀知识点和团队经验。未审核内容不会当作已发布知识。
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:w-[280px] lg:grid-cols-1">
                {phase === "ready" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadWorkspace(scope)}
                    disabled={isBusy}
                  >
                    {actionState === "loading" ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <RefreshCcw data-icon="inline-start" />
                    )}
                    刷新资料
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => void enterOperatorV0()}
                    disabled={isBusy}
                  >
                    {actionState === "entering" ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <LogIn data-icon="inline-start" />
                    )}
                    进入团队
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSourceDraft(createDefaultKnowledgeSourceDraft())
                    setError("")
                    setMessage("已重置来源草稿")
                  }}
                  disabled={isBusy}
                >
                  <Plus data-icon="inline-start" />
                  新来源
                </Button>
              </div>
            </div>
            {error ? (
              <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </div>

          <div className="grid gap-0 divide-y md:grid-cols-4 md:divide-x md:divide-y-0">
            {metrics.map((metric, index) => (
              <MotionListItem
                key={metric.label}
                delay={index * 0.03}
                className="min-h-32 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{metric.label}</span>
                  <span
                    className={cn(
                      "rounded-4xl border px-2 py-0.5 text-xs font-medium",
                      metric.tone === "success"
                        ? "workbench-status-success"
                        : metric.tone === "warning"
                          ? "workbench-status-warning"
                          : metric.tone === "info"
                            ? "workbench-status-info"
                            : "workbench-status-muted",
                    )}
                  >
                    {metric.value}
                  </span>
                </div>
                <p className="mt-5 text-xs leading-5 text-muted-foreground">
                  {metric.description}
                </p>
              </MotionListItem>
            ))}
          </div>
        </MotionPanel>

        <MotionPanel delay={0.05}>
          <section className="workbench-panel" aria-labelledby="source-form-title">
            <SectionHeader
              id="source-form-title"
              icon={FileText}
              title="登记来源"
              description="保存来源元数据，不复制长篇原文。"
              badge={phase === "ready" ? "可保存" : "先进入团队"}
            />
            <form onSubmit={(event) => void saveSource(event)} className="space-y-4 p-5">
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="来源类型">
                  <select
                    className={fieldClassName}
                    name="sourceType"
                    value={sourceDraft.sourceType}
                    onChange={updateSourceDraft}
                    disabled={phase !== "ready" || isBusy}
                  >
                    {Object.entries(knowledgeSourceTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="标题">
                  <input
                    className={fieldClassName}
                    name="title"
                    value={sourceDraft.title}
                    onChange={updateSourceDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <Field label="来源方">
                  <input
                    className={fieldClassName}
                    name="owner"
                    value={sourceDraft.owner}
                    onChange={updateSourceDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
                <Field label="链接">
                  <input
                    className={fieldClassName}
                    name="url"
                    value={sourceDraft.url}
                    onChange={updateSourceDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <Field label="获取时间">
                  <input
                    className={fieldClassName}
                    type="datetime-local"
                    name="retrievedAt"
                    value={sourceDraft.retrievedAt}
                    onChange={updateSourceDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Field label="可信度">
                  <select
                    className={fieldClassName}
                    name="trustLevel"
                    value={sourceDraft.trustLevel}
                    onChange={updateSourceDraft}
                    disabled={phase !== "ready" || isBusy}
                  >
                    {Object.entries(knowledgeTrustLevelLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="复查频率">
                  <select
                    className={fieldClassName}
                    name="refreshCadence"
                    value={sourceDraft.refreshCadence}
                    onChange={updateSourceDraft}
                    disabled={phase !== "ready" || isBusy}
                  >
                    {Object.entries(knowledgeRefreshCadenceLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="用途">
                  <input
                    className={fieldClassName}
                    name="intendedUse"
                    value={sourceDraft.intendedUse}
                    onChange={updateSourceDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">
                  来源保存后默认待审核，不能直接作为权威知识。
                </p>
                <Button type="submit" disabled={!canSaveSource}>
                  {actionState === "saving-source" ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Save data-icon="inline-start" />
                  )}
                  保存来源
                </Button>
              </div>
            </form>
          </section>
        </MotionPanel>

        <MotionPanel delay={0.08}>
          <section className="workbench-panel" aria-labelledby="knowledge-content-title">
            <SectionHeader
              id="knowledge-content-title"
              icon={CircleDashed}
              title="沉淀知识"
              description="把来源事实和团队经验分开保存。"
              badge="待审核"
            />
            <div className="grid gap-5 p-5 xl:grid-cols-2">
              <form onSubmit={(event) => void saveClaim(event)} className="space-y-3">
                <FormTitle title="人工知识点" description="适合来自官方来源的规格或口径。" />
                <Field label="关联来源">
                  <select
                    className={fieldClassName}
                    name="sourceId"
                    value={claimDraft.sourceId}
                    onChange={(event) => selectSource(event.target.value)}
                    disabled={phase !== "ready" || isBusy || sources.length === 0}
                  >
                    <option value="">请选择来源</option>
                    {sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="类型">
                    <select
                      className={fieldClassName}
                      name="claimType"
                      value={claimDraft.claimType}
                      onChange={updateClaimDraft}
                      disabled={phase !== "ready" || isBusy}
                    >
                      {Object.entries(knowledgeClaimTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="主题">
                    <input
                      className={fieldClassName}
                      name="subject"
                      value={claimDraft.subject}
                      onChange={updateClaimDraft}
                      disabled={phase !== "ready" || isBusy}
                    />
                  </Field>
                </div>
                <Field label="知识键">
                  <input
                    className={fieldClassName}
                    name="knowledgeKey"
                    value={claimDraft.knowledgeKey}
                    onChange={updateClaimDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <Field label="内容">
                  <textarea
                    className={textareaClassName}
                    name="claimText"
                    value={claimDraft.claimText}
                    onChange={updateClaimDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <Button type="submit" disabled={!canSaveClaim} className="w-full">
                  {actionState === "saving-claim" ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Save data-icon="inline-start" />
                  )}
                  保存知识点
                </Button>
              </form>

              <form onSubmit={(event) => void saveTeamNote(event)} className="space-y-3">
                <FormTitle title="团队经验" description="适合直播口径、异议回应和操作备注。" />
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="类型">
                    <select
                      className={fieldClassName}
                      name="noteType"
                      value={noteDraft.noteType}
                      onChange={updateNoteDraft}
                      disabled={phase !== "ready" || isBusy}
                    >
                      {Object.entries(teamNoteTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="敏感级别">
                    <select
                      className={fieldClassName}
                      name="sensitiveLevel"
                      value={noteDraft.sensitiveLevel}
                      onChange={updateNoteDraft}
                      disabled={phase !== "ready" || isBusy}
                    >
                      <option value="internal">内部</option>
                      <option value="restricted">受限</option>
                      <option value="high">高敏</option>
                    </select>
                  </Field>
                </div>
                <Field label="知识键">
                  <input
                    className={fieldClassName}
                    name="knowledgeKey"
                    value={noteDraft.knowledgeKey}
                    onChange={updateNoteDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <Field label="关联来源 ID">
                  <input
                    className={fieldClassName}
                    name="sourceIds"
                    value={noteDraft.sourceIds}
                    onChange={updateNoteDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <Field label="内容">
                  <textarea
                    className={textareaClassName}
                    name="content"
                    value={noteDraft.content}
                    onChange={updateNoteDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <Button type="submit" disabled={!canSaveNote} className="w-full">
                  {actionState === "saving-note" ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Save data-icon="inline-start" />
                  )}
                  保存团队经验
                </Button>
              </form>
            </div>
          </section>
        </MotionPanel>

        <MotionPanel delay={0.1}>
          <section className="workbench-panel overflow-hidden" aria-labelledby="sources-title">
            <SectionHeader
              id="sources-title"
              icon={FileText}
              title="来源列表"
              description="只显示当前团队范围。"
              badge={`${sources.length} 条`}
            />
            {phase !== "ready" ? (
              <EmptyState
                icon={LogIn}
                title="先进入团队"
                description="进入后才会加载资料来源。"
              />
            ) : sources.length === 0 ? (
              <EmptyState
                icon={Plus}
                title="暂无来源"
                description="先登记官方或团队来源，再沉淀知识点。"
              />
            ) : (
              <div className="divide-y">
                {sources.map((source, index) => (
                  <MotionListItem key={source.id} delay={index * 0.025}>
                    <article className="motion-interactive grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_190px]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {knowledgeTrustLevelLabels[source.trustLevel]}
                          </Badge>
                          <span
                            className={cn(
                              "rounded-4xl border px-2 py-0.5 text-xs font-medium",
                              statusTone[source.reviewState] ?? "workbench-status-muted",
                            )}
                          >
                            {safeStatusLabel(
                              knowledgeReviewStateLabels,
                              source.reviewState,
                            )}
                          </span>
                        </div>
                        <h3 className="mt-3 break-words font-medium">{source.title}</h3>
                        <p className="mt-1 break-words text-sm text-muted-foreground">
                          {source.owner} · {knowledgeSourceTypeLabels[source.sourceType]}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {source.intendedUse.map((field) => (
                            <Badge key={field} variant="outline">
                              {field}
                            </Badge>
                          ))}
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          复盘：{blockerText(
                            source.downstreamReadiness.find(
                              (item) => item.workflow === "ai_review",
                            )?.blockedBy ?? [],
                            knowledgeBlockerLabels,
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 text-sm">
                        <div className="rounded-md bg-surface p-3">
                          <div className="text-xs text-muted-foreground">复查频率</div>
                          <div className="mt-1 font-medium">
                            {knowledgeRefreshCadenceLabels[source.refreshCadence]}
                          </div>
                        </div>
                        <div className="rounded-md bg-surface p-3">
                          <div className="text-xs text-muted-foreground">更新时间</div>
                          <div className="mt-1 font-medium">
                            {formatReferenceDate(source.updatedAt)}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => selectSource(source.id)}
                          disabled={isBusy}
                        >
                          <CheckCircle2 data-icon="inline-start" />
                          选为关联来源
                        </Button>
                      </div>
                    </article>
                  </MotionListItem>
                ))}
              </div>
            )}
          </section>
        </MotionPanel>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <MotionPanel delay={0.12}>
            <section className="workbench-panel h-full" aria-labelledby="review-title">
              <SectionHeader
                id="review-title"
                icon={ShieldCheck}
                title="审核队列"
                description="通过审核后才可进入发布。"
                badge={`${reviewQueue.length} 项`}
              />
              {reviewQueue.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="暂无待审核"
                  description="新增来源、知识点或团队经验后会出现在这里。"
                />
              ) : (
                <div className="grid gap-3 p-5">
                  {reviewQueue.map((item, index) => (
                    <MotionListItem
                      key={`${item.targetType}:${item.targetId}`}
                      delay={index * 0.025}
                      className="workbench-row-interactive p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{queueTypeLabel(item)}</Badge>
                            <Badge variant="outline">
                              {safeStatusLabel(
                                knowledgeReviewStateLabels,
                                item.reviewState,
                              )}
                            </Badge>
                          </div>
                          <h3 className="mt-3 break-words text-sm font-semibold">
                            {item.label}
                          </h3>
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            {queueItemSummary(item)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => void approveItem(item)}
                          disabled={isBusy}
                        >
                          {actionState === "reviewing" ? (
                            <Loader2 data-icon="inline-start" className="animate-spin" />
                          ) : (
                            <ShieldCheck data-icon="inline-start" />
                          )}
                          {reviewDecisionLabels.approve}
                        </Button>
                      </div>
                    </MotionListItem>
                  ))}
                </div>
              )}
            </section>
          </MotionPanel>

          <MotionPanel delay={0.15}>
            <section className="workbench-panel h-full" aria-labelledby="publish-title">
              <SectionHeader
                id="publish-title"
                icon={AlertTriangle}
                title="发布准备"
                description="发布会受审核和冲突状态阻断。"
                badge="受控"
              />
              <form onSubmit={(event) => void publishVersion(event)} className="space-y-3 p-5">
                <Field label="知识键">
                  <input
                    className={fieldClassName}
                    name="knowledgeKey"
                    value={publicationDraft.knowledgeKey}
                    onChange={updatePublicationDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="来源 ID">
                    <input
                      className={fieldClassName}
                      name="sourceIds"
                      value={publicationDraft.sourceIds}
                      onChange={updatePublicationDraft}
                      disabled={phase !== "ready" || isBusy}
                    />
                  </Field>
                  <Field label="知识点 ID">
                    <input
                      className={fieldClassName}
                      name="claimIds"
                      value={publicationDraft.claimIds}
                      onChange={updatePublicationDraft}
                      disabled={phase !== "ready" || isBusy}
                    />
                  </Field>
                  <Field label="团队笔记 ID">
                    <input
                      className={fieldClassName}
                      name="teamNoteIds"
                      value={publicationDraft.teamNoteIds}
                      onChange={updatePublicationDraft}
                      disabled={phase !== "ready" || isBusy}
                    />
                  </Field>
                </div>
                <Field label="摘要">
                  <textarea
                    className={textareaClassName}
                    name="summary"
                    value={publicationDraft.summary}
                    onChange={updatePublicationDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-muted-foreground">
                    审核未完成或存在冲突时，发布会被安全阻断。
                  </p>
                  <Button type="submit" disabled={!canPublish}>
                    {actionState === "publishing" ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <Save data-icon="inline-start" />
                    )}
                    尝试发布
                  </Button>
                </div>
              </form>
            </section>
          </MotionPanel>
        </div>
      </section>

      <aside className="space-y-5">
        <MotionPanel className="workbench-panel p-5" delay={0.12}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <h2 className="text-base font-semibold">团队状态</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {phase === "ready"
              ? `${scope.teamName} · ${scope.actorName}`
              : "进入团队后才能维护资料。"}
          </p>
          <Separator className="my-4" />
          <div className="grid gap-3 text-sm leading-6">
            <BoundaryItem>来源、知识点、团队经验分开保存。</BoundaryItem>
            <BoundaryItem>通过审核前不会发布成权威知识。</BoundaryItem>
            <BoundaryItem>公开发现、自动抓取和 RAG 暂不自动执行。</BoundaryItem>
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.16}>
          <div className="flex items-center gap-2">
            <CircleDashed className="size-4 text-primary" />
            <h2 className="text-base font-semibold">下游可用性</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {(["ai_review", "talk_tracks", "qa_agent", "source_refresh"] as const).map(
              (workflow) => {
                const readyCount = sources.filter((source) =>
                  source.downstreamReadiness.some(
                    (item) => item.workflow === workflow && item.ready,
                  ),
                ).length

                return (
                  <div key={workflow} className="workbench-row p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{knowledgeWorkflowLabels[workflow]}</span>
                      <Badge variant="outline">{readyCount} 条</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {readyCount > 0 ? "已有来源可用" : "仍需审核或发布"}
                    </p>
                  </div>
                )
              },
            )}
          </div>
        </MotionPanel>
      </aside>
    </div>
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
  icon: LucideIcon
  title: string
  description: string
  badge: string
}) {
  return (
    <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <h2 id={id} className="text-base font-semibold">
            {title}
          </h2>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <Badge variant="outline" className="w-fit shrink-0">
        {badge}
      </Badge>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  )
}

function FormTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="grid min-h-52 place-items-center px-5 py-10 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid size-10 place-items-center rounded-full border bg-surface">
          <Icon className="size-4 text-primary" />
        </div>
        <h3 className="mt-3 text-sm font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function BoundaryItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <CircleDashed className="mt-1 size-3.5 shrink-0 text-primary" />
      <span>{children}</span>
    </div>
  )
}
