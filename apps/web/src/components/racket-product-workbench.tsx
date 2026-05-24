"use client"

import {
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  FileCheck2,
  Loader2,
  LogIn,
  Plus,
  RefreshCcw,
  Save,
  Send,
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
  createDefaultRacketProductDraft,
  createDefaultRacketProductSourceDraft,
  createDefaultRacketPublicationDraft,
  createDefaultRacketReviewDecisionDraft,
  createJsonMutationInit,
  createRacketProductPayload,
  createRacketProductSourceMetadataPayload,
  createRacketPublicationPayload,
  createRacketReviewDecisionPayload,
  defaultOperatorV0Scope,
  formatReferenceDate,
  isRacketSourceDraftReady,
  isRacketProductDraftReady,
  isRacketReviewDecisionReady,
  knowledgeBlockerLabels,
  operatorV0BootstrapCsrfHeaderName,
  operatorV0BootstrapCsrfHeaderValue,
  racketBalanceTypeLabels,
  racketBlockerLabels,
  racketProductMutationCsrfHeaderName,
  racketProductMutationCsrfHeaderValue,
  racketProductStatusLabels,
  racketSourceRefreshPolicyLabels,
  racketSourceReviewStateLabels,
  racketSourceTrustLevelLabels,
  racketSourceTypeLabels,
  racketWorkflowLabels,
  readApiBody,
  readStoredReferenceDataScope,
  safeStatusLabel,
  scopedApi,
  storeReferenceDataScope,
  userMessageFromReferenceDataError,
  type AuthSessionBody,
  type BootstrapBody,
  type OperatorV0Scope,
  type RacketDownstreamWorkflow,
  type RacketProductCreateBody,
  type RacketProductDraft,
  type RacketProductListBody,
  type RacketProductPublishBody,
  type RacketProductSourceCreateBody,
  type RacketProductSourceDraft,
  type RacketProductSubmitBody,
  type RacketProductView,
  type RacketReviewDecisionBody,
  type RacketReviewDecisionDraft,
  type RacketReviewQueueBody,
  type RacketReviewQueueItem,
  type ReferenceDataApiErrorBody,
} from "@/lib/reference-data-v0-workflow"
import { cn } from "@/lib/utils"

type WorkbenchPhase = "checking" | "entry" | "ready" | "error"
type ActionState =
  | "idle"
  | "entering"
  | "loading"
  | "saving"
  | "source"
  | "submit"
  | "review"
  | "publish"

const fieldClassName =
  "min-h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"

const textareaClassName = cn(fieldClassName, "min-h-24 resize-y leading-6")

const statusTone: Record<string, string> = {
  draft: "workbench-status-muted",
  needs_source: "workbench-status-warning",
  reviewing: "workbench-status-info",
  approved: "workbench-status-success",
  published: "workbench-status-success",
  stale: "workbench-status-warning",
  conflict: "workbench-status-warning",
  archived: "workbench-status-muted",
  rejected: "workbench-status-warning",
}

function updateProductList(
  products: RacketProductView[],
  nextProduct: RacketProductView,
): RacketProductView[] {
  const existingIndex = products.findIndex((product) => product.id === nextProduct.id)

  if (existingIndex === -1) {
    return [nextProduct, ...products]
  }

  return products.map((product) =>
    product.id === nextProduct.id ? nextProduct : product,
  )
}

function productReadyFor(
  product: RacketProductView,
  workflow: RacketDownstreamWorkflow,
): boolean {
  return product.downstreamReadiness.some(
    (item) => item.workflow === workflow && item.ready,
  )
}

function readinessSummary(product: RacketProductView): string {
  const aiReadiness = product.downstreamReadiness.find(
    (item) => item.workflow === "ai_review",
  )

  if (!aiReadiness) {
    return "待确认"
  }

  return blockerText(aiReadiness.blockedBy, {
    ...racketBlockerLabels,
    ...knowledgeBlockerLabels,
  })
}

