"use client"

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleDashed,
  FileText,
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
  createManualTalkTrackSource,
  createTalkTrackPayloadFromSource,
  defaultOperatorV0Scope,
  defaultTalkTrackDraft,
  eligibleDownstreamSections,
  formatDownstreamDate,
  isTalkTrackEligibleSection,
  operatorV0BootstrapCsrfHeaderName,
  operatorV0BootstrapCsrfHeaderValue,
  readApiBody,
  readStoredOperatorV0Scope,
  scopedApi,
  sectionTypeLabels,
  storeOperatorV0Scope,
  talkTrackAssetTypeLabels,
  talkTrackMutationCsrfHeaderName,
  talkTrackMutationCsrfHeaderValue,
  talkTrackStatusLabels,
  userMessageFromDownstreamError,
  type AiReviewDownstreamBody,
  type AiReviewRunDetail,
  type AiReviewRunDetailBody,
  type AiReviewRunListBody,
  type AuthSessionBody,
  type BootstrapBody,
  type DownstreamApiErrorBody,
  type DownstreamSource,
  type OperatorV0Scope,
  type TalkTrackAssetView,
  type TalkTrackCreateBody,
  type TalkTrackListBody,
} from "@/lib/downstream-v0-workflow"
import { cn } from "@/lib/utils"

type WorkbenchPhase = "checking" | "entry" | "ready" | "error"
type ActionState = "idle" | "entering" | "loading" | "saving"

type TalkTrackDraft = {
  title: string
  body: string
}

const fieldClassName =
  "min-h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"

const textareaClassName = cn(fieldClassName, "min-h-28 resize-y leading-6")

function sourceKey(source: DownstreamSource): string {
  if (source.sourceKind === "manual") {
    return source.sourceId
  }

  return `${source.run.id}:${source.section.id}`
}

function updateAssetList(
  assets: TalkTrackAssetView[],
  nextAsset: TalkTrackAssetView,
): TalkTrackAssetView[] {
  const existingIndex = assets.findIndex((asset) => asset.id === nextAsset.id)

  if (existingIndex === -1) {
    return [nextAsset, ...assets]
  }

  return assets.map((asset) => (asset.id === nextAsset.id ? nextAsset : asset))
}

function sourceTitle(source: DownstreamSource): string {
  if (source.sourceKind === "manual") {
    return "人工录入话术"
  }

  return source.section.title || sectionTypeLabels[source.section.sectionType]
}

function sourceDescription(source: DownstreamSource): string {
  if (source.sourceKind === "manual") {
    return "适合直接补一条主播可编辑草稿。"
  }

  return `${sectionTypeLabels[source.section.sectionType]} · ${source.section.summary}`
}

