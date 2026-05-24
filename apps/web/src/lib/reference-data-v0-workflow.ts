import {
  operatorV0BootstrapCsrfHeaderName,
  operatorV0BootstrapCsrfHeaderValue,
  operatorV0TeamId,
  operatorV0TenantId,
  type ApiErrorBody,
  type OperatorV0Scope,
} from "@/lib/session-capture-workflow"

export {
  operatorV0BootstrapCsrfHeaderName,
  operatorV0BootstrapCsrfHeaderValue,
}

export const referenceDataScopeStorageKey = "operation.operatorV0Scope"
export const racketProductMutationCsrfHeaderName = "x-operation-csrf"
export const racketProductMutationCsrfHeaderValue = "racket-products"
export const knowledgeLifecycleMutationCsrfHeaderName = "x-operation-csrf"
export const knowledgeLifecycleMutationCsrfHeaderValue = "knowledge-lifecycle"

export type { OperatorV0Scope }

export type ReferenceDataApiErrorCode =
  | "UNAUTHENTICATED"
  | "AUTH_SCOPE_REQUIRED"
  | "CSRF_HEADER_REQUIRED"
  | "VALIDATION_ERROR"
  | "LONG_INPUT_LIMIT_EXCEEDED"
  | "FORBIDDEN_PERMISSION"
  | "DUPLICATE_MODEL"
  | "ALIAS_CONFLICT"
  | "SOURCE_CONFLICT"
  | "MISSING_SOURCE"
  | "DUPLICATE_SOURCE"
  | "CONFLICTING_CLAIM"
  | "SENSITIVE_DATA_NEEDS_REVIEW"
  | "STATE_TRANSITION_INVALID"
  | "NOT_FOUND"
  | "AUTH_OPERATION_FAILED"
  | "DATABASE_OPERATION_FAILED"
  | "OPERATOR_V0_BOOTSTRAP_DISABLED"
  | "BOOTSTRAP_UNAVAILABLE"
  | string

export type ReferenceDataApiErrorBody = ApiErrorBody & {
  code?: ReferenceDataApiErrorCode
  requestId?: string
  retryable?: boolean
}

export type AuthSessionBody =
  | ReferenceDataApiErrorBody
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
  | ReferenceDataApiErrorBody
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

export type RacketProductStatus =
  | "draft"
  | "needs_source"
  | "reviewing"
  | "approved"
  | "published"
  | "stale"
  | "conflict"
  | "archived"
  | "rejected"

export type RacketDownstreamWorkflow =
  | "session_capture"
  | "ai_review"
  | "talk_tracks"
  | "qa_agent"

export type RacketProductView = {
  id: string
  brand: string
  series: string
  model: string
  normalizedModel: string
  status: RacketProductStatus
  aliases: string[]
  specs: {
    weightClasses: string[]
    balancePoint: string | null
    balanceType: "head_light" | "even" | "head_heavy" | "unknown"
    shaftStiffness: string | null
    recommendedTension: string | null
  }
  positioning: {
    playerLevels: string[]
    playStyles: string[]
    priceBand: string | null
    sellingFocus: string[]
    limitations: string[]
  }
  sourceIds: string[]
  downstreamReadiness: Array<{
    workflow: RacketDownstreamWorkflow
    ready: boolean
    blockedBy: string[]
  }>
  createdAt: string
  updatedAt: string
}

export type RacketProductListBody =
  | ReferenceDataApiErrorBody
  | {
      ok: true
      products: RacketProductView[]
    }

export type RacketProductCreateBody =
  | ReferenceDataApiErrorBody
  | {
      ok: true
      product: RacketProductView
    }