export function RacketProductWorkbench() {
  const [phase, setPhase] = useState<WorkbenchPhase>("checking")
  const [actionState, setActionState] = useState<ActionState>("idle")
  const [scope, setScope] = useState<OperatorV0Scope>(() => defaultOperatorV0Scope())
  const [products, setProducts] = useState<RacketProductView[]>([])
  const [reviewQueue, setReviewQueue] = useState<RacketReviewQueueItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [draft, setDraft] = useState<RacketProductDraft>(() =>
    createDefaultRacketProductDraft(),
  )
  const [sourceDraft, setSourceDraft] = useState<RacketProductSourceDraft>(() =>
    createDefaultRacketProductSourceDraft(),
  )
  const [sourceDecision, setSourceDecision] = useState<RacketReviewDecisionDraft>(() =>
    createDefaultRacketReviewDecisionDraft(),
  )
  const [productDecision, setProductDecision] = useState<RacketReviewDecisionDraft>(() =>
    createDefaultRacketReviewDecisionDraft("", "", "product"),
  )
  const [publicationDraft, setPublicationDraft] = useState(() =>
    createDefaultRacketPublicationDraft(),
  )
  const [message, setMessage] = useState("正在检查登录状态")
  const [error, setError] = useState("")

  const isBusy = actionState !== "idle"
  const canSave = isRacketProductDraftReady(draft) && !isBusy && phase === "ready"
  const selectedProduct = useMemo(
    () =>
      products.find((product) => product.id === selectedProductId) ??
      products[0] ??
      null,
    [products, selectedProductId],
  )
  const selectedQueueItem = useMemo(
    () =>
      selectedProduct
        ? reviewQueue.find((item) => item.product.id === selectedProduct.id) ?? null
        : null,
    [reviewQueue, selectedProduct],
  )
  const selectedSourceSummary = selectedQueueItem?.sourceSummary ??
    (selectedProduct
      ? {
          total: selectedProduct.sourceIds.length,
          approved: selectedProduct.sourceIds.length,
          pending: 0,
          rejected: 0,
          stale: 0,
        }
      : null)
  const selectedSource =
    selectedQueueItem?.sources.find((source) => source.reviewState === "pending") ??
    selectedQueueItem?.sources[0] ??
    null
  const canRegisterSource =
    Boolean(selectedProduct) &&
    isRacketSourceDraftReady({ ...sourceDraft, productId: selectedProduct?.id ?? "" }) &&
    !isBusy &&
    phase === "ready"
  const canSubmitReview =
    Boolean(
      selectedProduct &&
        ["draft", "needs_source", "reviewing"].includes(selectedProduct.status) &&
        selectedSourceSummary &&
        selectedSourceSummary.total > 0,
    ) &&
    !isBusy &&
    phase === "ready"
  const canApproveSource =
    Boolean(selectedProduct && selectedSource && selectedSource.reviewState === "pending") &&
    isRacketReviewDecisionReady({
      ...sourceDecision,
      productId: selectedProduct?.id ?? "",
      targetId: selectedSource?.id ?? "",
      targetType: "source",
    }) &&
    !isBusy &&
    phase === "ready"
  const canApproveProduct =
    Boolean(
      selectedProduct &&
        selectedProduct.status === "reviewing" &&
        selectedSourceSummary &&
        selectedSourceSummary.approved > 0,
    ) &&
    isRacketReviewDecisionReady({
      ...productDecision,
      productId: selectedProduct?.id ?? "",
      targetId: selectedProduct?.id ?? "",
      targetType: "product",
    }) &&
    !isBusy &&
    phase === "ready"
  const canPublish =
    Boolean(selectedProduct && selectedProduct.status === "approved") &&
    Boolean(publicationDraft.changeReason.trim()) &&
    !isBusy &&
    phase === "ready"
  const approvedCount = products.filter((product) =>
    ["approved", "published"].includes(product.status),
  ).length
  const aiReadyCount = products.filter((product) =>
    productReadyFor(product, "ai_review"),
  ).length
  const blockedCount = products.filter(
    (product) => !productReadyFor(product, "ai_review"),
  ).length

  const metrics = useMemo(
    () => [
      {
        label: "团队型号",
        value: products.length.toString(),
        description: products.length > 0 ? "已保存到当前团队" : "暂无记录，先添加一个型号",
        tone: products.length > 0 ? "success" : "muted",
      },
      {
        label: "已审核",
        value: approvedCount.toString(),
        description: "只有审核后的资料才适合进入讲解口径",
        tone: approvedCount > 0 ? "success" : "warning",
      },
      {
        label: "可用于复盘",
        value: aiReadyCount.toString(),
        description: "根据当前 readiness 返回判断",
        tone: aiReadyCount > 0 ? "success" : "info",
      },
      {
        label: "待补齐",
        value: blockedCount.toString(),
        description: "缺来源、审核或发布时不会标记为可用",
        tone: blockedCount > 0 ? "warning" : "success",
      },
    ],
    [aiReadyCount, approvedCount, blockedCount, products.length],
  )

  const loadReviewQueue = useCallback(async (nextScope: OperatorV0Scope) => {
    const response = await fetch(
      scopedApi("/api/rackets/review-queue?limit=50", nextScope),
      {
        credentials: "include",
        cache: "no-store",
      },
    )
    const body = await readApiBody<RacketReviewQueueBody>(response)

    if (!response.ok || !("ok" in body) || body.ok !== true) {
      throw new Error(userMessageFromReferenceDataError(body as ReferenceDataApiErrorBody))
    }

    setReviewQueue(body.items)
  }, [])

  const loadProducts = useCallback(async (nextScope: OperatorV0Scope) => {
    setActionState("loading")
    setError("")

    const response = await fetch(scopedApi("/api/rackets/products?limit=50", nextScope), {
      credentials: "include",
      cache: "no-store",
    })
    const body = await readApiBody<RacketProductListBody>(response)

    if (!response.ok || !("ok" in body) || body.ok !== true) {
      throw new Error(userMessageFromReferenceDataError(body as ReferenceDataApiErrorBody))
    }

    setProducts(body.products)
    setSelectedProductId((current) =>
      body.products.some((product) => product.id === current)
        ? current
        : body.products[0]?.id ?? "",
    )
    await loadReviewQueue(nextScope)
    setMessage(body.products.length > 0 ? "已加载产品库" : "暂无产品，先添加一个型号")
  }, [loadReviewQueue])

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
        await loadProducts(verifiedScope)
      } else {
        setPhase("entry")
        setMessage("进入团队后可以维护球拍资料")
      }
    } catch (caught) {
      setPhase("error")
      setError(caught instanceof Error ? caught.message : "登录状态检查失败")
    } finally {
      setActionState("idle")
    }
  }, [loadProducts])

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
      await loadProducts(nextScope)
      setMessage("已进入产品库工作台")
    } catch (caught) {
      setPhase("entry")
      setError(caught instanceof Error ? caught.message : "进入失败")
    } finally {
      setActionState("idle")
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSave) {
      return
    }

    setActionState("saving")
    setError("")

    try {
      const response = await fetch(
        scopedApi("/api/rackets/products", scope),
        createJsonMutationInit({
          csrfHeaderName: racketProductMutationCsrfHeaderName,
          csrfHeaderValue: racketProductMutationCsrfHeaderValue,
          body: createRacketProductPayload(draft),
        }),
      )
      const body = await readApiBody<RacketProductCreateBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromReferenceDataError(body as ReferenceDataApiErrorBody))
      }

      setProducts((current) => updateProductList(current, body.product))
      setSelectedProductId(body.product.id)
      setMessage("已保存球拍草稿")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存失败")
    } finally {
      setActionState("idle")
    }
  }

  async function registerSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedProduct || !canRegisterSource) {
      return
    }

    setActionState("source")
    setError("")

    try {
      const response = await fetch(
        scopedApi(`/api/rackets/products/${selectedProduct.id}/sources`, scope),
        createJsonMutationInit({
          csrfHeaderName: racketProductMutationCsrfHeaderName,
          csrfHeaderValue: racketProductMutationCsrfHeaderValue,
          body: createRacketProductSourceMetadataPayload({
            ...sourceDraft,
            productId: selectedProduct.id,
          }),
        }),
      )
      const body = await readApiBody<RacketProductSourceCreateBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromReferenceDataError(body as ReferenceDataApiErrorBody))
      }

      setSourceDraft({
        ...createDefaultRacketProductSourceDraft(),
        productId: selectedProduct.id,
      })
      setSourceDecision(
        createDefaultRacketReviewDecisionDraft(
          selectedProduct.id,
          body.source.id,
          "source",
        ),
      )
      setMessage("已登记来源，等待审核")
      await loadProducts(scope)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "来源登记失败")
    } finally {
      setActionState("idle")
    }
  }

  async function submitSelectedProductForReview() {
    if (!selectedProduct || !canSubmitReview) {
      return
    }

    setActionState("submit")
    setError("")

    try {
      const response = await fetch(
        scopedApi(`/api/rackets/products/${selectedProduct.id}/submit`, scope),
        createJsonMutationInit({
          csrfHeaderName: racketProductMutationCsrfHeaderName,
          csrfHeaderValue: racketProductMutationCsrfHeaderValue,
          body: { productId: selectedProduct.id },
        }),
      )
      const body = await readApiBody<RacketProductSubmitBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromReferenceDataError(body as ReferenceDataApiErrorBody))
      }

      setProducts((current) => updateProductList(current, body.product))
      setMessage("已提交审核")
      await loadProducts(scope)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "提交审核失败")
    } finally {
      setActionState("idle")
    }
  }

  async function approveSelectedSource() {
    if (!selectedProduct || !selectedSource || !canApproveSource) {
      return
    }

    setActionState("review")
    setError("")

    try {
      const response = await fetch(
        scopedApi("/api/rackets/review-decisions", scope),
        createJsonMutationInit({
          csrfHeaderName: racketProductMutationCsrfHeaderName,
          csrfHeaderValue: racketProductMutationCsrfHeaderValue,
          body: createRacketReviewDecisionPayload({
            ...sourceDecision,
            productId: selectedProduct.id,
            targetId: selectedSource.id,
            targetType: "source",
            decision: "approve",
          }),
        }),
      )
      const body = await readApiBody<RacketReviewDecisionBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromReferenceDataError(body as ReferenceDataApiErrorBody))
      }

      setMessage("已审核来源")
      await loadProducts(scope)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "来源审核失败")
    } finally {
      setActionState("idle")
    }
  }

  async function approveSelectedProduct() {
    if (!selectedProduct || !canApproveProduct) {
      return
    }

    setActionState("review")
    setError("")

    try {
      const response = await fetch(
        scopedApi("/api/rackets/review-decisions", scope),
        createJsonMutationInit({
          csrfHeaderName: racketProductMutationCsrfHeaderName,
          csrfHeaderValue: racketProductMutationCsrfHeaderValue,
          body: createRacketReviewDecisionPayload({
            ...productDecision,
            productId: selectedProduct.id,
            targetId: selectedProduct.id,
            targetType: "product",
            decision: "approve",
          }),
        }),
      )
      const body = await readApiBody<RacketReviewDecisionBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromReferenceDataError(body as ReferenceDataApiErrorBody))
      }

      if (body.targetType === "product") {
        setProducts((current) => updateProductList(current, body.product))
      }
      setMessage("已审核产品")
      await loadProducts(scope)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "产品审核失败")
    } finally {
      setActionState("idle")
    }
  }

  async function publishSelectedProduct() {
    if (!selectedProduct || !canPublish) {
      return
    }

    setActionState("publish")
    setError("")

    try {
      const response = await fetch(
        scopedApi(`/api/rackets/products/${selectedProduct.id}/publish`, scope),
        createJsonMutationInit({
          csrfHeaderName: racketProductMutationCsrfHeaderName,
          csrfHeaderValue: racketProductMutationCsrfHeaderValue,
          body: createRacketPublicationPayload({
            ...publicationDraft,
            productId: selectedProduct.id,
          }),
        }),
      )
      const body = await readApiBody<RacketProductPublishBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromReferenceDataError(body as ReferenceDataApiErrorBody))
      }

      setProducts((current) => updateProductList(current, body.product))
      setMessage("已发布产品资料")
      await loadProducts(scope)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "发布失败")
    } finally {
      setActionState("idle")
    }
  }

  function updateDraft(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const field = event.target.name as keyof RacketProductDraft
    const value = event.target.value

    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateSourceDraft(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const field = event.target.name as keyof RacketProductSourceDraft
    const value = event.target.value

    setSourceDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateSourceDecision(
    event: ChangeEvent<HTMLTextAreaElement>,
  ) {
    setSourceDecision((current) => ({
      ...current,
      reason: event.target.value,
    }))
  }

  function updateProductDecision(
    event: ChangeEvent<HTMLTextAreaElement>,
  ) {
    setProductDecision((current) => ({
      ...current,
      reason: event.target.value,
    }))
  }

  function updatePublicationDraft(event: ChangeEvent<HTMLTextAreaElement>) {
    setPublicationDraft((current) => ({
      ...current,
      changeReason: event.target.value,
    }))
  }

  function resetDraft() {
    setDraft(createDefaultRacketProductDraft())
    setError("")
    setMessage("已重置为示例草稿")
  }

  return (
    <div className="workspace-page xl:grid-cols-[minmax(0,1fr)_minmax(300px,var(--workspace-aside-width-md))]">
      <section className="min-w-0 space-y-5">
        <MotionPanel className="workbench-panel overflow-hidden">
          <div className="border-b bg-surface px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="workspace-readable">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">产品资料</Badge>
                  <Badge variant="outline">V0 可保存</Badge>
                  <Badge variant="outline">来源待审核</Badge>
                  <Badge variant="outline">{message}</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
                  维护球拍产品库
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  先把型号、别名、规格和适合人群录清楚。草稿不会自动发布，确认来源后再进入讲解和复盘。
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:w-[280px] lg:grid-cols-1">
                {phase === "ready" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadProducts(scope)}
                    disabled={isBusy}
                  >
                    {actionState === "loading" ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <RefreshCcw data-icon="inline-start" />
                    )}
                    刷新产品
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
                  onClick={resetDraft}
                  disabled={isBusy}
                >
                  <Plus data-icon="inline-start" />
                  新草稿
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
          <section className="workbench-panel" aria-labelledby="racket-form-title">
            <SectionHeader
              id="racket-form-title"
              icon={ClipboardList}
              title="添加型号"
              description="用直播讲解需要的字段保存草稿。"
              badge={phase === "ready" ? "可保存" : "先进入团队"}
            />
            <form onSubmit={(event) => void saveProduct(event)} className="space-y-4 p-5">
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="品牌">
                  <input
                    className={fieldClassName}
                    name="brand"
                    value={draft.brand}
                    onChange={updateDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <Field label="系列">
                  <input
                    className={fieldClassName}
                    name="series"
                    value={draft.series}
                    onChange={updateDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <Field label="型号">
                  <input
                    className={fieldClassName}
                    name="model"
                    value={draft.model}
                    onChange={updateDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Field label="别名">
                  <input
                    className={fieldClassName}
                    name="aliases"
                    value={draft.aliases}
                    onChange={updateDraft}
                    disabled={phase !== "ready" || isBusy}
                    placeholder="用逗号分隔"
                  />
                </Field>
                <Field label="重量规格">
                  <input
                    className={fieldClassName}
                    name="weightClasses"
                    value={draft.weightClasses}
                    onChange={updateDraft}
                    disabled={phase !== "ready" || isBusy}
                    placeholder="4U, 3U"
                  />
                </Field>
                <Field label="平衡类型">
                  <select
                    className={fieldClassName}
                    name="balanceType"
                    value={draft.balanceType}
                    onChange={updateDraft}
                    disabled={phase !== "ready" || isBusy}
                  >
                    <option value="head_heavy">头重</option>
                    <option value="even">均衡</option>
                    <option value="head_light">头轻</option>
                    <option value="unknown">待确认</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Field label="平衡点">
                  <input
                    className={fieldClassName}
                    name="balancePoint"
                    value={draft.balancePoint}
                    onChange={updateDraft}
                    disabled={phase !== "ready" || isBusy}
                    placeholder="没有可靠来源可留空"
                  />
                </Field>
                <Field label="中杆硬度">
                  <input
                    className={fieldClassName}
                    name="shaftStiffness"
                    value={draft.shaftStiffness}
                    onChange={updateDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <Field label="推荐磅数">
                  <input
                    className={fieldClassName}
                    name="recommendedTension"
                    value={draft.recommendedTension}
                    onChange={updateDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Field label="适合水平">
                  <input
                    className={fieldClassName}
                    name="playerLevels"
                    value={draft.playerLevels}
                    onChange={updateDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <Field label="打法">
                  <input
                    className={fieldClassName}
                    name="playStyles"
                    value={draft.playStyles}
                    onChange={updateDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <Field label="价格带">
                  <input
                    className={fieldClassName}
                    name="priceBand"
                    value={draft.priceBand}
                    onChange={updateDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <Field label="直播卖点">
                  <textarea
                    className={textareaClassName}
                    name="sellingFocus"
                    value={draft.sellingFocus}
                    onChange={updateDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
                <Field label="不适合场景">
                  <textarea
                    className={textareaClassName}
                    name="limitations"
                    value={draft.limitations}
                    onChange={updateDraft}
                    disabled={phase !== "ready" || isBusy}
                  />
                </Field>
              </div>

              <Field label="关联来源">
                <input
                  className={fieldClassName}
                  name="sourceIds"
                  value={draft.sourceIds}
                  onChange={updateDraft}
                  disabled={phase !== "ready" || isBusy}
                  placeholder="有已审核来源时再填写"
                />
              </Field>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">
                  草稿保存后仍需来源和审核确认。
                </p>
                <Button type="submit" disabled={!canSave}>
                  {actionState === "saving" ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Save data-icon="inline-start" />
                  )}
                  保存草稿
                </Button>
              </div>
            </form>
          </section>
        </MotionPanel>

        <MotionPanel delay={0.08}>
          <section
            className="workbench-panel overflow-hidden"
            aria-labelledby="racket-records-title"
          >
            <SectionHeader
              id="racket-records-title"
              icon={CircleDashed}
              title="产品资料"
              description="按当前团队范围加载。"
              badge={`${products.length} 条`}
            />
            {phase !== "ready" ? (
              <EmptyState
                icon={LogIn}
                title="先进入团队"
                description="进入后才会加载和保存产品资料。"
              />
            ) : products.length === 0 ? (
              <EmptyState
                icon={Plus}
                title="暂无产品"
                description="先添加一个常讲型号，后续复盘和话术才能引用。"
              />
            ) : (
              <div className="divide-y">
                {products.map((product, index) => (
                  <MotionListItem
                    key={product.id}
                    delay={index * 0.035}
                    className={cn(
                      "grid gap-4 px-5 py-4 text-sm 2xl:grid-cols-[minmax(180px,0.85fr)_minmax(0,1.35fr)_minmax(0,1fr)_190px]",
                      selectedProduct?.id === product.id ? "bg-primary/5" : "",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="break-words font-semibold">{product.model}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {[product.brand, product.series].filter(Boolean).join(" · ")}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {product.aliases.length > 0 ? (
                          product.aliases.map((alias) => (
                            <Badge
                              key={alias}
                              variant="outline"
                              className="h-auto min-h-6 whitespace-normal py-1"
                            >
                              {alias}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">暂无别名</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <SpecField
                        label="重量"
                        value={product.specs.weightClasses.join("、") || "待确认"}
                      />
                      <SpecField
                        label="平衡"
                        value={
                          product.specs.balancePoint ||
                          racketBalanceTypeLabels[product.specs.balanceType]
                        }
                      />
                      <SpecField
                        label="中杆"
                        value={product.specs.shaftStiffness || "待确认"}
                      />
                      <SpecField
                        label="磅数"
                        value={product.specs.recommendedTension || "待确认"}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-1.5">
                        {product.positioning.playerLevels.map((level) => (
                          <Badge key={level} variant="secondary">
                            {level}
                          </Badge>
                        ))}
                        <Badge variant="outline">
                          {product.positioning.priceBand || "价格待确认"}
                        </Badge>
                      </div>
                      <p className="mt-2 break-words leading-6">
                        {product.positioning.playStyles.join("、") || "打法待确认"}
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {product.positioning.sellingFocus.join("、") || "卖点待补充"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 xl:items-end">
                      <span
                        className={cn(
                          "rounded-4xl border px-2 py-0.5 text-xs font-medium",
                          statusTone[product.status] ?? "workbench-status-muted",
                        )}
                      >
                        {safeStatusLabel(racketProductStatusLabels, product.status)}
                      </span>
                      <span className="text-xs leading-5 text-muted-foreground xl:text-right">
                        复盘：{readinessSummary(product)}
                      </span>
                      <span className="text-xs leading-5 text-muted-foreground xl:text-right">
                        更新：{formatReferenceDate(product.updatedAt)}
                      </span>
                      <Button
                        type="button"
                        variant={selectedProduct?.id === product.id ? "secondary" : "outline"}
                        size="xs"
                        onClick={() => {
                          setSelectedProductId(product.id)
                          setSourceDraft((current) => ({
                            ...current,
                            productId: product.id,
                          }))
                        }}
                        disabled={isBusy}
                      >
                        {selectedProduct?.id === product.id ? "已选择" : "选择"}
                      </Button>
                    </div>
                  </MotionListItem>
                ))}
              </div>
            )}
          </section>
        </MotionPanel>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <MotionPanel delay={0.12}>
            <section className="workbench-panel h-full" aria-labelledby="source-lane-title">
              <SectionHeader
                id="source-lane-title"
                icon={FileCheck2}
                title="来源与审核"
                description="给选中型号补来源，再推进审核和发布。"
                badge={selectedProduct ? selectedProduct.model : "未选择"}
              />
              {selectedProduct ? (
                <div className="grid gap-4 p-5">
                  <div className="workbench-row p-4 text-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{selectedProduct.model}</Badge>
                          <Badge variant="outline">
                            {safeStatusLabel(racketProductStatusLabels, selectedProduct.status)}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          来源 {selectedSourceSummary?.total ?? 0} 条 · 已审核{" "}
                          {selectedSourceSummary?.approved ?? 0} 条 · 待审核{" "}
                          {selectedSourceSummary?.pending ?? 0} 条
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void submitSelectedProductForReview()}
                        disabled={!canSubmitReview}
                      >
                        {actionState === "submit" ? (
                          <Loader2 data-icon="inline-start" className="animate-spin" />
                        ) : (
                          <Send data-icon="inline-start" />
                        )}
                        提交审核
                      </Button>
                    </div>
                  </div>

                  <form onSubmit={(event) => void registerSource(event)} className="grid gap-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="来源标题">
                        <input
                          className={fieldClassName}
                          name="title"
                          value={sourceDraft.title}
                          onChange={updateSourceDraft}
                          disabled={phase !== "ready" || isBusy}
                        />
                      </Field>
                      <Field label="来源链接">
                        <input
                          className={fieldClassName}
                          name="url"
                          value={sourceDraft.url}
                          onChange={updateSourceDraft}
                          disabled={phase !== "ready" || isBusy}
                          placeholder="团队记录可留空"
                        />
                      </Field>
                    </div>
                    <div className="grid gap-3 md:grid-cols-4">
                      <Field label="来源类型">
                        <select
                          className={fieldClassName}
                          name="sourceType"
                          value={sourceDraft.sourceType}
                          onChange={updateSourceDraft}
                          disabled={phase !== "ready" || isBusy}
                        >
                          {Object.entries(racketSourceTypeLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="信任级别">
                        <select
                          className={fieldClassName}
                          name="trustLevel"
                          value={sourceDraft.trustLevel}
                          onChange={updateSourceDraft}
                          disabled={phase !== "ready" || isBusy}
                        >
                          {Object.entries(racketSourceTrustLevelLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="刷新策略">
                        <select
                          className={fieldClassName}
                          name="refreshPolicy"
                          value={sourceDraft.refreshPolicy}
                          onChange={updateSourceDraft}
                          disabled={phase !== "ready" || isBusy}
                        >
                          {Object.entries(racketSourceRefreshPolicyLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
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
                    <div className="flex justify-end">
                      <Button type="submit" disabled={!canRegisterSource}>
                        {actionState === "source" ? (
                          <Loader2 data-icon="inline-start" className="animate-spin" />
                        ) : (
                          <Plus data-icon="inline-start" />
                        )}
                        登记来源
                      </Button>
                    </div>
                  </form>

                  <div className="grid gap-3">
                    <div className="workbench-row p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 text-sm">
                          <div className="font-medium">审核动作</div>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {selectedProduct.status === "published"
                              ? "已发布，来源已随产品记录保存"
                              : selectedSource
                              ? `${selectedSource.title} · ${racketSourceReviewStateLabels[selectedSource.reviewState]}`
                              : "先登记来源后再审核"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void approveSelectedSource()}
                            disabled={!canApproveSource}
                          >
                            <ShieldCheck data-icon="inline-start" />
                            审来源
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void approveSelectedProduct()}
                            disabled={!canApproveProduct}
                          >
                            <FileCheck2 data-icon="inline-start" />
                            审产品
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void publishSelectedProduct()}
                            disabled={!canPublish}
                          >
                            {actionState === "publish" ? (
                              <Loader2 data-icon="inline-start" className="animate-spin" />
                            ) : (
                              <CheckCircle2 data-icon="inline-start" />
                            )}
                            发布
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <Field label="来源审核原因">
                          <textarea
                            className={cn(textareaClassName, "min-h-20")}
                            value={sourceDecision.reason}
                            onChange={updateSourceDecision}
                            disabled={phase !== "ready" || isBusy}
                          />
                        </Field>
                        <Field label="产品审核原因">
                          <textarea
                            className={cn(textareaClassName, "min-h-20")}
                            value={productDecision.reason}
                            onChange={updateProductDecision}
                            disabled={phase !== "ready" || isBusy}
                          />
                        </Field>
                        <Field label="发布说明">
                          <textarea
                            className={cn(textareaClassName, "min-h-20")}
                            value={publicationDraft.changeReason}
                            onChange={updatePublicationDraft}
                            disabled={phase !== "ready" || isBusy}
                          />
                        </Field>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="text-xs font-medium text-muted-foreground">审核队列</div>
                    {reviewQueue.length === 0 ? (
                      <div className="workbench-row px-4 py-3 text-sm text-muted-foreground">
                        暂无待处理产品
                      </div>
                    ) : (
                      reviewQueue.slice(0, 5).map((item) => (
                        <button
                          key={item.product.id}
                          type="button"
                          className={cn(
                            "workbench-row grid gap-2 px-4 py-3 text-left text-sm transition hover:bg-muted/50 md:grid-cols-[minmax(0,1fr)_auto]",
                            selectedProduct.id === item.product.id ? "bg-primary/5" : "",
                          )}
                          onClick={() => setSelectedProductId(item.product.id)}
                          disabled={isBusy}
                        >
                          <span className="min-w-0">
                            <span className="block break-words font-medium">
                              {item.product.model}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              来源 {item.sourceSummary.total} · 已审{" "}
                              {item.sourceSummary.approved} · 待审{" "}
                              {item.sourceSummary.pending}
                            </span>
                          </span>
                          <Badge variant="outline" className="w-fit">
                            {safeStatusLabel(racketProductStatusLabels, item.product.status)}
                          </Badge>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={CircleDashed}
                  title="先选择型号"
                  description="保存或选择一个产品后再登记来源。"
                />
              )}
            </section>
          </MotionPanel>

          <MotionPanel delay={0.15}>
            <section className="workbench-panel h-full" aria-labelledby="readiness-title">
              <SectionHeader
                id="readiness-title"
                icon={CheckCircle2}
                title="下游可用性"
                description="按产品返回的 readiness 展示。"
                badge="当前状态"
              />
              <div className="divide-y">
                {(["session_capture", "ai_review", "talk_tracks", "qa_agent"] as const).map(
                  (workflow, index) => {
                    const readyCount = products.filter((product) =>
                      productReadyFor(product, workflow),
                    ).length

                    return (
                      <MotionListItem
                        key={workflow}
                        delay={index * 0.025}
                        className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[32px_minmax(0,0.7fr)_minmax(0,1.3fr)]"
                      >
                        <CheckCircle2 className="size-4 text-primary" />
                        <div className="min-w-0 font-medium">
                          {racketWorkflowLabels[workflow]}
                        </div>
                        <div className="min-w-0">
                          <p className="leading-6">
                            {readyCount > 0
                              ? `${readyCount} 个型号可用`
                              : "暂无型号达到可用状态"}
                          </p>
                          <p className="text-xs leading-5 text-muted-foreground">
                            缺来源或审核时会继续阻断。
                          </p>
                        </div>
                      </MotionListItem>
                    )
                  },
                )}
              </div>
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
            <BoundaryItem>保存的是当前团队的产品草稿。</BoundaryItem>
            <BoundaryItem>来源不足时不会标记为可复盘。</BoundaryItem>
            <BoundaryItem>审核和发布都按来源状态逐步开放。</BoundaryItem>
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.16}>
          <div className="flex items-center gap-2">
            <CircleDashed className="size-4 text-primary" />
            <h2 className="text-base font-semibold">录入建议</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            先保证型号、别名、适合人群和限制条件清楚，再补来源。这样主播和运营能快速统一口径。
          </p>
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

function SpecField({ label, value }: { label: string; value: string }) {
  return (
    <div className="workbench-row px-3 py-2">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-xs leading-5">{value}</div>
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