export function TalkTracksWorkbench() {
  const [phase, setPhase] = useState<WorkbenchPhase>("checking")
  const [actionState, setActionState] = useState<ActionState>("idle")
  const [scope, setScope] = useState<OperatorV0Scope>(() => defaultOperatorV0Scope())
  const [assets, setAssets] = useState<TalkTrackAssetView[]>([])
  const [aiSources, setAiSources] = useState<DownstreamSource[]>([])
  const [manualSource, setManualSource] = useState<DownstreamSource>(() =>
    createManualTalkTrackSource(),
  )
  const [selectedSourceKey, setSelectedSourceKey] = useState("")
  const [draft, setDraft] = useState<TalkTrackDraft>(() => defaultTalkTrackDraft(null))
  const [message, setMessage] = useState("正在检查登录状态")
  const [error, setError] = useState("")

  const isBusy = actionState !== "idle"
  const selectedSource = useMemo(() => {
    if (selectedSourceKey === sourceKey(manualSource) || !selectedSourceKey) {
      return manualSource
    }

    return aiSources.find((source) => sourceKey(source) === selectedSourceKey) ?? manualSource
  }, [aiSources, manualSource, selectedSourceKey])
  const canSave = Boolean(draft.title.trim() && draft.body.trim() && !isBusy)

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
        isTalkTrackEligibleSection,
      )
    },
    [],
  )

  const loadWorkspace = useCallback(
    async (nextScope: OperatorV0Scope) => {
      setActionState("loading")
      setError("")

      const [assetsResponse, sources] = await Promise.all([
        fetch(scopedApi("/api/talk-tracks/assets?limit=50", nextScope), {
          credentials: "include",
          cache: "no-store",
        }),
        loadAiReviewSources(nextScope),
      ])
      const assetsBody = await readApiBody<TalkTrackListBody>(assetsResponse)

      if (!assetsResponse.ok || !("ok" in assetsBody) || assetsBody.ok !== true) {
        throw new Error(userMessageFromDownstreamError(assetsBody as DownstreamApiErrorBody))
      }

      setAssets(assetsBody.assets)
      setAiSources(sources)
      setMessage(
        assetsBody.assets.length > 0
          ? "已加载话术资产"
          : sources.length > 0
            ? "可从已采纳复盘建议创建草稿"
            : "暂无话术资产，可先手动创建草稿",
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
        setMessage("进入团队后可以整理话术草稿")
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
      setMessage("已进入话术资产工作台")
    } catch (caught) {
      setPhase("entry")
      setError(caught instanceof Error ? caught.message : "进入失败")
    } finally {
      setActionState("idle")
    }
  }

  function chooseSource(source: DownstreamSource) {
    setSelectedSourceKey(sourceKey(source))
    setDraft(defaultTalkTrackDraft(source))
    setError("")
  }

  function chooseFreshManualSource() {
    const nextSource = createManualTalkTrackSource()
    setManualSource(nextSource)
    chooseSource(nextSource)
  }

  async function saveDraft() {
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

      const createResponse = await fetch(scopedApi("/api/talk-tracks/assets", scope), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          [talkTrackMutationCsrfHeaderName]: talkTrackMutationCsrfHeaderValue,
        },
        body: JSON.stringify(
          createTalkTrackPayloadFromSource({
            source: selectedSource,
            title: draft.title,
            body: draft.body,
          }),
        ),
      })
      const createBody = await readApiBody<TalkTrackCreateBody>(createResponse)

      if (!createResponse.ok || !("ok" in createBody) || createBody.ok !== true) {
        throw new Error(userMessageFromDownstreamError(createBody as DownstreamApiErrorBody))
      }

      setAssets((current) => updateAssetList(current, createBody.asset))
      setMessage(
        selectedSource.sourceKind === "ai_review"
          ? "已从复盘建议创建话术草稿"
          : "已创建人工话术草稿",
      )

      if (selectedSource.sourceKind === "manual") {
        const nextSource = createManualTalkTrackSource()
        setManualSource(nextSource)
        setSelectedSourceKey(sourceKey(nextSource))
        setDraft(defaultTalkTrackDraft(nextSource))
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存话术草稿失败")
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
                  <Badge variant="secondary">话术资产</Badge>
                  <Badge variant="outline">需要进入团队</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
                  进入话术工作台
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  进入后可以查看团队话术草稿，也可以把已采纳复盘建议整理成可复核的话术资产。
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
            <EntryPoint icon={Bot} title="接收建议" description="只接收已采纳的复盘区块。" />
            <EntryPoint icon={FileText} title="编辑草稿" description="保存前先改成主播可直接讲的话。" />
            <EntryPoint icon={Sparkles} title="保留来源" description="草稿会保留复盘来源和审核状态。" />
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
              aria-label="重新加载话术资产"
              onClick={() => void loadWorkspace(scope).finally(() => setActionState("idle"))}
              disabled={isBusy}
            >
              <RefreshCcw />
            </Button>
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel overflow-hidden" delay={0.04}>
          <div className="border-b px-5 py-4">
            <h2 className="text-base font-semibold">草稿来源</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              选择人工录入，或使用已采纳复盘建议。
            </p>
          </div>
          <div className="max-h-[560px] divide-y overflow-y-auto">
            <SourceButton
              source={manualSource}
              active={selectedSource.sourceKind === "manual"}
              onClick={chooseFreshManualSource}
            />
            {aiSources.length === 0 ? (
              <EmptyList message="暂无已采纳话术建议。可先到智能复盘采纳话术或短视频区块。" />
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
                  <Badge variant="secondary">话术资产</Badge>
                  <Badge variant="outline">
                    {selectedSource.sourceKind === "ai_review" ? "复盘来源" : "人工录入"}
                  </Badge>
                </div>
                <h2 className="mt-3 break-words text-2xl font-semibold tracking-normal md:text-3xl">
                  创建可复核话术草稿
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  把复盘建议改成主播能直接讲的句子；保存后仍是草稿，不会自动发布。
                </p>
              </div>
              <Button onClick={saveDraft} disabled={!canSave} className="w-full sm:w-fit">
                {actionState === "saving" ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <Save data-icon="inline-start" />
                )}
                保存草稿
              </Button>
            </div>
          </div>

          <div className="grid gap-0 divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
            <Metric label="话术资产" value={`${assets.length}`} description="当前团队已保存记录" />
            <Metric label="可用来源" value={`${aiSources.length}`} description="来自已采纳复盘区块" />
            <Metric
              label="当前状态"
              value={actionState === "saving" ? "保存中" : "可编辑"}
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
          <section className="workbench-panel" aria-labelledby="talk-track-draft-title">
            <SectionHeader
              id="talk-track-draft-title"
              icon={Plus}
              title="草稿内容"
              description="标题和正文会写入话术资产，后续可继续审核发布。"
              badge={selectedSource.sourceKind === "ai_review" ? "AI 建议草稿" : "人工草稿"}
            />
            <div className="grid gap-4 p-5">
              <LabeledInput
                id="talk-track-title"
                label="话术标题"
                value={draft.title}
                onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
                disabled={isBusy}
              />
              <LabeledTextarea
                id="talk-track-body"
                label="主播可讲正文"
                value={draft.body}
                onChange={(value) => setDraft((current) => ({ ...current, body: value }))}
                disabled={isBusy}
              />
            </div>
          </section>
        </MotionPanel>

        <MotionPanel delay={0.1}>
          <section className="workbench-panel" aria-labelledby="talk-track-assets-title">
            <SectionHeader
              id="talk-track-assets-title"
              icon={FileText}
              title="话术列表"
              description="草稿会保留状态、场景和来源，发布前仍需复核。"
              badge={assets.length ? `${assets.length} 条` : "暂无"}
            />
            {assets.length === 0 ? (
              <div className="p-5">
                <StatusMessage
                  icon={CircleDashed}
                  title="暂无话术资产"
                  message="先保存一条人工草稿，或从已采纳复盘建议创建。"
                />
              </div>
            ) : (
              <div className="grid gap-3 p-5 md:grid-cols-2">
                {assets.map((asset, index) => (
                  <TalkTrackAssetCard key={asset.id} asset={asset} delay={index * 0.025} />
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
                {selectedSource.sourceKind === "ai_review" ? "复盘建议" : "人工输入"}
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
            <Bot className="size-4 text-primary" />
            <h2 className="text-base font-semibold">复核提示</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <CheckItem label="保存后保持草稿状态" />
            <CheckItem label="AI 来源会先记录下游引用" />
            <CheckItem label="发布前继续人工确认" />
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

function TalkTrackAssetCard({
  asset,
  delay,
}: {
  asset: TalkTrackAssetView
  delay: number
}) {
  const version = asset.currentVersion
  const scenario = asset.scenario

  return (
    <MotionListItem delay={delay} className="workbench-row flex min-h-56 flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <FileText className="size-4 text-primary" />
          <h3 className="mt-3 break-words text-sm font-semibold">{asset.title}</h3>
        </div>
        <Badge variant="outline">{talkTrackStatusLabels[asset.status]}</Badge>
      </div>
      <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-muted-foreground">
        {version?.body ?? "暂无正文"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="secondary">{talkTrackAssetTypeLabels[asset.assetType]}</Badge>
        <Badge variant="outline">{scenario?.liveScene ?? "未设场景"}</Badge>
        <Badge variant="outline">
          {version?.readiness.ready ? "可复用" : "待复核"}
        </Badge>
      </div>
      <div className="mt-auto pt-4 text-xs leading-5 text-muted-foreground">
        更新于 {formatDownstreamDate(asset.updatedAt)}
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