export type RacketProductSourceView = {
  id: string
  productId: string
  sourceType:
    | "official_site"
    | "brand_catalog"
    | "commerce_page"
    | "team_note"
    | "manual_review"
  title: string
  url: string | null
  normalizedSourceKey: string
  retrievedAt: string
  trustLevel: "official" | "commerce" | "team" | "unknown"
  refreshPolicy: "manual" | "monthly" | "quarterly" | "on_demand"
  reviewState: "pending" | "approved" | "rejected" | "stale"
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export type RacketSourceSummary = {
  total: number
  approved: number
  pending: number
  rejected: number
  stale: number
}

export type RacketReviewQueueItem = {
  product: RacketProductView
  sourceSummary: RacketSourceSummary
  sources: RacketProductSourceView[]
}

export type RacketProductSourceCreateBody =
  | ReferenceDataApiErrorBody
  | {
      ok: true
      source: RacketProductSourceView
    }

export type RacketProductSubmitBody =
  | ReferenceDataApiErrorBody
  | {
      ok: true
      product: RacketProductView
    }

export type RacketProductPublishBody =
  | ReferenceDataApiErrorBody
  | {
      ok: true
      product: RacketProductView
    }

export type RacketReviewQueueBody =
  | ReferenceDataApiErrorBody
  | {
      ok: true
      items: RacketReviewQueueItem[]
    }

export type RacketReviewDecisionBody =
  | ReferenceDataApiErrorBody
  | {
      ok: true
      targetType: "source"
      source: RacketProductSourceView
    }
  | {
      ok: true
      targetType: "product"
      product: RacketProductView
    }

export type KnowledgeSourceView = {
  id: string
  sourceType:
    | "official_brand"
    | "official_platform"
    | "official_sport_rule"
    | "authorized_retailer"
    | "academic_research"
    | "team_note"
    | "web_discovery"
  title: string
  owner: string
  url: string | null
  normalizedSourceKey: string
  retrievedAt: string
  trustLevel: "official" | "authorized" | "research" | "team" | "unknown"
  reviewState:
    | "registered"
    | "extracting"
    | "reviewing"
    | "approved"
    | "rejected"
    | "stale"
    | "conflict"
    | "archived"
  refreshCadence: "manual" | "monthly" | "quarterly" | "on_demand"
  intendedUse: string[]
  lastCheckedAt: string | null
  downstreamReadiness: Array<{
    workflow: "ai_review" | "talk_tracks" | "qa_agent" | "source_refresh"
    ready: boolean
    blockedBy: string[]
  }>
  createdAt: string
  updatedAt: string
}

export type ExtractedKnowledgeClaimView = {
  id: string
  sourceId: string
  claimType:
    | "racket_spec"
    | "platform_rule"
    | "sales_guidance"
    | "customer_question"
    | "objection_reply"
    | "metric_definition"
    | "team_experience"
  subject: string
  knowledgeKey: string
  claimText: string
  language: "zh" | "en" | "mixed" | "unknown"
  confidence: "high" | "medium" | "low" | "unknown"
  extractionMethod: "manual" | "ai_candidate" | "imported"
  reviewState: "pending" | "approved" | "rejected" | "stale" | "conflict" | "archived"
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export type TeamKnowledgeNoteView = {
  id: string
  noteType:
    | "selling_experience"
    | "talk_track"
    | "objection_reply"
    | "after_sales"
    | "pricing_guidance"
    | "workflow_note"
  knowledgeKey: string
  content: string
  sensitiveLevel: "internal" | "restricted" | "high"
  reviewState: "draft" | "reviewing" | "approved" | "rejected" | "stale" | "conflict" | "archived"
  sourceIds: string[]
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export type KnowledgeReviewQueueItem =
  | {
      targetType: "source"
      targetId: string
      label: string
      reviewState: KnowledgeSourceView["reviewState"]
      createdAt: string
      source: KnowledgeSourceView
    }
  | {
      targetType: "claim"
      targetId: string
      label: string
      reviewState: ExtractedKnowledgeClaimView["reviewState"]
      createdAt: string
      claim: ExtractedKnowledgeClaimView
    }
  | {
      targetType: "team_note"
      targetId: string
      label: string
      reviewState: TeamKnowledgeNoteView["reviewState"]
      createdAt: string
      teamNote: TeamKnowledgeNoteView
    }

export type KnowledgeSourceListBody =
  | ReferenceDataApiErrorBody
  | {
      ok: true
      sources: KnowledgeSourceView[]
    }

export type KnowledgeSourceCreateBody =
  | ReferenceDataApiErrorBody
  | {
      ok: true
      source: KnowledgeSourceView
    }

export type KnowledgeClaimCreateBody =
  | ReferenceDataApiErrorBody
  | {
      ok: true
      claim: ExtractedKnowledgeClaimView
    }

export type TeamKnowledgeNoteCreateBody =
  | ReferenceDataApiErrorBody
  | {
      ok: true
      teamNote: TeamKnowledgeNoteView
    }

export type KnowledgeReviewQueueBody =
  | ReferenceDataApiErrorBody
  | {
      ok: true
      items: KnowledgeReviewQueueItem[]
    }

export type KnowledgeReviewDecisionBody =
  | ReferenceDataApiErrorBody
  | {
      ok: true
      target: KnowledgeSourceView | ExtractedKnowledgeClaimView | TeamKnowledgeNoteView
    }

export type PublishedKnowledgeVersionView = {
  id: string
  knowledgeKey: string
  version: number
  status: "published" | "stale" | "archived" | "replaced"
  summary: string
  claimIds: string[]
  teamNoteIds: string[]
  sourceIds: string[]
  publishedAt: string
  expiresAt: string | null
  downstreamReadiness: Array<{
    workflow: "ai_review" | "talk_tracks" | "qa_agent" | "source_refresh"
    ready: boolean
    blockedBy: string[]
  }>
  createdAt: string
  updatedAt: string
}

export type KnowledgeVersionCreateBody =
  | ReferenceDataApiErrorBody
  | {
      ok: true
      version: PublishedKnowledgeVersionView
    }

export type RacketProductDraft = {
  brand: string
  series: string
  model: string
  aliases: string
  weightClasses: string
  balancePoint: string
  balanceType: RacketProductView["specs"]["balanceType"]
  shaftStiffness: string
  recommendedTension: string
  playerLevels: string
  playStyles: string
  priceBand: string
  sellingFocus: string
  limitations: string
  sourceIds: string
}

export type RacketProductSourceDraft = {
  productId: string
  sourceType: "official_site" | "brand_catalog" | "commerce_page" | "team_note" | "manual_review"
  title: string
  url: string
  retrievedAt: string
  trustLevel: "official" | "commerce" | "team" | "unknown"
  refreshPolicy: "manual" | "monthly" | "quarterly" | "on_demand"
}

export type RacketReviewDecisionDraft = {
  productId: string
  targetType: "product" | "source"
  targetId: string
  decision: "approve" | "reject" | "request_source" | "mark_conflict" | "archive"
  reason: string
}

export type RacketPublicationDraft = {
  productId: string
  changeReason: string
}

export type KnowledgeSourceDraft = {
  sourceType: KnowledgeSourceView["sourceType"]
  title: string
  owner: string
  url: string
  retrievedAt: string
  trustLevel: KnowledgeSourceView["trustLevel"]
  refreshCadence: KnowledgeSourceView["refreshCadence"]
  intendedUse: string
}

export type ManualKnowledgeClaimDraft = {
  sourceId: string
  claimType: ExtractedKnowledgeClaimView["claimType"]
  subject: string
  knowledgeKey: string
  claimText: string
  language: ExtractedKnowledgeClaimView["language"]
  confidence: ExtractedKnowledgeClaimView["confidence"]
}

export type TeamKnowledgeNoteDraft = {
  noteType: TeamKnowledgeNoteView["noteType"]
  knowledgeKey: string
  content: string
  sensitiveLevel: TeamKnowledgeNoteView["sensitiveLevel"]
  sourceIds: string
}

export type KnowledgeReviewDecisionDraft = {
  targetType: KnowledgeReviewQueueItem["targetType"]
  targetId: string
  decision: "approve" | "reject" | "request_source" | "mark_conflict" | "mark_stale" | "archive"
  reason: string
}

export type KnowledgePublicationDraft = {
  knowledgeKey: string
  claimIds: string
  teamNoteIds: string
  sourceIds: string
  summary: string
}

export const racketProductStatusLabels: Record<RacketProductStatus, string> = {
  draft: "草稿",
  needs_source: "缺来源",
  reviewing: "审核中",
  approved: "已审核",
  published: "已发布",
  stale: "需更新",
  conflict: "有冲突",
  archived: "已归档",
  rejected: "已拒绝",
}

export const racketBalanceTypeLabels: Record<
  RacketProductView["specs"]["balanceType"],
  string
> = {
  head_light: "头轻",
  even: "均衡",
  head_heavy: "头重",
  unknown: "待确认",
}

export const racketSourceTypeLabels: Record<
  RacketProductSourceView["sourceType"],
  string
> = {
  official_site: "品牌官网",
  brand_catalog: "品牌图册",
  commerce_page: "商品页",
  team_note: "团队记录",
  manual_review: "人工复核",
}

export const racketSourceTrustLevelLabels: Record<
  RacketProductSourceView["trustLevel"],
  string
> = {
  official: "官方",
  commerce: "电商",
  team: "团队",
  unknown: "待确认",
}

export const racketSourceRefreshPolicyLabels: Record<
  RacketProductSourceView["refreshPolicy"],
  string
> = {
  manual: "手动",
  monthly: "每月",
  quarterly: "每季",
  on_demand: "按需",
}

export const racketSourceReviewStateLabels: Record<
  RacketProductSourceView["reviewState"],
  string
> = {
  pending: "待审核",
  approved: "已审核",
  rejected: "已拒绝",
  stale: "需更新",
}

export const racketWorkflowLabels: Record<RacketDownstreamWorkflow, string> = {
  session_capture: "直播场次",
  ai_review: "智能复盘",
  talk_tracks: "话术资产",
  qa_agent: "问答助手",
}

export const racketBlockerLabels: Record<string, string> = {
  draft: "仍是草稿",
  needs_source: "缺可靠来源",
  reviewing: "待审核",
  not_published: "未发布",
  stale: "需更新",
  conflict: "有冲突",
  rejected: "已拒绝",
  archived: "已归档",
  missing_source: "缺来源",
}

export const knowledgeSourceTypeLabels: Record<
  KnowledgeSourceView["sourceType"],
  string
> = {
  official_brand: "品牌官方",
  official_platform: "平台官方",
  official_sport_rule: "运动规则",
  authorized_retailer: "授权零售",
  academic_research: "研究资料",
  team_note: "团队经验",
  web_discovery: "公开发现",
}

export const knowledgeTrustLevelLabels: Record<
  KnowledgeSourceView["trustLevel"],
  string
> = {
  official: "官方",
  authorized: "授权",
  research: "研究",
  team: "团队",
  unknown: "待确认",
}

export const knowledgeRefreshCadenceLabels: Record<
  KnowledgeSourceView["refreshCadence"],
  string
> = {
  manual: "手动",
  monthly: "每月",
  quarterly: "每季",
  on_demand: "按需",
}

export const knowledgeReviewStateLabels: Record<string, string> = {
  registered: "已登记",
  extracting: "抽取中",
  draft: "草稿",
  pending: "待审核",
  reviewing: "审核中",
  approved: "已审核",
  rejected: "已拒绝",
  stale: "需更新",
  conflict: "有冲突",
  archived: "已归档",
}

export const knowledgeWorkflowLabels: Record<
  "ai_review" | "talk_tracks" | "qa_agent" | "source_refresh",
  string
> = {
  ai_review: "智能复盘",
  talk_tracks: "话术资产",
  qa_agent: "问答助手",
  source_refresh: "来源刷新",
}

export const knowledgeBlockerLabels: Record<string, string> = {
  source_registered: "来源待审核",
  source_extracting: "待抽取",
  source_reviewing: "审核中",
  not_published: "未发布",
  source_rejected: "来源已拒绝",
  source_stale: "来源需更新",
  source_conflict: "来源有冲突",
  source_archived: "来源已归档",
  missing_reviewed_content: "缺已审核内容",
  expired: "已过期",
  stale: "需更新",
  archived: "已归档",
}

export const knowledgeClaimTypeLabels: Record<
  ExtractedKnowledgeClaimView["claimType"],
  string
> = {
  racket_spec: "球拍规格",
  platform_rule: "平台规则",
  sales_guidance: "销售建议",
  customer_question: "客户问题",
  objection_reply: "异议回应",
  metric_definition: "指标定义",
  team_experience: "团队经验",
}

export const teamNoteTypeLabels: Record<TeamKnowledgeNoteView["noteType"], string> = {
  selling_experience: "讲解经验",
  talk_track: "话术",
  objection_reply: "异议回应",
  after_sales: "售后",
  pricing_guidance: "价格口径",
  workflow_note: "流程备注",
}

export const reviewDecisionLabels: Record<
  KnowledgeReviewDecisionDraft["decision"],
  string
> = {
  approve: "通过",
  reject: "拒绝",
  request_source: "补来源",
  mark_conflict: "标冲突",
  mark_stale: "标过期",
  archive: "归档",
}

export function defaultOperatorV0Scope(): OperatorV0Scope {
  return {
    tenantId: operatorV0TenantId,
    teamId: operatorV0TeamId,
    tenantName: "V0 内部演示租户",
    teamName: "直播运营 V0 小组",
    actorName: "V0 运营",
  }
}

export function readStoredReferenceDataScope(): OperatorV0Scope {
  if (typeof window === "undefined") {
    return defaultOperatorV0Scope()
  }

  const stored = window.localStorage.getItem(referenceDataScopeStorageKey)

  if (!stored) {
    return defaultOperatorV0Scope()
  }

  try {
    const parsed = JSON.parse(stored) as Partial<OperatorV0Scope>

    if (parsed.tenantId && parsed.teamId) {
      return {
        ...defaultOperatorV0Scope(),
        ...parsed,
      }
    }
  } catch {
    window.localStorage.removeItem(referenceDataScopeStorageKey)
  }

  return defaultOperatorV0Scope()
}

export function storeReferenceDataScope(scope: OperatorV0Scope) {
  window.localStorage.setItem(referenceDataScopeStorageKey, JSON.stringify(scope))
}

export function scopedApi(path: string, scope: OperatorV0Scope): string {
  const separator = path.includes("?") ? "&" : "?"

  return `${path}${separator}tenantId=${encodeURIComponent(scope.tenantId)}&teamId=${encodeURIComponent(scope.teamId)}`
}

export async function readApiBody<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}

export function bootstrapBodyToScope(
  body: Extract<BootstrapBody, { ok: true }>,
): OperatorV0Scope {
  return {
    tenantId: body.tenant.id,
    teamId: body.team.id,
    tenantName: body.tenant.name,
    teamName: body.team.name,
    actorName: body.actor.displayName,
  }
}

export function authSessionBodyToScope(
  body: Extract<AuthSessionBody, { authenticated: true }>,
): OperatorV0Scope {
  return {
    tenantId: body.tenant.id,
    teamId: body.team.id,
    tenantName: body.tenant.name,
    teamName: body.team.name,
    actorName: body.actor.displayName,
  }
}

export function createJsonMutationInit(input: {
  csrfHeaderName: string
  csrfHeaderValue: string
  body: unknown
}): RequestInit {
  return {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      [input.csrfHeaderName]: input.csrfHeaderValue,
    },
    body: JSON.stringify(input.body),
  }
}

export function createDefaultRacketProductDraft(): RacketProductDraft {
  return {
    brand: "Yonex",
    series: "Astrox",
    model: "Astrox 100 ZZ",
    aliases: "天斧100ZZ, AX100ZZ",
    weightClasses: "4U, 3U",
    balancePoint: "",
    balanceType: "head_heavy",
    shaftStiffness: "extra stiff",
    recommendedTension: "20-28 lb",
    playerLevels: "advanced",
    playStyles: "rear-court attack",
    priceBand: "premium",
    sellingFocus: "后场进攻, 连贯压制, 推荐给有发力基础的球友",
    limitations: "新手上手门槛较高",
    sourceIds: "",
  }
}

export function createDefaultRacketProductSourceDraft(): RacketProductSourceDraft {
  return {
    productId: "",
    sourceType: "official_site",
    title: "品牌官方规格页",
    url: "",
    retrievedAt: currentDatetimeLocal(),
    trustLevel: "official",
    refreshPolicy: "monthly",
  }
}

export function createDefaultRacketReviewDecisionDraft(
  productId = "",
  targetId = "",
  targetType: RacketReviewDecisionDraft["targetType"] = "source",
): RacketReviewDecisionDraft {
  return {
    productId,
    targetType,
    targetId,
    decision: "approve",
    reason: "来源和产品信息已核对。",
  }
}

export function createDefaultRacketPublicationDraft(
  productId = "",
): RacketPublicationDraft {
  return {
    productId,
    changeReason: "已核对来源和审核结论，可用于下游工作流。",
  }
}

export function createRacketProductPayload(draft: RacketProductDraft) {
  return {
    brand: draft.brand.trim(),
    series: draft.series.trim(),
    model: draft.model.trim(),
    aliases: splitList(draft.aliases).map((alias) => ({
      alias,
      aliasType: "team_note" as const,
      confidence: "medium" as const,
    })),
    specs: {
      weightClasses: splitList(draft.weightClasses),
      balancePoint: draft.balancePoint.trim(),
      balanceType: draft.balanceType,
      shaftStiffness: draft.shaftStiffness.trim(),
      recommendedTension: draft.recommendedTension.trim(),
    },
    positioning: {
      playerLevels: splitList(draft.playerLevels),
      playStyles: splitList(draft.playStyles),
      priceBand: draft.priceBand.trim(),
      sellingFocus: splitList(draft.sellingFocus),
      limitations: splitList(draft.limitations),
    },
    sourceIds: splitList(draft.sourceIds),
  }
}

export function createRacketProductSourceMetadataPayload(
  draft: RacketProductSourceDraft,
) {
  return {
    productId: draft.productId.trim(),
    sourceType: draft.sourceType,
    title: draft.title.trim(),
    url: draft.url.trim(),
    retrievedAt: toIsoDateTime(draft.retrievedAt),
    trustLevel: draft.trustLevel,
    refreshPolicy: draft.refreshPolicy,
  }
}

export function createRacketReviewDecisionPayload(
  draft: RacketReviewDecisionDraft,
) {
  return {
    productId: draft.productId.trim(),
    targetType: draft.targetType,
    targetId: draft.targetId.trim(),
    decision: draft.decision,
    reason: draft.reason.trim(),
  }
}

export function createRacketPublicationPayload(draft: RacketPublicationDraft) {
  return {
    changeReason: draft.changeReason.trim(),
  }
}

export function isRacketProductDraftReady(draft: RacketProductDraft): boolean {
  return Boolean(draft.brand.trim() && draft.model.trim())
}

export function isRacketSourceDraftReady(draft: RacketProductSourceDraft): boolean {
  return Boolean(draft.productId.trim() && draft.title.trim())
}

export function isRacketReviewDecisionReady(
  draft: RacketReviewDecisionDraft,
): boolean {
  return Boolean(
    draft.productId.trim() &&
      draft.targetType &&
      draft.targetId.trim() &&
      draft.reason.trim(),
  )
}

export function createDefaultKnowledgeSourceDraft(): KnowledgeSourceDraft {
  return {
    sourceType: "official_brand",
    title: "ASTROX 100ZZ product page",
    owner: "Yonex",
    url: "https://www.yonex.com/badminton/rackets/astrox-100zz",
    retrievedAt: currentDatetimeLocal(),
    trustLevel: "official",
    refreshCadence: "monthly",
    intendedUse: "racket_spec, talk_track, ai_review",
  }
}

export function createKnowledgeSourcePayload(draft: KnowledgeSourceDraft) {
  return {
    sourceType: draft.sourceType,
    title: draft.title.trim(),
    owner: draft.owner.trim(),
    url: draft.url.trim(),
    retrievedAt: toIsoDateTime(draft.retrievedAt),
    trustLevel: draft.trustLevel,
    refreshCadence: draft.refreshCadence,
    intendedUse: splitList(draft.intendedUse),
  }
}

export function isKnowledgeSourceDraftReady(draft: KnowledgeSourceDraft): boolean {
  return Boolean(draft.title.trim() && draft.owner.trim())
}

export function createDefaultManualClaimDraft(
  sourceId = "",
): ManualKnowledgeClaimDraft {
  return {
    sourceId,
    claimType: "racket_spec",
    subject: "Astrox 100 ZZ",
    knowledgeKey: "racket:astrox-100zz:positioning",
    claimText: "ASTROX 100ZZ 适合有发力基础的进攻型球友。",
    language: "zh",
    confidence: "medium",
  }
}

export function createManualClaimPayload(draft: ManualKnowledgeClaimDraft) {
  return {
    sourceId: draft.sourceId.trim(),
    claimType: draft.claimType,
    subject: draft.subject.trim(),
    knowledgeKey: draft.knowledgeKey.trim(),
    claimText: draft.claimText.trim(),
    language: draft.language,
    confidence: draft.confidence,
    extractionMethod: "manual" as const,
  }
}

export function createDefaultTeamNoteDraft(sourceId = ""): TeamKnowledgeNoteDraft {
  return {
    noteType: "selling_experience",
    knowledgeKey: "racket:astrox-100zz:live-selling",
    content: "直播讲解时先说明发力门槛，再给适合人群和替代型号。",
    sensitiveLevel: "internal",
    sourceIds: sourceId,
  }
}

export function createTeamNotePayload(draft: TeamKnowledgeNoteDraft) {
  return {
    noteType: draft.noteType,
    knowledgeKey: draft.knowledgeKey.trim(),
    content: draft.content.trim(),
    sensitiveLevel: draft.sensitiveLevel,
    sourceIds: splitList(draft.sourceIds),
  }
}

export function createDefaultReviewDecisionDraft(
  item?: KnowledgeReviewQueueItem | null,
): KnowledgeReviewDecisionDraft {
  return {
    targetType: item?.targetType ?? "source",
    targetId: item?.targetId ?? "",
    decision: "approve",
    reason: "来源和团队口径已核对。",
  }
}

export function createKnowledgeReviewDecisionPayload(
  draft: KnowledgeReviewDecisionDraft,
) {
  return {
    targetType: draft.targetType,
    targetId: draft.targetId.trim(),
    decision: draft.decision,
    reason: draft.reason.trim(),
  }
}

export function createDefaultPublicationDraft(
  sourceId = "",
  claimId = "",
  teamNoteId = "",
): KnowledgePublicationDraft {
  return {
    knowledgeKey: "racket:astrox-100zz:live-selling",
    claimIds: claimId,
    teamNoteIds: teamNoteId,
    sourceIds: sourceId,
    summary: "已审核来源和团队经验，可作为后续复盘和话术参考。",
  }
}

export function createKnowledgePublicationPayload(draft: KnowledgePublicationDraft) {
  return {
    knowledgeKey: draft.knowledgeKey.trim(),
    claimIds: splitList(draft.claimIds),
    teamNoteIds: splitList(draft.teamNoteIds),
    sourceIds: splitList(draft.sourceIds),
    summary: draft.summary.trim(),
  }
}

export function userMessageFromReferenceDataError(
  error: ReferenceDataApiErrorBody,
): string {
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
    case "FORBIDDEN_PERMISSION":
      return "当前账号缺少权限"
    case "VALIDATION_ERROR":
      return "请检查填写内容"
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return "内容过长，请拆分后再保存"
    case "DUPLICATE_MODEL":
      return "该球拍型号已存在"
    case "ALIAS_CONFLICT":
      return "该别名已关联到其他型号"
    case "DUPLICATE_SOURCE":
      return "该来源已登记"
    case "SOURCE_CONFLICT":
      return "该来源已关联"
    case "MISSING_SOURCE":
      return "请先补充来源"
    case "CONFLICTING_CLAIM":
      return "该知识存在冲突，请先处理"
    case "SENSITIVE_DATA_NEEDS_REVIEW":
      return "内容需要先脱敏或复核"
    case "STATE_TRANSITION_INVALID":
      return "当前状态暂不能执行该操作"
    case "NOT_FOUND":
      return "未找到对应记录"
    case "OPERATOR_V0_BOOTSTRAP_DISABLED":
      return "当前环境未开启 V0 入口"
    default:
      return "操作暂时失败，请稍后重试"
  }
}

export function safeStatusLabel(
  labels: Record<string, string>,
  value: string | null | undefined,
  fallback = "待确认",
): string {
  if (!value) {
    return fallback
  }

  return labels[value] ?? fallback
}

export function blockerText(
  blockers: string[],
  labels: Record<string, string>,
): string {
  if (blockers.length === 0) {
    return "可使用"
  }

  return blockers.map((blocker) => labels[blocker] ?? "待处理").join("、")
}

export function formatReferenceDate(value: string | null): string {
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

function splitList(value: string): string[] {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function currentDatetimeLocal(): string {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())

  return now.toISOString().slice(0, 16)
}

function toIsoDateTime(value: string): string {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString()
  }

  return parsed.toISOString()
}
