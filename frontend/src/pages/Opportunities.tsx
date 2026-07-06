import { useMemo, useState, type ReactNode } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Archive,
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  GitCompare,
  PencilLine,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  SearchCheck,
  Server,
  SlidersHorizontal,
  Tags,
  Target,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ManualReadingForm } from '@/components/products/ManualReadingForm';
import {
  useArchiveOpportunityResearch,
  useClearOpportunityResearchActionOutcome,
  useClearOpportunityResearchDecision,
  useCompareOpportunityResearch,
  useExportOpportunityResearch,
  useOpportunities,
  useOpportunityDailyActionPlan,
  useOpportunityPracticeSummary,
  useProductOpportunity,
  useOpportunityResearchSummary,
  useSaveOpportunityResearchActionOutcome,
  useSaveOpportunityResearchDecision,
  useUpsertOpportunityResearch,
} from '@/hooks/useOpportunities';
import {
  useProducts,
  useCheckProductNow,
  useRefreshProductMarketSignals,
} from '@/hooks/useProducts';
import { useCreateSnapshot } from '@/hooks/usePriceStats';
import type {
  AcquisitionProductJobDiagnostics,
  BusinessReadiness,
  OpportunityMarketSignalSummary,
  OpportunityRecommendation,
  OpportunityResearchDecisionReview,
  OpportunityResearchDecisionReviewFilter,
  OpportunityResearchDecisionStatus,
  OpportunityResearchDailyActionId,
  OpportunityResearchDailyActionItem,
  OpportunityResearchDailyActionPlan,
  OpportunityResearchActionOutcomeFilter,
  OpportunityResearchPracticeSummary,
  OpportunityResearchReviewSummary,
  OpportunityResearchPriority,
  OpportunityResearchStatus,
  ProductOpportunity,
} from '@/types';
import { scraperApi, type OpportunityFilters } from '@/services/api';
import { cn } from '@/lib/utils';

// Keep these in sync with shared/schemas/opportunityResearch.schema.ts.
const OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH = 1200;
const OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH = 400;
const OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH = 600;

const recommendationLabels: Record<OpportunityRecommendation, string> = {
  investigate: '重点研究',
  watch: '持续观察',
  check_data: '补充数据',
  ignore: '暂不处理',
};

const recommendationVariants: Record<
  OpportunityRecommendation,
  'success' | 'info' | 'warning' | 'neutral'
> = {
  investigate: 'success',
  watch: 'info',
  check_data: 'warning',
  ignore: 'neutral',
};

const researchStatusLabels: Record<OpportunityResearchStatus, string> = {
  researching: '调研中',
  watching: '观察',
  ready: '准备推进',
  rejected: '已排除',
};

const researchPriorityLabels: Record<OpportunityResearchPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

const decisionLabels: Record<OpportunityResearchDecisionStatus, string> = {
  go: '推进',
  hold: '暂缓',
  no_go: '排除',
};

const decisionEvidenceFrames: Record<OpportunityResearchDecisionStatus, string> = {
  go: '推进判断：\n关键证据：\n主要风险：\n确认缺口：',
  hold: '暂缓判断：\n支持证据：\n待验证缺口：\n复盘条件：',
  no_go: '排除判断：\n排除证据：\n关键风险：\n后续处理：',
};

const dailyActionLabels: Record<OpportunityResearchDailyActionId, string> = {
  add_next_action: '补齐下一步行动',
  review_stale_decisions: '复盘过期决策',
  decide_candidates: '判断未决策候选',
  continue_research: '继续调研中候选',
};

const dailyActionCompletionCriteria: Record<
  OpportunityResearchDailyActionId,
  string[]
> = {
  add_next_action: [
    '每个 go/hold 决策都有下一步行动。',
    '下一步不依赖系统自动推断。',
  ],
  review_stale_decisions: [
    '每个 stale 决策都被重新确认或调整。',
    '复盘后的下一步仍然具体可执行。',
  ],
  decide_candidates: [
    '候选已记录当前决策。',
    '决策依据说明了关键证据或缺口。',
  ],
  continue_research: [
    '至少补充一项缺失证据或备注。',
    '研究状态反映当前处理阶段。',
  ],
};

const dailyActionOutcomePrompts: Record<OpportunityResearchDailyActionId, string> = {
  add_next_action: '记录你补上的下一步：对象、动作、证据或时间线。',
  review_stale_decisions:
    '记录你复盘了哪些证据，以及保留、调整或清除的判断。',
  decide_candidates:
    '记录最终 go/hold/no-go 判断，以及支撑它的关键证据或缺口。',
  continue_research:
    '记录本次补充的读数、成本假设、备注或仍缺的证据。',
};

const dailyActionOutcomeExamples: Record<OpportunityResearchDailyActionId, string> = {
  add_next_action: '例：供应商报价待确认，明天补 MOQ 和运费截图。',
  review_stale_decisions: '例：复查 BSR 和毛利后维持 hold，下一步补竞品评论缺口。',
  decide_candidates: '例：因评论数不足且利润缓冲偏低，当前排除并记录缺口。',
  continue_research: '例：补录 7 月 5 日手动读数，仍缺近期销量代理信号。',
};

const dailyActionOutcomeFrames: Record<OpportunityResearchDailyActionId, string> = {
  add_next_action:
    '补齐对象：\n下一步动作：\n所需证据：\n预计时间：',
  review_stale_decisions:
    '复盘对象：\n复查证据：\n保留或调整：\n下一步：',
  decide_candidates:
    '当前判断：\n关键证据：\n主要缺口：\n下一步：',
  continue_research:
    '本次补充：\n证据来源：\n当前判断：\n仍缺信息：\n下一步：',
};

const actionOutcomeLabels: Record<OpportunityResearchActionOutcomeFilter, string> = {
  with: '已记录行动结果',
  without: '未记录行动结果',
};

const actionContextSourceLabels: Record<ActiveActionContext['source'], string> = {
  daily_action: '来自每日行动',
  practice_bucket: '来自练习分桶',
};

const businessCompletenessLabels: Record<string, string> = {
  none: '未填写',
  partial: '部分',
  complete: '完整',
};

const marketSignalStatusLabels: Record<string, string> = {
  fresh: '新鲜',
  stale: '过期',
  missing: '缺失',
  failed: '失败',
};

const opportunitySignalLabels: Record<string, string> = {
  costBasis: '单件成本',
  inboundShipping: '头程运费',
  outboundShipping: '出库运费',
  fulfillmentFee: '履约费',
  platformFee: '平台固定费',
  referralFeeRate: '佣金比例',
  advertisingCost: '广告成本',
  taxCustomsBuffer: '税费/关税缓冲',
  sellPrice: '目标售价',
  targetSellPrice: '目标售价',
  targetUnits: '目标销量',
  shipping: '运费',
  fees: '费用',
  price_history: '价格历史',
  price_trend: '价格趋势',
  volatility: '价格波动',
  acquisition_history: '采集历史',
  low_confidence: '低置信度',
  review_proxy: '评分/评论代理',
  profit_margin: '利润率',
  market_history: '市场历史',
  market_trend: '市场趋势',
  market_signal_freshness: '市场信号新鲜度',
  market_sales_rank: '销售排名',
  sales_volume: '销量',
  demand: '需求',
};

function opportunitySignalLabel(signal: string): string {
  const businessKey = signal.startsWith('business_')
    ? signal.slice('business_'.length)
    : signal;

  return opportunitySignalLabels[signal] ?? opportunitySignalLabels[businessKey] ?? signal;
}

const opportunityDiagnosticSignalTokens = [
  ...Object.keys(opportunitySignalLabels),
  ...Object.keys(opportunitySignalLabels).map((signal) => `business_${signal}`),
]
  .filter((signal) => signal.includes('_') || /[A-Z]/.test(signal))
  .sort((a, b) => b.length - a.length);

function opportunitySignalListText(signals: string[], limit: number): string {
  return signals
    .filter((signal) => signal.trim())
    .slice(0, limit)
    .map(opportunitySignalLabel)
    .join('、');
}

function businessCompletenessLabel(value: string, prefixed = false): string {
  const label = businessCompletenessLabels[value] ?? value;
  return prefixed ? `业务${label}` : label;
}

function marketStatusLabel(value: string, prefixed = false): string {
  const label = marketSignalStatusLabels[value] ?? value;
  return prefixed ? `市场${label}` : label;
}

function localizeOpportunityDiagnosticText(text: string): string {
  const withReadableMissingSignals = text.replace(
    /Missing signals:\s*([^.]+)\./g,
    (_match, signals: string) => {
      const labels = signals
        .split(',')
        .map((signal) => signal.trim())
        .filter(Boolean)
        .map(opportunitySignalLabel);

      return `缺失信号：${labels.join('、')}。`;
    },
  );

  return opportunityDiagnosticSignalTokens.reduce(
    (localized, signal) => localized.split(signal).join(opportunitySignalLabel(signal)),
    withReadableMissingSignals,
  );
}

function EvidenceTextLengthGuidance({
  value,
  max,
  ariaLabel,
}: {
  value: string;
  max: number;
  ariaLabel: string;
}) {
  const length = value.trim().length;
  const overBy = Math.max(0, length - max);

  return (
    <span
      aria-label={ariaLabel}
      aria-live="polite"
      className={cn(
        'text-[11px] font-normal',
        overBy > 0 ? 'text-error' : 'text-fg-muted',
      )}
    >
      {overBy > 0
        ? `已输入 ${length}/${max} 字，超出 ${overBy} 字`
        : `已输入 ${length}/${max} 字`}
    </span>
  );
}

const dailyActionIds = Object.keys(
  dailyActionLabels,
) as OpportunityResearchDailyActionId[];

const decisionReviewLabels: Record<OpportunityResearchDecisionReviewFilter, string> = {
  all: '全部',
  decided: '已决策',
  undecided: '未决策',
  needs_action: '缺下一步',
  stale: '需复盘',
};

type WorkspaceMode = 'discover' | 'review';

const compareLimit = 6;
export type AcquisitionOperationalFilter = 'all' | 'delayed' | 'retryable';
export type AcquisitionOperationalStateKind =
  | 'healthy'
  | 'delayed'
  | 'retryable'
  | 'running'
  | 'no_history'
  | 'unknown';

export interface AcquisitionOperationalState {
  kind: AcquisitionOperationalStateKind;
  label: string;
  detail: string;
  retryable: boolean;
  delayed: boolean;
  caveat?: string;
}

interface ActiveActionContext {
  actionId: OpportunityResearchDailyActionId;
  source: 'daily_action' | 'practice_bucket';
}

type ReviewSummaryFilterTarget = Extract<
  OpportunityResearchDecisionReviewFilter,
  'all' | 'undecided' | 'needs_action' | 'stale'
>;
type PracticeSummaryFilterTarget =
  | { kind: 'actionOutcome'; value: OpportunityResearchActionOutcomeFilter }
  | { kind: 'actionId'; value: OpportunityResearchDailyActionId };

export function Opportunities() {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('discover');
  const [recommendation, setRecommendation] = useState('');
  const [platform, setPlatform] = useState('');
  const [minScore, setMinScore] = useState('');
  const [businessReadiness, setBusinessReadiness] = useState<BusinessReadiness>('any');
  const [minRoi, setMinRoi] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedId, setSelectedId] = useState<string>();
  const [shortlistedOnly, setShortlistedOnly] = useState(false);
  const [operationalFilter, setOperationalFilter] =
    useState<AcquisitionOperationalFilter>('all');
  const [researchStatus, setResearchStatus] = useState('');
  const [researchTag, setResearchTag] = useState('');
  const [decisionStatus, setDecisionStatus] = useState('');
  const [decisionReview, setDecisionReview] =
    useState<OpportunityResearchDecisionReviewFilter>('needs_action');
  const [actionOutcome, setActionOutcome] =
    useState<OpportunityResearchActionOutcomeFilter | ''>('');
  const [actionId, setActionId] =
    useState<OpportunityResearchDailyActionId | ''>('');
  const [activeActionContext, setActiveActionContext] =
    useState<ActiveActionContext | null>(null);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [exportMessage, setExportMessage] = useState('');
  const [readingProduct, setReadingProduct] = useState<ProductOpportunity['product'] | null>(null);

  const filters: OpportunityFilters = useMemo(
    () => ({
      recommendation: recommendation
        ? recommendation as OpportunityRecommendation
        : undefined,
      platform: platform ? platform as OpportunityFilters['platform'] : undefined,
      minScore: minScore ? Number(minScore) : undefined,
      businessReadiness,
      minRoi: minRoi ? Number(minRoi) / 100 : undefined,
      shortlisted: shortlistedOnly ? true : undefined,
      researchStatus: researchStatus
        ? researchStatus as OpportunityResearchStatus
        : undefined,
      researchTag: researchTag ? researchTag : undefined,
      decisionStatus:
        workspaceMode === 'review' && decisionStatus
          ? decisionStatus as OpportunityResearchDecisionStatus
          : undefined,
      decisionReview:
        workspaceMode === 'review' ? decisionReview : undefined,
      actionOutcome: actionOutcome || undefined,
      actionId: actionId || undefined,
      sortBy: 'score',
      sortOrder,
      limit: 30,
    }),
    [
      businessReadiness,
      decisionReview,
      decisionStatus,
      actionId,
      actionOutcome,
      minRoi,
      minScore,
      platform,
      recommendation,
      researchStatus,
      researchTag,
      shortlistedOnly,
      sortOrder,
      workspaceMode,
    ]
  );

  const opportunitiesQuery = useOpportunities(filters);
  const productsQuery = useProducts();
  const reviewSummaryQuery = useOpportunityResearchSummary();
  const practiceSummaryQuery = useOpportunityPracticeSummary();
  const dailyActionPlanQuery = useOpportunityDailyActionPlan();
  const opportunities = opportunitiesQuery.data?.data ?? [];
  const hasProducts = (productsQuery.data?.length ?? 0) > 0;
  const productsLoaded = !productsQuery.isLoading;
  const diagnosticsQueries = useQueries({
    queries: opportunities.map((opportunity) => ({
      queryKey: ['productJobDiagnostics', opportunity.product.id],
      queryFn: () => scraperApi.productJobDiagnostics(opportunity.product.id),
      staleTime: 30_000,
    })),
  });
  const operationsByProductId = new Map(
    opportunities.map((opportunity, index) => [
      opportunity.product.id,
      deriveAcquisitionOperationalState(diagnosticsQueries[index]?.data),
    ]),
  );
  const visibleOpportunities = opportunities.filter((opportunity) =>
    matchesAcquisitionOperationalFilter(
      operationsByProductId.get(opportunity.product.id),
      operationalFilter,
    ),
  );
  const selectedFromList = visibleOpportunities.find(
    (item) => item.product.id === selectedId
  );
  const explanationQuery = useProductOpportunity(selectedId);
  const selected = explanationQuery.data ?? selectedFromList;
  const selectedOperations = selected
    ? operationsByProductId.get(selected.product.id)
    : undefined;
  const checkProductNow = useCheckProductNow();
  const refreshMarketSignals = useRefreshProductMarketSignals();
  const createSnapshot = useCreateSnapshot(readingProduct?.id ?? '');
  const upsertResearch = useUpsertOpportunityResearch();
  const archiveResearch = useArchiveOpportunityResearch();
  const saveDecision = useSaveOpportunityResearchDecision();
  const clearDecision = useClearOpportunityResearchDecision();
  const saveActionOutcome = useSaveOpportunityResearchActionOutcome();
  const clearActionOutcome = useClearOpportunityResearchActionOutcome();
  const compareResearch = useCompareOpportunityResearch();
  const exportResearch = useExportOpportunityResearch();

  // 使用 useMemo 派生状态，避免在 effect 中调用 setState
  const validSelectedId = useMemo(() => {
    if (!visibleOpportunities.length) {
      return undefined;
    }

    if (!selectedId || !visibleOpportunities.some((item) => item.product.id === selectedId)) {
      return visibleOpportunities[0].product.id;
    }

    return selectedId;
  }, [visibleOpportunities, selectedId]);

  // 在渲染阶段同步状态，而不是在 effect 中
  if (validSelectedId !== selectedId) {
    setSelectedId(validSelectedId);
  }

  const handleCheckNow = () => {
    if (selected?.product.id) {
      checkProductNow.mutate(selected.product.id);
    }
  };

  const handleRefreshMarketSignals = () => {
    if (selected?.product.id) {
      refreshMarketSignals.mutate(selected.product.id);
    }
  };

  const handleToggleComparison = (productId: string) => {
    setComparisonIds((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }
      if (current.length >= compareLimit) return current;
      return [...current, productId];
    });
  };

  const handleAddResearch = (productId: string) => {
    upsertResearch.mutate({
      productId,
      data: {
        status: 'researching',
        priority: 'medium',
        tags: [],
        notes: null,
        archived: false,
      },
    });
  };

  const handleSaveResearch = (
    productId: string,
    data: {
      status: OpportunityResearchStatus;
      priority: OpportunityResearchPriority;
      tags: string[];
      notes: string | null;
    },
  ) => {
    upsertResearch.mutate({
      productId,
      data: { ...data, archived: false },
    });
  };

  const handleSaveDecision = (
    productId: string,
    data: {
      status: OpportunityResearchDecisionStatus;
      reason: string;
      nextAction: string | null;
    },
  ) => {
    saveDecision.mutate({ productId, data });
  };

  const handleClearDecision = (productId: string) => {
    clearDecision.mutate(productId);
  };

  const handleSaveActionOutcome = (
    productId: string,
    data: {
      actionId: OpportunityResearchDailyActionId;
      outcome: string;
      completedAt: number;
    },
  ) => {
    saveActionOutcome.mutate({ productId, data });
  };

  const handleClearActionOutcome = (productId: string) => {
    clearActionOutcome.mutate(productId);
  };

  const clearTransientActionContext = () => {
    setActiveActionContext(null);
  };

  const handleApplyDailyAction = (item: OpportunityResearchDailyActionItem) => {
    const { filters: actionFilters } = item;
    setWorkspaceMode(actionFilters.workspaceMode);
    setShortlistedOnly(actionFilters.shortlisted ?? false);
    setDecisionStatus(actionFilters.decisionStatus ?? '');
    setDecisionReview(actionFilters.decisionReview ?? 'all');
    setResearchStatus(actionFilters.researchStatus ?? '');
    setResearchTag('');
    setActionOutcome('');
    setActionId('');
    setActiveActionContext({ actionId: item.id, source: 'daily_action' });
  };

  const handleApplyPracticeFilter = (filter: {
    actionOutcome?: OpportunityResearchActionOutcomeFilter;
    actionId?: OpportunityResearchDailyActionId;
  }) => {
    setWorkspaceMode('discover');
    setDecisionStatus('');
    setDecisionReview('all');
    setResearchStatus('');
    setResearchTag('');
    setActionOutcome(filter.actionOutcome ?? '');
    setActionId(filter.actionId ?? '');
    setActiveActionContext(
      filter.actionId
        ? { actionId: filter.actionId, source: 'practice_bucket' }
        : null,
    );
  };

  const handleApplyReviewSummaryFilter = (filter: ReviewSummaryFilterTarget) => {
    setWorkspaceMode('review');
    setShortlistedOnly(true);
    setDecisionStatus('');
    setDecisionReview(filter);
    setResearchStatus('');
    setResearchTag('');
    setActionOutcome('');
    setActionId('');
    setActiveActionContext(null);
  };

  const handleClearPracticeFilter = () => {
    setActionOutcome('');
    setActionId('');
    setActiveActionContext((current) =>
      current?.source === 'practice_bucket' ? null : current,
    );
  };

  const handleCompare = () => {
    if (comparisonIds.length > 0 && comparisonIds.length <= compareLimit) {
      compareResearch.mutate({ productIds: comparisonIds });
    }
  };

  const hasDecisionReviewFilter = workspaceMode === 'review';
  const hasPracticeFilter = Boolean(actionOutcome || actionId);
  const hasPurePracticeSummaryFilter =
    workspaceMode === 'discover' &&
    !shortlistedOnly &&
    !recommendation &&
    !platform &&
    !minScore &&
    businessReadiness === 'any' &&
    !minRoi &&
    operationalFilter === 'all' &&
    !researchStatus &&
    !researchTag &&
    !decisionStatus &&
    decisionReview === 'all' &&
    Boolean(actionOutcome || actionId) &&
    !(actionOutcome && actionId);
  const activePracticeSummaryFilter: PracticeSummaryFilterTarget | null =
    hasPurePracticeSummaryFilter && actionOutcome
      ? { kind: 'actionOutcome', value: actionOutcome }
      : hasPurePracticeSummaryFilter && actionId
        ? { kind: 'actionId', value: actionId }
        : null;
  const hasPureReviewSummaryFilter =
    workspaceMode === 'review' &&
    shortlistedOnly &&
    !recommendation &&
    !platform &&
    !minScore &&
    businessReadiness === 'any' &&
    !minRoi &&
    operationalFilter === 'all' &&
    !researchStatus &&
    !researchTag &&
    !decisionStatus &&
    !hasPracticeFilter;
  const activeReviewSummaryFilter: ReviewSummaryFilterTarget | null =
    hasPureReviewSummaryFilter &&
    (decisionReview === 'all' ||
      decisionReview === 'undecided' ||
      decisionReview === 'needs_action' ||
      decisionReview === 'stale')
      ? decisionReview
      : null;
  const hasPureDailyActionFilter =
    activeActionContext?.source === 'daily_action' &&
    !recommendation &&
    !platform &&
    !minScore &&
    businessReadiness === 'any' &&
    !minRoi &&
    operationalFilter === 'all' &&
    !researchTag &&
    !hasPracticeFilter;
  const activeDailyActionId =
    hasPureDailyActionFilter
      ? dailyActionPlanQuery.data?.items.find((item) => {
          const actionFilters = item.filters;

          return (
            activeActionContext.actionId === item.id &&
            workspaceMode === actionFilters.workspaceMode &&
            shortlistedOnly === Boolean(actionFilters.shortlisted) &&
            decisionStatus === (actionFilters.decisionStatus ?? '') &&
            decisionReview === (actionFilters.decisionReview ?? 'all') &&
            researchStatus === (actionFilters.researchStatus ?? '')
          );
        })?.id ?? null
      : null;
  const hasExportFilter =
    shortlistedOnly ||
    Boolean(researchStatus || researchTag) ||
    hasDecisionReviewFilter ||
    hasPracticeFilter;
  const exportDisabled = comparisonIds.length === 0 && !hasExportFilter;

  const handleExport = () => {
    if (exportDisabled) return;
    setExportMessage('');
    exportResearch.mutate(
      comparisonIds.length > 0
        ? { format: 'csv', productIds: comparisonIds, limit: 100 }
        : {
            format: 'csv',
            filters: {
              shortlisted: shortlistedOnly || undefined,
              researchStatus: researchStatus
                ? researchStatus as OpportunityResearchStatus
                : undefined,
              researchTag: researchTag || undefined,
              decisionStatus:
                hasDecisionReviewFilter && decisionStatus
                  ? decisionStatus as OpportunityResearchDecisionStatus
                  : undefined,
              decisionReview: hasDecisionReviewFilter
                ? decisionReview
                : undefined,
              actionOutcome: actionOutcome || undefined,
              actionId: actionId || undefined,
            },
            limit: 100,
          },
      {
        onSuccess: (result) => {
          if (result.csv && typeof URL.createObjectURL === 'function') {
            const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = result.filename;
            anchor.click();
            URL.revokeObjectURL(url);
          }
          setExportMessage(`已生成 ${result.rows.length} 行 ${result.format.toUpperCase()} 导出`);
        },
      },
    );
  };

  return (
    <div className="flex min-h-full flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary-600">
            <Target className="h-4 w-4" />
            选品机会评分
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-fg">
            商品机会工作台
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-fg-muted">
            基于价格走势、采集健康度、评价代理信号、库存和监控状态排序；利润率、销量和真实需求仍标记为待补充信号。
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-card border border-border-subtle bg-surface px-3 py-2 text-sm text-fg-muted">
          <Activity className="h-4 w-4 text-primary-600" />
          {opportunitiesQuery.isLoading
            ? '计算中'
            : workspaceMode === 'review'
              ? `${visibleOpportunities.length}/${opportunities.length} 个复盘`
              : `${visibleOpportunities.length}/${opportunities.length} 个候选`}
        </div>
      </header>

      <section className="flex flex-wrap items-end gap-3 rounded-card border border-border-subtle bg-surface p-4 shadow-e1">
        <FilterField label="模式">
          <div
            className="inline-flex h-10 overflow-hidden rounded-button border border-border"
            role="group"
            aria-label="机会工作台模式"
          >
            <button
              type="button"
              onClick={() => {
                clearTransientActionContext();
                setWorkspaceMode('discover');
              }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 text-sm font-medium',
                workspaceMode === 'discover'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface text-fg-muted hover:bg-subtle',
              )}
            >
              <SearchCheck className="h-4 w-4" />
              发现
            </button>
            <button
              type="button"
              onClick={() => {
                clearTransientActionContext();
                setWorkspaceMode('review');
              }}
              className={cn(
                'inline-flex items-center gap-1.5 border-l border-border px-3 text-sm font-medium',
                workspaceMode === 'review'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface text-fg-muted hover:bg-subtle',
              )}
            >
              <RotateCcw className="h-4 w-4" />
              复盘
            </button>
          </div>
        </FilterField>
        <FilterField label="建议">
          <select
            aria-label="推荐动作筛选"
            value={recommendation}
            onChange={(event) => {
              clearTransientActionContext();
              setRecommendation(event.target.value);
            }}
            className="h-10 rounded-button border border-border bg-surface px-3 text-sm text-fg"
          >
            <option value="">全部</option>
            <option value="investigate">重点研究</option>
            <option value="watch">持续观察</option>
            <option value="check_data">补充数据</option>
            <option value="ignore">暂不处理</option>
          </select>
        </FilterField>
        <FilterField label="平台">
          <select
            aria-label="平台筛选"
            value={platform}
            onChange={(event) => {
              clearTransientActionContext();
              setPlatform(event.target.value);
            }}
            className="h-10 rounded-button border border-border bg-surface px-3 text-sm text-fg"
          >
            <option value="">全部</option>
            <option value="amazon">Amazon</option>
            <option value="walmart">Walmart</option>
            <option value="ebay">eBay</option>
            <option value="aliexpress">AliExpress</option>
          </select>
        </FilterField>
        <FilterField label="最低分">
          <input
            aria-label="最低分"
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(event) => {
              clearTransientActionContext();
              setMinScore(event.target.value);
            }}
            className="h-10 w-24 rounded-button border border-border bg-surface px-3 text-sm text-fg"
          />
        </FilterField>
        <FilterField label="业务完整度">
          <select
            aria-label="业务完整度筛选"
            value={businessReadiness}
            onChange={(event) => {
              clearTransientActionContext();
              setBusinessReadiness(event.target.value as BusinessReadiness);
            }}
            className="h-10 rounded-button border border-border bg-surface px-3 text-sm text-fg"
          >
            <option value="any">全部</option>
            <option value="complete">完整</option>
            <option value="partial">部分</option>
            <option value="none">无</option>
          </select>
        </FilterField>
        <FilterField label="采集运行">
          <select
            aria-label="采集运行状态筛选"
            value={operationalFilter}
            onChange={(event) => {
              clearTransientActionContext();
              setOperationalFilter(event.target.value as AcquisitionOperationalFilter);
            }}
            className="h-10 rounded-button border border-border bg-surface px-3 text-sm text-fg"
          >
            <option value="all">全部</option>
            <option value="delayed">延迟/阻塞</option>
            <option value="retryable">可重试</option>
          </select>
        </FilterField>
        <FilterField label="最低 ROI%">
          <input
            aria-label="最低 ROI"
            type="number"
            value={minRoi}
            onChange={(event) => {
              clearTransientActionContext();
              setMinRoi(event.target.value);
            }}
            className="h-10 w-28 rounded-button border border-border bg-surface px-3 text-sm text-fg"
          />
        </FilterField>
        <FilterField label="排序">
          <div className="inline-flex h-10 overflow-hidden rounded-button border border-border">
            <button
              type="button"
              onClick={() => {
                clearTransientActionContext();
                setSortOrder('desc');
              }}
              className={cn(
                'px-3 text-sm font-medium',
                sortOrder === 'desc'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface text-fg-muted'
              )}
            >
              高到低
            </button>
            <button
              type="button"
              onClick={() => {
                clearTransientActionContext();
                setSortOrder('asc');
              }}
              className={cn(
                'border-l border-border px-3 text-sm font-medium',
                sortOrder === 'asc'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface text-fg-muted'
              )}
            >
              低到高
            </button>
          </div>
        </FilterField>
        <FilterField label="研究状态">
          <select
            aria-label="研究状态筛选"
            value={researchStatus}
            onChange={(event) => {
              clearTransientActionContext();
              setResearchStatus(event.target.value);
            }}
            className="h-10 rounded-button border border-border bg-surface px-3 text-sm text-fg"
          >
            <option value="">全部</option>
            <option value="researching">调研中</option>
            <option value="watching">观察</option>
            <option value="ready">准备推进</option>
            <option value="rejected">已排除</option>
          </select>
        </FilterField>
        <FilterField label="研究标签">
          <input
            aria-label="研究标签筛选"
            value={researchTag}
            onChange={(event) => {
              clearTransientActionContext();
              setResearchTag(event.target.value);
            }}
            className="h-10 w-28 rounded-button border border-border bg-surface px-3 text-sm text-fg"
            placeholder="launch"
          />
        </FilterField>
        {workspaceMode === 'review' ? (
          <>
            <FilterField label="决策状态">
              <select
                aria-label="决策状态筛选"
                value={decisionStatus}
                onChange={(event) => {
                  clearTransientActionContext();
                  setDecisionStatus(event.target.value);
                }}
                className="h-10 rounded-button border border-border bg-surface px-3 text-sm text-fg"
              >
                <option value="">全部</option>
                <option value="go">推进</option>
                <option value="hold">暂缓</option>
                <option value="no_go">排除</option>
              </select>
            </FilterField>
            <FilterField label="复盘队列">
              <select
                aria-label="决策复盘筛选"
                value={decisionReview}
                onChange={(event) => {
                  clearTransientActionContext();
                  setDecisionReview(
                    event.target.value as OpportunityResearchDecisionReviewFilter,
                  );
                }}
                className="h-10 rounded-button border border-border bg-surface px-3 text-sm text-fg"
              >
                {(
                  [
                    'all',
                    'decided',
                    'undecided',
                    'needs_action',
                    'stale',
                  ] as OpportunityResearchDecisionReviewFilter[]
                ).map((value) => (
                  <option key={value} value={value}>
                    {decisionReviewLabels[value]}
                  </option>
                ))}
              </select>
            </FilterField>
          </>
        ) : null}
        <label className="flex h-10 items-center gap-2 rounded-button border border-border px-3 text-sm font-medium text-fg-muted">
          <input
            aria-label="只看研究工作台"
            type="checkbox"
            checked={shortlistedOnly}
            onChange={(event) => {
              clearTransientActionContext();
              setShortlistedOnly(event.target.checked);
            }}
          />
          只看工作台
        </label>
        {hasPracticeFilter ? (
          <div className="flex h-10 items-center gap-2 rounded-button border border-border bg-canvas px-3 text-xs text-fg-muted">
            <Badge variant="info">工作流练习筛选</Badge>
            <span>
              {actionId
                ? dailyActionLabels[actionId]
                : actionOutcome
                  ? actionOutcomeLabels[actionOutcome]
                  : '全部练习'}
            </span>
            <button
              type="button"
              className="font-medium text-primary-700 hover:text-primary-900"
              onClick={handleClearPracticeFilter}
              aria-label="清除练习筛选"
            >
              清除
            </button>
          </div>
        ) : null}
        <SlidersHorizontal className="ml-auto hidden h-5 w-5 text-fg-muted sm:block" />
      </section>

      <ReviewSummaryStrip
        summary={reviewSummaryQuery.data}
        loading={reviewSummaryQuery.isLoading}
        onFilter={handleApplyReviewSummaryFilter}
        activeFilter={activeReviewSummaryFilter}
      />

      <PracticeSummaryStrip
        summary={practiceSummaryQuery.data}
        loading={practiceSummaryQuery.isLoading}
        onFilter={handleApplyPracticeFilter}
        activeFilter={activePracticeSummaryFilter}
      />

      <DailyActionPlanPanel
        plan={dailyActionPlanQuery.data}
        loading={dailyActionPlanQuery.isLoading}
        onSelect={handleApplyDailyAction}
        activeActionId={activeDailyActionId}
      />

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border-subtle bg-surface p-3 shadow-e1">
        <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
          <GitCompare className="h-4 w-4 text-primary-600" />
          <span>已选 {comparisonIds.length}/{compareLimit} 个候选用于比较</span>
          {comparisonIds.length >= compareLimit ? (
            <Badge variant="warning">已达上限</Badge>
          ) : null}
          {exportMessage ? <Badge variant="success">{exportMessage}</Badge> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={
              comparisonIds.length === 0 ||
              comparisonIds.length > compareLimit ||
              compareResearch.isPending
            }
            onClick={handleCompare}
            aria-label="比较选中候选"
          >
            <GitCompare className="h-4 w-4" />
            {compareResearch.isPending ? '比较中' : '比较'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={exportDisabled || exportResearch.isPending}
            onClick={handleExport}
            aria-label="导出研究候选"
          >
            <Download className="h-4 w-4" />
            {exportResearch.isPending ? '导出中' : '导出 CSV'}
          </Button>
        </div>
      </section>

      {compareResearch.data ? (
        <ComparisonTable opportunities={compareResearch.data.data} />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
        <section className="overflow-hidden rounded-card border border-border-subtle bg-surface shadow-e1">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <h2 className="text-sm font-semibold text-fg">
              {workspaceMode === 'review' ? '决策复盘' : '机会排行'}
            </h2>
            <span className="text-xs text-fg-muted">
              {workspaceMode === 'review' ? '按复盘筛选计算' : '按当前筛选计算'}
            </span>
          </div>
          <div className="max-h-[calc(100vh-8rem)] overflow-auto p-3">
            {opportunitiesQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-24 animate-skeleton rounded-card" />
                ))}
              </div>
            ) : visibleOpportunities.length > 0 ? (
              <div className="space-y-3">
                {visibleOpportunities.map((opportunity) => (
                  <OpportunityRow
                    key={opportunity.product.id}
                    opportunity={opportunity}
                    operations={operationsByProductId.get(opportunity.product.id)}
                    selected={selectedId === opportunity.product.id}
                    showUndecidedReview={workspaceMode === 'review'}
                    onSelect={() => setSelectedId(opportunity.product.id)}
                    comparisonSelected={comparisonIds.includes(opportunity.product.id)}
                    comparisonDisabled={
                      !comparisonIds.includes(opportunity.product.id) &&
                      comparisonIds.length >= compareLimit
                    }
                    onToggleComparison={() =>
                      handleToggleComparison(opportunity.product.id)
                    }
                    onAddResearch={() => handleAddResearch(opportunity.product.id)}
                    onArchiveResearch={() =>
                      archiveResearch.mutate(opportunity.product.id)
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <SearchCheck className="h-10 w-10 text-fg-muted" />
                <h3 className="mt-3 text-base font-semibold text-fg">暂无候选商品</h3>
                {productsLoaded && !hasProducts ? (
                  <>
                    <p className="mt-1 max-w-md text-sm text-fg-muted">
                      机会分析需要先添加商品。添加商品后，系统才能基于价格、采集健康度、市场代理信号和业务假设生成候选。
                    </p>
                    <Link
                      to="/products"
                      className="mt-4 inline-flex h-10 items-center justify-center rounded-button bg-primary-600 px-4 text-sm font-medium text-white shadow-e1 transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
                    >
                      前往商品
                    </Link>
                  </>
                ) : (
                  <p className="mt-1 max-w-md text-sm text-fg-muted">
                    机会判断还缺少价格、市场或业务假设。请记录手动读数、在商品详情执行立即检查、刷新市场趋势信号，或补充成本、费用、售价等业务假设。
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <OpportunityExplanation
          opportunity={selected}
          loading={explanationQuery.isLoading}
          checking={checkProductNow.isPending}
          onCheckNow={handleCheckNow}
          refreshingMarketSignals={refreshMarketSignals.isPending}
          onRefreshMarketSignals={handleRefreshMarketSignals}
          onRecordReading={(product) => setReadingProduct(product)}
          operations={selectedOperations}
          savingResearch={upsertResearch.isPending}
          onSaveResearch={handleSaveResearch}
          onAddResearch={handleAddResearch}
          savingDecision={saveDecision.isPending}
          clearingDecision={clearDecision.isPending}
          onSaveDecision={handleSaveDecision}
          onClearDecision={handleClearDecision}
          savingActionOutcome={saveActionOutcome.isPending}
          clearingActionOutcome={clearActionOutcome.isPending}
          onSaveActionOutcome={handleSaveActionOutcome}
          onClearActionOutcome={handleClearActionOutcome}
          activeActionContext={activeActionContext}
        />
      </div>
      {readingProduct ? (
        <Modal
          title="记录手动读数"
          className="max-w-3xl"
          onClose={() => setReadingProduct(null)}
        >
          <div className="mb-4 rounded-md border border-border-subtle bg-canvas px-3 py-2">
            <p className="line-clamp-2 text-sm font-medium text-fg">
              {readingProduct.title}
            </p>
            <p className="mt-1 text-xs text-fg-muted">
              保存后会刷新机会排序、缺失信号上下文和产品当前价。
            </p>
          </div>
          <ManualReadingForm
            currency={readingProduct.currency}
            isSaving={createSnapshot.isPending}
            isError={createSnapshot.isError}
            isSuccess={createSnapshot.isSuccess}
            onSubmit={(data) =>
              createSnapshot.mutate(
                { productId: readingProduct.id, ...data },
                { onSuccess: () => setReadingProduct(null) },
              )
            }
          />
        </Modal>
      ) : null}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-fg-muted">
      {label}
      {children}
    </label>
  );
}

function ReviewSummaryStrip({
  summary,
  loading,
  onFilter,
  activeFilter,
}: {
  summary?: OpportunityResearchReviewSummary;
  loading: boolean;
  onFilter: (filter: ReviewSummaryFilterTarget) => void;
  activeFilter: ReviewSummaryFilterTarget | null;
}) {
  const items = summary
    ? [
        {
          label: '活跃研究',
          value: summary.totalActive,
          detail: `${summary.byPriority.high} 个高优先级`,
          variant: 'info' as const,
          filter: 'all' as const,
          ariaLabel: '筛选复盘汇总：活跃研究',
        },
        {
          label: '未决策',
          value: summary.undecided,
          detail: `${summary.byStatus.researching} 个调研中`,
          variant: 'neutral' as const,
          filter: 'undecided' as const,
          ariaLabel: '筛选复盘汇总：未决策',
        },
        {
          label: '待下一步',
          value: summary.needsNextAction,
          detail: `${summary.decided} 个已决策`,
          variant: 'warning' as const,
          filter: 'needs_action' as const,
          ariaLabel: '筛选复盘汇总：待下一步',
        },
        {
          label: '需复盘',
          value: summary.stale,
          detail: '14 天阈值',
          variant: 'error' as const,
          filter: 'stale' as const,
          ariaLabel: '筛选复盘汇总：需复盘',
        },
      ]
    : [];

  return (
    <section className="grid gap-3 md:grid-cols-4">
      {loading
        ? Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-skeleton rounded-card border border-border-subtle bg-surface"
            />
          ))
        : items.map((item) => {
            const isActive = activeFilter === item.filter;

            return (
              <button
                key={item.label}
                type="button"
                aria-label={item.ariaLabel}
                aria-pressed={isActive}
                onClick={() => onFilter(item.filter)}
                className={cn(
                  'rounded-card border border-border-subtle bg-surface p-3 text-left shadow-e1 transition hover:border-primary-400 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                  isActive && 'border-primary-500 bg-primary-50 ring-1 ring-primary-200',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'text-xs font-medium text-fg-muted',
                      isActive && 'text-primary-700',
                    )}
                  >
                    {item.label}
                  </span>
                  <Badge variant={isActive ? 'success' : item.variant}>
                    {isActive ? '当前队列' : '工作流'}
                  </Badge>
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <span className="text-2xl font-bold tabular-nums text-fg">
                    {item.value}
                  </span>
                  <span className="text-xs text-fg-muted">{item.detail}</span>
                </div>
              </button>
            );
          })}
      {!loading && summary ? (
        <div className="md:col-span-4 space-y-1 text-xs text-fg-muted">
          {summary.generatedAt != null ? (
            <p>汇总时间 · {formatDecisionTime(summary.generatedAt)}</p>
          ) : null}
          <p>{summary.caveat}</p>
        </div>
      ) : null}
    </section>
  );
}

function PracticeSummaryStrip({
  summary,
  loading,
  onFilter,
  activeFilter,
}: {
  summary?: OpportunityResearchPracticeSummary;
  loading: boolean;
  onFilter: (filter: {
    actionOutcome?: OpportunityResearchActionOutcomeFilter;
    actionId?: OpportunityResearchDailyActionId;
  }) => void;
  activeFilter: PracticeSummaryFilterTarget | null;
}) {
  const coverageItems = summary
    ? [
        {
          label: '练习覆盖',
          value: summary.withOutcome,
          detail: `${summary.totalActive} 个活跃研究`,
          ariaLabel: '筛选已记录行动结果',
          filter: { actionOutcome: 'with' as const },
        },
        {
          label: '未记录结果',
          value: summary.withoutOutcome,
          detail: '等待执行证据',
          ariaLabel: '筛选未记录行动结果',
          filter: { actionOutcome: 'without' as const },
        },
        {
          label: '最近完成',
          value: summary.latestCompletedAt
            ? formatActionOutcomeRecency(summary.latestCompletedAt)
            : '暂无',
          detail: summary.latestCompletedAt
            ? formatDecisionTime(summary.latestCompletedAt)
            : 'latest outcome',
          ariaLabel: '',
          filter: null,
        },
      ]
    : [];
  const isPracticeFilterActive = (filter: {
    actionOutcome?: OpportunityResearchActionOutcomeFilter;
    actionId?: OpportunityResearchDailyActionId;
  }) =>
    Boolean(
      (filter.actionOutcome &&
        activeFilter?.kind === 'actionOutcome' &&
        activeFilter.value === filter.actionOutcome) ||
        (filter.actionId &&
          activeFilter?.kind === 'actionId' &&
          activeFilter.value === filter.actionId),
    );

  return (
    <section className="rounded-card border border-border-subtle bg-surface p-4 shadow-e1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Activity className="h-4 w-4 text-primary-600" />
            行动练习覆盖
          </div>
          <p className="mt-1 text-xs text-fg-muted">
            只统计最近一次行动结果，作为工作流练习覆盖证据。
          </p>
        </div>
        <Badge variant="info">练习覆盖</Badge>
      </div>

      {loading ? (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-skeleton rounded-card" />
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {coverageItems.map((item) => {
              const isActive = item.filter
                ? isPracticeFilterActive(item.filter)
                : false;

              return item.filter ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onFilter(item.filter)}
                  aria-label={item.ariaLabel}
                  aria-pressed={isActive}
                  className={cn(
                    'rounded-md border border-border-subtle bg-canvas px-3 py-2 text-left transition hover:border-primary-400 hover:bg-primary-50',
                    isActive && 'border-primary-500 bg-primary-50 ring-1 ring-primary-200',
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-medium text-fg-muted',
                      isActive && 'text-primary-700',
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="mt-1 flex items-end justify-between gap-3">
                    <span className="text-lg font-semibold tabular-nums text-fg">
                      {item.value}
                    </span>
                    <span className="text-xs text-fg-muted">
                      {isActive ? '当前练习筛选' : item.detail}
                    </span>
                  </span>
                </button>
              ) : (
                <div
                  key={item.label}
                  className="rounded-md border border-border-subtle bg-canvas px-3 py-2"
                >
                  <span className="text-xs font-medium text-fg-muted">
                    {item.label}
                  </span>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <span className="text-lg font-semibold tabular-nums text-fg">
                      {item.value}
                    </span>
                    <span className="text-xs text-fg-muted">{item.detail}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            {dailyActionIds.map((actionId) => {
              const isActive = isPracticeFilterActive({ actionId });

              return (
                <button
                  key={actionId}
                  type="button"
                  onClick={() => onFilter({ actionId })}
                  aria-label={`筛选行动分桶：${dailyActionLabels[actionId]}`}
                  aria-pressed={isActive}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-md border border-border-subtle bg-canvas px-3 py-2 text-left text-xs transition hover:border-primary-400 hover:bg-primary-50',
                    isActive && 'border-primary-500 bg-primary-50 ring-1 ring-primary-200',
                  )}
                >
                  <span
                    className={cn(
                      'truncate text-fg-muted',
                      isActive && 'font-medium text-primary-700',
                    )}
                  >
                    {dailyActionLabels[actionId]}
                  </span>
                  <span className="font-semibold tabular-nums text-fg">
                    {summary.byActionId[actionId]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 space-y-1 text-xs text-fg-muted">
            <p>汇总时间 · {formatDecisionTime(summary.generatedAt)}</p>
            <p>{summary.caveat}</p>
          </div>
        </>
      ) : null}
    </section>
  );
}

function DailyActionPlanPanel({
  plan,
  loading,
  onSelect,
  activeActionId,
}: {
  plan?: OpportunityResearchDailyActionPlan;
  loading: boolean;
  onSelect: (item: OpportunityResearchDailyActionItem) => void;
  activeActionId: OpportunityResearchDailyActionId | null;
}) {
  return (
    <section className="rounded-card border border-border-subtle bg-surface p-4 shadow-e1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-fg">
            <CheckCircle2 className="h-4 w-4 text-primary-600" />
            今日行动计划
          </div>
          <p className="mt-1 text-xs text-fg-muted">
            按复盘纪律排序的工作流行动，点击后应用现有筛选。
          </p>
        </div>
        <Badge variant="info">工作流行动</Badge>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-skeleton rounded-card border border-border-subtle bg-canvas"
            />
          ))}
        </div>
      ) : plan?.items.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {plan.items.map((item) => {
            const isActive = activeActionId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className={cn(
                  'min-h-28 rounded-card border border-border-subtle bg-canvas p-3 text-left transition hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500',
                  isActive && 'border-primary-500 bg-primary-50 ring-1 ring-primary-200',
                )}
                aria-label={`应用行动：${item.label}`}
                aria-pressed={isActive}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.priority <= 2 ? 'warning' : 'neutral'}>
                      P{item.priority}
                    </Badge>
                    {isActive ? <Badge variant="success">当前行动</Badge> : null}
                  </div>
                  <span className="text-lg font-bold tabular-nums text-fg">
                    {item.count}
                  </span>
                </div>
                <p
                  className={cn(
                    'mt-2 text-sm font-semibold text-fg',
                    isActive && 'text-primary-800',
                  )}
                >
                  {item.label}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-fg-muted">
                  {item.reason}
                </p>
                <div className="mt-3 rounded-md border border-border-subtle bg-surface/80 px-2 py-2">
                  <p className="text-xs font-semibold text-fg">练习目标</p>
                  <p className="mt-1 text-xs text-fg-muted">
                    {item.learningGoal}
                  </p>
                  <ol className="mt-2 space-y-1 text-xs text-fg-muted">
                    {item.steps.map((step, index) => (
                      <li key={step} className="flex gap-1.5">
                        <span className="font-semibold text-primary-600">
                          {index + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-xs font-semibold text-fg">完成定义</p>
                  <ul className="mt-1 space-y-1 text-xs text-fg-muted">
                    {item.completionCriteria.map((criterion) => (
                      <li key={criterion} className="flex gap-1.5">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-success" />
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-card border border-dashed border-border-subtle bg-canvas px-4 py-6 text-center text-sm text-fg-muted">
          今日没有待处理的工作流行动
        </div>
      )}

      {!loading && plan ? (
        <div className="mt-3 space-y-1 text-xs text-fg-muted">
          <p>计划时间 · {formatDecisionTime(plan.generatedAt)}</p>
          <p>{plan.caveat}</p>
        </div>
      ) : null}
    </section>
  );
}

function OpportunityRow({
  opportunity,
  operations,
  selected,
  showUndecidedReview,
  onSelect,
  comparisonSelected,
  comparisonDisabled,
  onToggleComparison,
  onAddResearch,
  onArchiveResearch,
}: {
  opportunity: ProductOpportunity;
  operations?: AcquisitionOperationalState;
  selected: boolean;
  showUndecidedReview: boolean;
  onSelect: () => void;
  comparisonSelected: boolean;
  comparisonDisabled: boolean;
  onToggleComparison: () => void;
  onAddResearch: () => void;
  onArchiveResearch: () => void;
}) {
  const businessSignals = getBusinessSignals(opportunity);
  const marketSignals = getMarketSignals(opportunity);
  const operationalState = operations ?? deriveAcquisitionOperationalState();
  const primaryMarketFactor = marketSignals.factors[0];
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onSelect();
      }}
      className={cn(
        'w-full cursor-pointer rounded-card border p-4 text-left transition-colors',
        selected
          ? 'border-primary-300 bg-primary-50/70'
          : 'border-border-subtle bg-canvas hover:border-primary-200 hover:bg-subtle'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-fg">
              {opportunity.product.title}
            </h3>
            <Badge variant={recommendationVariants[opportunity.recommendation]}>
              {recommendationLabels[opportunity.recommendation]}
            </Badge>
            {opportunity.research ? (
              <Badge variant={opportunity.research.archived ? 'neutral' : 'info'}>
                {researchStatusLabels[opportunity.research.status]}
              </Badge>
            ) : null}
            <DecisionReviewBadges
              review={opportunity.research?.decisionReview}
              includeUndecided={showUndecidedReview}
            />
          </div>
          <p className="mt-1 text-xs text-fg-muted">
            {opportunity.product.platform}
            {opportunity.product.category ? ` · ${opportunity.product.category}` : ''}
          </p>
        </div>
        <div
          className="flex flex-shrink-0 items-center gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <label className="flex h-9 items-center gap-1 rounded-button border border-border px-2 text-xs text-fg-muted">
            <input
              aria-label={`选择 ${opportunity.product.title} 比较`}
              type="checkbox"
              checked={comparisonSelected}
              disabled={comparisonDisabled}
              onChange={onToggleComparison}
            />
            比较
          </label>
          {opportunity.research && !opportunity.research.archived ? (
            <button
              type="button"
              onClick={onArchiveResearch}
              className="inline-flex h-9 w-9 items-center justify-center rounded-button border border-border text-fg-muted hover:bg-subtle"
              aria-label={`归档 ${opportunity.product.title} 研究条目`}
              title="归档研究条目"
            >
              <Archive className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onAddResearch}
              className="inline-flex h-9 w-9 items-center justify-center rounded-button border border-border text-fg-muted hover:bg-subtle"
              aria-label={`加入 ${opportunity.product.title} 到研究工作台`}
              title="加入研究工作台"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        <ScorePill score={opportunity.score} confidence={opportunity.confidence} />
      </div>
      <ResearchSummary research={opportunity.research} />
      <OpportunityOperationsSummary state={operationalState} />
      <div className="mt-3 grid gap-2 text-xs text-fg-muted sm:grid-cols-2">
        <span>
          价格:{' '}
          {opportunity.product.currentPrice
            ? `${opportunity.product.currency} ${opportunity.product.currentPrice}`
            : '暂无'}
        </span>
        <span>置信度: {Math.round(opportunity.confidence * 100)}%</span>
        <span>
          数据源:{' '}
          {opportunity.acquisitionHealth.provider ?? '暂无'}
          {opportunity.acquisitionHealth.source
            ? `/${opportunity.acquisitionHealth.source}`
            : ''}
        </span>
        <span>
          最近尝试: {opportunity.acquisitionHealth.status ?? opportunity.acquisitionHealth.failureReason ?? '无'}
        </span>
        <span>净利率: {percentValue(businessSignals.metrics?.netMargin ?? null)}</span>
        <span>ROI: {percentValue(businessSignals.metrics?.roi ?? null)}</span>
        <span>市场: {marketSignalStatusText(marketSignals)}</span>
        <span>
          趋势:{' '}
          {primaryMarketFactor
            ? `${primaryMarketFactor.label} ${marketValue(primaryMarketFactor.rawValue)}`
            : '暂无'}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge
          variant={
            businessSignals.completeness === 'complete'
              ? 'success'
              : businessSignals.completeness === 'partial'
                ? 'warning'
                : 'neutral'
          }
        >
          {businessCompletenessLabel(businessSignals.completeness, true)}
        </Badge>
        <Badge variant={marketSignalStatusVariant(marketSignals.status)}>
          {marketStatusLabel(marketSignals.status, true)}
        </Badge>
        {businessSignals.missingSignals.slice(0, 3).map((signal) => (
          <Badge key={signal} variant="warning">
            {opportunitySignalLabel(signal)}
          </Badge>
        ))}
        {marketSignals.missingSignals.slice(0, 2).map((signal) => (
          <Badge key={signal} variant="warning">
            {opportunitySignalLabel(signal)}
          </Badge>
        ))}
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-fg-muted">
        {opportunity.keyReasons[0]
          ? localizeOpportunityDiagnosticText(opportunity.keyReasons[0])
          : '暂无关键原因'}
      </p>
    </div>
  );
}

function OpportunityOperationsSummary({
  state,
}: {
  state: AcquisitionOperationalState;
}) {
  const Icon =
    state.kind === 'retryable'
      ? RotateCcw
      : state.kind === 'delayed'
        ? Clock
        : Server;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-border-subtle bg-surface px-3 py-2 text-xs">
      <Icon className="h-3.5 w-3.5 text-fg-muted" />
      <span className="font-semibold text-fg-muted">采集运行</span>
      <Badge variant={operationalStateBadge(state.kind)}>{state.label}</Badge>
      <span className="min-w-0 flex-1 truncate text-fg-muted">{state.detail}</span>
    </div>
  );
}

function OpportunityExplanation({
  opportunity,
  loading,
  checking,
  onCheckNow,
  refreshingMarketSignals,
  onRefreshMarketSignals,
  onRecordReading,
  operations,
  savingResearch,
  onSaveResearch,
  onAddResearch,
  savingDecision,
  clearingDecision,
  onSaveDecision,
  onClearDecision,
  savingActionOutcome,
  clearingActionOutcome,
  onSaveActionOutcome,
  onClearActionOutcome,
  activeActionContext,
}: {
  opportunity?: ProductOpportunity;
  loading: boolean;
  checking: boolean;
  onCheckNow: () => void;
  refreshingMarketSignals: boolean;
  onRefreshMarketSignals: () => void;
  onRecordReading: (product: ProductOpportunity['product']) => void;
  operations?: AcquisitionOperationalState;
  savingResearch: boolean;
  onSaveResearch: (
    productId: string,
    data: {
      status: OpportunityResearchStatus;
      priority: OpportunityResearchPriority;
      tags: string[];
      notes: string | null;
    },
  ) => void;
  onAddResearch: (productId: string) => void;
  savingDecision: boolean;
  clearingDecision: boolean;
  onSaveDecision: (
    productId: string,
    data: {
      status: OpportunityResearchDecisionStatus;
      reason: string;
      nextAction: string | null;
    },
  ) => void;
  onClearDecision: (productId: string) => void;
  savingActionOutcome: boolean;
  clearingActionOutcome: boolean;
  onSaveActionOutcome: (
    productId: string,
    data: {
      actionId: OpportunityResearchDailyActionId;
      outcome: string;
      completedAt: number;
    },
  ) => void;
  onClearActionOutcome: (productId: string) => void;
  activeActionContext: ActiveActionContext | null;
}) {
  if (loading) {
    return (
      <aside className="rounded-card border border-border-subtle bg-surface p-4 shadow-e1">
        <div className="h-8 w-40 animate-skeleton rounded-button" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 animate-skeleton rounded-card" />
          ))}
        </div>
      </aside>
    );
  }

  if (!opportunity) {
    return (
      <aside className="rounded-card border border-border-subtle bg-surface p-6 text-center shadow-e1">
        <AlertCircle className="mx-auto h-9 w-9 text-fg-muted" />
        <h2 className="mt-3 text-sm font-semibold text-fg">选择商品查看解释</h2>
      </aside>
    );
  }

  const shouldCheckData = opportunity.recommendation === 'check_data';
  const businessSignals = getBusinessSignals(opportunity);
  const marketSignals = getMarketSignals(opportunity);
  const operationalState = operations ?? deriveAcquisitionOperationalState();
  const canRefreshMarketSignals =
    opportunity.product.platform === 'amazon' &&
    marketSignals.status !== 'fresh';

  return (
    <aside className="overflow-auto rounded-card border border-border-subtle bg-surface shadow-e1 xl:sticky xl:top-4 xl:max-h-[calc(100vh-8rem)]">
      <div className="border-b border-border-subtle p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-fg">
              {opportunity.product.title}
            </h2>
            <p className="mt-1 text-xs text-fg-muted">评分解释</p>
          </div>
          <ScorePill score={opportunity.score} confidence={opportunity.confidence} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={recommendationVariants[opportunity.recommendation]}>
            {recommendationLabels[opportunity.recommendation]}
          </Badge>
          {!opportunity.research ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onAddResearch(opportunity.product.id)}
              disabled={savingResearch}
              aria-label="从详情面板加入研究工作台"
            >
              <Plus className="h-4 w-4" />
              加入研究
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onRecordReading(opportunity.product)}
            aria-label={`记录 ${opportunity.product.title} 手动读数`}
          >
            <PencilLine className="h-4 w-4" />
            记录读数
          </Button>
          {shouldCheckData && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onCheckNow}
              disabled={checking}
              aria-label="立即检查商品数据"
            >
              <RefreshCw className={cn('h-4 w-4', checking && 'animate-spin')} />
              {checking ? '检查中' : '立即检查'}
            </Button>
          )}
          {canRefreshMarketSignals && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onRefreshMarketSignals}
              disabled={refreshingMarketSignals}
              aria-label="刷新市场趋势信号"
            >
              <RefreshCw
                className={cn('h-4 w-4', refreshingMarketSignals && 'animate-spin')}
              />
              {refreshingMarketSignals ? '刷新中' : '刷新趋势'}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-5 p-4">
        <RecommendationGatePanel gate={opportunity.recommendationGate} />

        <ResearchEditor
          key={`research-${opportunity.product.id}-${opportunity.research?.productId ?? 'new'}`}
          opportunity={opportunity}
          saving={savingResearch}
          onSave={onSaveResearch}
          onAdd={() => onAddResearch(opportunity.product.id)}
        />

        <DecisionPanel
          key={`decision-${opportunity.product.id}-${opportunity.research?.decision?.updatedAt ?? 'new'}-${opportunity.research?.lastActionOutcome?.updatedAt ?? 'no-outcome'}-${activeActionContext?.source ?? 'no-context'}-${activeActionContext?.actionId ?? 'no-action-context'}`}
          opportunity={opportunity}
          saving={savingDecision}
          clearing={clearingDecision}
          onSave={onSaveDecision}
          onClear={() => onClearDecision(opportunity.product.id)}
          savingActionOutcome={savingActionOutcome}
          clearingActionOutcome={clearingActionOutcome}
          onSaveActionOutcome={onSaveActionOutcome}
          onClearActionOutcome={() =>
            onClearActionOutcome(opportunity.product.id)
          }
          activeActionContext={activeActionContext}
        />

        <section className="rounded-card border border-border-subtle bg-canvas p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                <Server className="h-3.5 w-3.5" />
                采集运行
              </h3>
              <p className="mt-1 text-xs text-fg-muted">
                队列和 job 状态只说明数据源采集运行情况，不参与机会评分。
              </p>
            </div>
            <Badge variant={operationalStateBadge(operationalState.kind)}>
              {operationalState.label}
            </Badge>
          </div>
          <p className="mt-3 text-xs text-fg">{operationalState.detail}</p>
          {shouldCheckData ? (
            <p className="mt-2 text-xs text-fg-muted">
              当前建议需要补充数据；采集运行状态用于判断是等待队列、provider gate，还是需要手动检查。
            </p>
          ) : null}
          {operationalState.caveat ? (
            <p className="mt-2 text-xs text-fg-muted">{operationalState.caveat}</p>
          ) : null}
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            关键原因
          </h3>
          <ul className="mt-2 space-y-2">
            {opportunity.keyReasons.map((reason) => (
              <li key={reason} className="flex gap-2 text-sm text-fg">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                <span>{localizeOpportunityDiagnosticText(reason)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            因子拆解
          </h3>
          <div className="mt-2 space-y-2">
            {opportunity.factors.map((factor) => (
              <div
                key={factor.name}
                className="rounded-card border border-border-subtle bg-canvas p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-fg">{factor.label}</span>
                  <span className="text-sm font-semibold text-fg">
                    {factor.contribution.toFixed(1)}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-subtle">
                  <div
                    className="h-full rounded-full bg-primary-600"
                    style={{ width: `${factor.normalizedScore}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-fg-muted">
                  {localizeOpportunityDiagnosticText(factor.explanation)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            业务信号
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <InfoTerm
              label="完整度"
              value={businessCompletenessLabel(businessSignals.completeness)}
            />
            <InfoTerm
              label="净利率"
              value={percentValue(businessSignals.metrics?.netMargin ?? null)}
            />
            <InfoTerm
              label="ROI"
              value={percentValue(businessSignals.metrics?.roi ?? null)}
            />
            <InfoTerm
              label="保本售价"
              value={
                businessSignals.metrics?.breakevenSellPrice !== null &&
                businessSignals.metrics?.breakevenSellPrice !== undefined
                  ? `${opportunity.product.currency} ${businessSignals.metrics.breakevenSellPrice}`
                  : '缺失'
              }
            />
          </div>
          <p className="mt-2 text-xs text-fg-muted">
            {businessSignals.caveat}
          </p>
        </section>

        <section className="rounded-card border border-border-subtle bg-canvas p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                <BarChart3 className="h-3.5 w-3.5" />
                市场趋势信号
              </h3>
              <p className="mt-1 text-xs text-fg-muted">
                Keepa 排名、价格和评价变化作为趋势代理信号展示。
              </p>
            </div>
            <Badge variant={marketSignalStatusVariant(marketSignals.status)}>
              {marketStatusLabel(marketSignals.status)}
            </Badge>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <InfoTerm label="Provider" value={marketSignals.provider ?? '无'} />
            <InfoTerm label="Source" value={marketSignals.source ?? '无'} />
            <InfoTerm
              label="Confidence"
              value={
                marketSignals.confidence === null
                  ? '无'
                  : `${Math.round(marketSignals.confidence * 100)}%`
              }
            />
            <InfoTerm
              label="Freshness"
              value={formatMarketAge(marketSignals.freshnessMs)}
            />
          </dl>
          {marketSignals.factors.length > 0 ? (
            <div className="mt-3 space-y-2">
              {marketSignals.factors.map((factor) => (
                <div
                  key={factor.name}
                  className="rounded-md border border-border-subtle bg-surface p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-fg">{factor.label}</span>
                    <span className="text-xs tabular-nums text-fg-muted">
                      {marketValue(factor.rawValue)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-fg-muted">
                    {localizeOpportunityDiagnosticText(factor.explanation)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-md border border-dashed border-border-subtle p-3 text-xs text-fg-muted">
              暂无市场趋势因子，刷新 Keepa 市场信号后再评估外部趋势。
            </div>
          )}
          {marketSignals.missingSignals.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {marketSignals.missingSignals.map((signal) => (
                <Badge key={signal} variant="warning">
                  {opportunitySignalLabel(signal)}
                </Badge>
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-xs text-fg-muted">{marketSignals.caveat}</p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            缺失信号
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {opportunity.missingSignals.map((signal) => (
              <Badge key={signal} variant="warning">
                {opportunitySignalLabel(signal)}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-xs text-fg-muted">
            当前评分不验证利润率、销量或真实需求，只作为下一步调研优先级。
          </p>
          {opportunity.product.platform === 'ebay' ? (
            <p className="mt-2 text-xs text-fg-muted">
              eBay Browse 只提供当前 listing 数据；销量、需求、利润和 ROI 仍需要商家假设或外部验证信号。
            </p>
          ) : null}
        </section>

        <section className="rounded-card border border-border-subtle bg-canvas p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            采集健康度
          </h3>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <InfoTerm label="Provider" value={opportunity.acquisitionHealth.provider ?? '无'} />
            <InfoTerm label="Source" value={opportunity.acquisitionHealth.source ?? '无'} />
            <InfoTerm label="Status" value={opportunity.acquisitionHealth.status ?? '无'} />
            <InfoTerm
              label="Confidence"
              value={
                opportunity.acquisitionHealth.confidence !== null
                  ? `${Math.round(opportunity.acquisitionHealth.confidence * 100)}%`
                  : '无'
              }
            />
            <InfoTerm
              label="Failure"
              value={opportunity.acquisitionHealth.failureReason ?? '无'}
            />
          </dl>
        </section>
      </div>
    </aside>
  );
}

function RecommendationGatePanel({
  gate,
}: {
  gate: ProductOpportunity['recommendationGate'];
}) {
  if (!hasRecommendationGateContext(gate)) {
    return null;
  }

  return (
    <section className="rounded-card border border-border-subtle bg-canvas p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">
            <AlertCircle className="h-3.5 w-3.5" />
            推荐门控
          </h3>
          <p className="mt-1 text-xs text-fg-muted">
            后端根据缺失和过时信号调整最终建议。
          </p>
        </div>
        <Badge variant={recommendationGateVariant(gate.status)}>
          {recommendationGateStatusLabel(gate.status)}
        </Badge>
      </div>
      <div className="mt-3 grid gap-2 text-xs">
        {gate.applied ? (
          <div className="rounded-md border border-border-subtle bg-surface px-2 py-1.5 text-fg-muted">
            {recommendationLabels[gate.originalRecommendation]} →{' '}
            {recommendationLabels[gate.finalRecommendation]}
          </div>
        ) : null}
        {gate.reasons.map((reason) => (
          <p key={reason} className="text-fg">
            {localizeOpportunityDiagnosticText(reason)}
          </p>
        ))}
      </div>
      {gate.nextActions.length > 0 ? (
        <div className="mt-3 space-y-1">
          <p className="text-xs font-medium text-fg-muted">下一步</p>
          <ul className="space-y-1">
            {gate.nextActions.map((action) => (
              <li key={action} className="text-xs text-fg-muted">
                {action}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {gate.signals.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {gate.signals.map((signal) => (
            <Badge key={signal} variant="warning">
              {opportunitySignalLabel(signal)}
            </Badge>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function recommendationGateVariant(
  status: ProductOpportunity['recommendationGate']['status'],
): 'success' | 'warning' | 'neutral' | 'error' {
  if (status === 'blocked') return 'error';
  if (status === 'caution') return 'warning';
  return 'success';
}

const recommendationGateStatusLabels: Record<
  ProductOpportunity['recommendationGate']['status'],
  string
> = {
  blocked: '已阻塞',
  caution: '需谨慎',
  clear: '已放行',
};

function recommendationGateStatusLabel(
  status: ProductOpportunity['recommendationGate']['status'],
): string {
  return recommendationGateStatusLabels[status] ?? status;
}

function hasRecommendationGateContext(
  gate: ProductOpportunity['recommendationGate'],
): boolean {
  return (
    gate.status !== 'clear' ||
    gate.applied ||
    gate.reasons.length > 0 ||
    gate.signals.length > 0 ||
    gate.nextActions.length > 0
  );
}

function DecisionPanel({
  opportunity,
  saving,
  clearing,
  onSave,
  onClear,
  savingActionOutcome,
  clearingActionOutcome,
  onSaveActionOutcome,
  onClearActionOutcome,
  activeActionContext,
}: {
  opportunity: ProductOpportunity;
  saving: boolean;
  clearing: boolean;
  onSave: (
    productId: string,
    data: {
      status: OpportunityResearchDecisionStatus;
      reason: string;
      nextAction: string | null;
    },
  ) => void;
  onClear: () => void;
  savingActionOutcome: boolean;
  clearingActionOutcome: boolean;
  onSaveActionOutcome: (
    productId: string,
    data: {
      actionId: OpportunityResearchDailyActionId;
      outcome: string;
      completedAt: number;
    },
  ) => void;
  onClearActionOutcome: () => void;
  activeActionContext: ActiveActionContext | null;
}) {
  const decision = opportunity.research?.decision ?? null;
  const review = opportunity.research?.decisionReview ?? null;
  const lastActionOutcome = opportunity.research?.lastActionOutcome ?? null;
  const contextActionId = activeActionContext?.actionId ?? null;
  const [status, setStatus] = useState<OpportunityResearchDecisionStatus>(
    decision?.status ?? 'hold',
  );
  const [reason, setReason] = useState(decision?.reason ?? '');
  const [nextAction, setNextAction] = useState(decision?.nextAction ?? '');
  const [actionId, setActionId] = useState<OpportunityResearchDailyActionId>(
    lastActionOutcome?.actionId ?? contextActionId ?? 'continue_research',
  );
  const [outcome, setOutcome] = useState(lastActionOutcome?.outcome ?? '');
  const [completedDate, setCompletedDate] = useState(() =>
    formatLocalDateInputValue(lastActionOutcome?.completedAt),
  );
  const reasonValue = reason.trim();
  const nextActionValue = nextAction.trim();
  const outcomeValue = outcome.trim();
  const reasonOverLimit =
    reasonValue.length > OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH;
  const nextActionOverLimit =
    nextActionValue.length >
    OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH;
  const outcomeOverLimit =
    outcomeValue.length > OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH;
  const completedAtValue = localDateInputToTimestamp(completedDate);
  const todayDate = formatLocalDateInputValue();
  const completedDateIsFuture =
    completedAtValue !== null && completedDate > todayDate;
  const hasResearchEntry = Boolean(opportunity.research);
  const hasActiveResearchEntry = Boolean(
    opportunity.research && !opportunity.research.archived,
  );
  const selectedActionCompletionCriteria =
    dailyActionCompletionCriteria[actionId];
  const selectedActionOutcomePrompt = dailyActionOutcomePrompts[actionId];
  const selectedActionOutcomeExample = dailyActionOutcomeExamples[actionId];
  const selectedActionOutcomeFrame = dailyActionOutcomeFrames[actionId];
  const selectedDecisionEvidenceFrame = decisionEvidenceFrames[status];
  const hasManualActionContextOverride = Boolean(
    activeActionContext &&
      !lastActionOutcome &&
      actionId !== activeActionContext.actionId,
  );
  const actionContextSemanticLabel =
    activeActionContext && !lastActionOutcome
      ? [
          `工作流行动上下文：${actionContextSourceLabels[activeActionContext.source]}`,
          `预选 ${dailyActionLabels[activeActionContext.actionId]}`,
          hasManualActionContextOverride
            ? `已手动改选，将保存 ${dailyActionLabels[actionId]}`
            : null,
        ]
          .filter(Boolean)
          .join('，')
      : null;
  const decisionSaveDisabled =
    saving || !reasonValue || reasonOverLimit || nextActionOverLimit;
  const decisionSaveBlocker = saving
    ? null
    : !reasonValue
      ? '填写判断依据后可保存决策。'
      : reasonOverLimit
        ? '判断依据超出上限，缩短后可保存决策。'
        : nextActionOverLimit
          ? '下一步超出上限，缩短后可保存决策。'
          : null;
  const actionOutcomeSaveDisabled =
    !hasResearchEntry ||
    !outcomeValue ||
    outcomeOverLimit ||
    completedAtValue === null ||
    completedDateIsFuture ||
    savingActionOutcome ||
    clearingActionOutcome;
  const actionOutcomeSaveBlocker =
    savingActionOutcome || clearingActionOutcome
      ? null
      : !hasResearchEntry
        ? '先加入研究工作台后可记录行动结果。'
        : !outcomeValue
          ? '填写执行结果后可保存行动结果。'
          : outcomeOverLimit
            ? '执行结果超出上限，缩短后可保存行动结果。'
            : completedAtValue === null
              ? '选择有效完成日期后可保存行动结果。'
              : completedDateIsFuture
                ? '完成日期不能晚于今天。'
                : null;
  const snapshotKeyReasonText =
    decision?.snapshot.keyReasons
      .filter((snapshotReason) => snapshotReason.trim())
      .slice(0, 2)
      .map(localizeOpportunityDiagnosticText)
      .join('；') ?? '';
  const snapshotMissingSignalText =
    decision?.snapshot.missingSignals
      ? opportunitySignalListText(decision.snapshot.missingSignals, 4)
      : '';
  const snapshotBusiness = decision?.snapshot.businessSignals ?? null;
  const snapshotBusinessMissingSignalText =
    snapshotBusiness?.missingSignals
      ? opportunitySignalListText(snapshotBusiness.missingSignals, 4)
      : '';
  const snapshotBusinessMetrics = snapshotBusiness?.metrics ?? null;
  const snapshotBusinessMetricItems = snapshotBusinessMetrics
    ? [
        {
          key: 'netMargin',
          label: '净利率',
          value:
            snapshotBusinessMetrics.netMargin === null
              ? null
              : percentValue(snapshotBusinessMetrics.netMargin),
        },
        {
          key: 'roi',
          label: 'ROI',
          value:
            snapshotBusinessMetrics.roi === null
              ? null
              : percentValue(snapshotBusinessMetrics.roi),
        },
        {
          key: 'breakevenSellPrice',
          label: '盈亏平衡价',
          value:
            snapshotBusinessMetrics.breakevenSellPrice === null
              ? null
              : `${snapshotBusinessMetrics.currency} ${snapshotBusinessMetrics.breakevenSellPrice}`,
        },
        {
          key: 'contributionProfitPerUnit',
          label: '单件贡献',
          value:
            snapshotBusinessMetrics.contributionProfitPerUnit === null
              ? null
              : `${snapshotBusinessMetrics.currency} ${snapshotBusinessMetrics.contributionProfitPerUnit}`,
        },
      ].filter(
        (metric): metric is { key: string; label: string; value: string } =>
          metric.value !== null,
      )
    : [];
  const snapshotMarket = decision?.snapshot.marketSignals ?? null;
  const snapshotMarketProviderSourceText =
    snapshotMarket && (snapshotMarket.provider || snapshotMarket.source)
      ? `${snapshotMarket.provider ?? '无'} / ${snapshotMarket.source ?? '无'}`
      : '';
  const snapshotMarketMissingSignalText =
    snapshotMarket?.missingSignals
      ? opportunitySignalListText(snapshotMarket.missingSignals, 4)
      : '';
  const snapshotMarketFactorItems =
    snapshotMarket?.factors
      .filter((factor) => factor.label.trim() || factor.name.trim())
      .slice(0, 2)
      .map((factor) => ({
        key: factor.name,
        label: factor.label || factor.name,
        value: marketValue(factor.rawValue),
        explanation: localizeOpportunityDiagnosticText(factor.explanation),
      })) ?? [];
  const snapshotGate = decision?.snapshot.recommendationGate ?? null;
  const hasSnapshotGateContext = Boolean(
    snapshotGate && hasRecommendationGateContext(snapshotGate),
  );
  const snapshotGateReasonText =
    snapshotGate?.reasons
      .filter((snapshotReason) => snapshotReason.trim())
      .slice(0, 2)
      .map(localizeOpportunityDiagnosticText)
      .join('；') ?? '';
  const snapshotGateSignalText =
    snapshotGate?.signals ? opportunitySignalListText(snapshotGate.signals, 4) : '';
  const snapshotGateNextActionText =
    snapshotGate?.nextActions
      .filter((snapshotAction) => snapshotAction.trim())
      .slice(0, 2)
      .join('；') ?? '';

  return (
    <section className="rounded-card border border-border-subtle bg-canvas p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">
            <CheckCircle2 className="h-3.5 w-3.5" />
            机会决策
          </h3>
          {decision ? (
            <p className="mt-1 text-xs text-fg-muted">
              {formatDecisionTime(decision.decidedAt)} 记录
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Badge variant={decision ? decisionVariant(decision.status) : 'neutral'}>
            {decision ? decisionLabels[decision.status] : '未决策'}
          </Badge>
          <DecisionReviewBadges review={review} includeUndecided />
        </div>
      </div>

      {decision ? (
        <div className="mt-3 rounded-md border border-border-subtle bg-surface px-3 py-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant={decisionVariant(decision.status)}>
              {decisionLabels[decision.status]}
            </Badge>
            <Badge variant={recommendationVariants[decision.snapshot.recommendation]}>
              快照 {decision.snapshot.score.toFixed(1)} ·{' '}
              {recommendationLabels[decision.snapshot.recommendation]}
            </Badge>
            <Badge variant="neutral">
              快照置信度 {Math.round(decision.snapshot.confidence * 100)}%
            </Badge>
          </div>
          <p className="mt-2 text-xs text-fg">
            决策依据 · {decision.reason}
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            快照时间 · {formatDecisionTime(decision.snapshot.capturedAt)}
          </p>
          {decision.nextAction ? (
            <p className="mt-1 text-xs text-fg-muted">
              下一步 · {decision.nextAction}
            </p>
          ) : review?.needsNextAction ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
              <Badge variant="warning">待补下一步</Badge>
              <span>工作流跟进动作未记录</span>
            </div>
          ) : null}
          {snapshotKeyReasonText ? (
            <p className="mt-2 text-xs text-fg-muted">
              快照依据 · {snapshotKeyReasonText}
            </p>
          ) : null}
          {snapshotMissingSignalText ? (
            <p className="mt-1 text-xs text-fg-muted">
              快照缺口 · {snapshotMissingSignalText}
            </p>
          ) : null}
          {snapshotBusiness ? (
            <p className="mt-1 text-xs text-fg-muted">
              快照业务完整度 · {businessCompletenessLabel(snapshotBusiness.completeness)}
            </p>
          ) : null}
          {snapshotBusinessMissingSignalText ? (
            <p className="mt-1 text-xs text-fg-muted">
              快照业务缺口 · {snapshotBusinessMissingSignalText}
            </p>
          ) : null}
          {snapshotBusinessMetricItems.length > 0 ? (
            <div
              className="mt-2 flex flex-wrap gap-2 text-xs text-fg-muted"
              aria-label="决策快照业务指标"
            >
              {snapshotBusinessMetricItems.map((metric) => (
                <span key={metric.key}>
                  快照业务指标 · {metric.label} {metric.value}
                </span>
              ))}
            </div>
          ) : null}
          {snapshotMarket ? (
            <div
              className="mt-2 space-y-1 text-xs text-fg-muted"
              aria-label="决策快照市场"
            >
              <p>快照市场状态 · {marketStatusLabel(snapshotMarket.status)}</p>
              {snapshotMarketProviderSourceText ? (
                <p>快照市场来源 · {snapshotMarketProviderSourceText}</p>
              ) : null}
              {snapshotMarket.confidence !== null ? (
                <p>
                  快照市场置信度 · {Math.round(snapshotMarket.confidence * 100)}%
                </p>
              ) : null}
              {snapshotMarket.freshnessMs !== null ? (
                <p>快照市场新鲜度 · {formatMarketAge(snapshotMarket.freshnessMs)}</p>
              ) : null}
              {snapshotMarketMissingSignalText ? (
                <p>快照市场缺口 · {snapshotMarketMissingSignalText}</p>
              ) : null}
              {snapshotMarketFactorItems.length > 0 ? (
                <div className="mt-2 space-y-1" aria-label="决策快照市场因子">
                  {snapshotMarketFactorItems.map((factor) => (
                    <div key={factor.key}>
                      <p>
                        快照市场因子 · {factor.label} {factor.value}
                      </p>
                      <p>{factor.explanation}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {snapshotGate && hasSnapshotGateContext ? (
            <div
              className="mt-2 space-y-1 text-xs text-fg-muted"
              aria-label="决策快照门控"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span>快照门控</span>
                <Badge variant={recommendationGateVariant(snapshotGate.status)}>
                  {recommendationGateStatusLabel(snapshotGate.status)}
                </Badge>
                {snapshotGate.applied ? (
                  <span>
                    {recommendationLabels[snapshotGate.originalRecommendation]} →{' '}
                    {recommendationLabels[snapshotGate.finalRecommendation]}
                  </span>
                ) : null}
              </div>
              {snapshotGateReasonText ? (
                <p>快照门控原因 · {snapshotGateReasonText}</p>
              ) : null}
              {snapshotGateSignalText ? (
                <p>快照门控信号 · {snapshotGateSignalText}</p>
              ) : null}
              {snapshotGateNextActionText ? (
                <p>快照门控下一步 · {snapshotGateNextActionText}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 rounded-md border border-border-subtle bg-surface px-3 py-2 text-xs text-fg-muted">
        <div className="flex flex-wrap items-center gap-2">
          <DecisionReviewBadges review={review} includeUndecided />
          {review?.hasDecision &&
          review.daysSinceDecision !== null &&
          review.daysSinceDecision !== undefined ? (
            <span>{formatDecisionAge(review.daysSinceDecision)}</span>
          ) : (
            <span>暂无当前决策</span>
          )}
        </div>
        <p className="mt-1">
          决策复盘只影响跟进队列，不改变机会评分、建议、置信度或因子。
        </p>
      </div>

      <div className="mt-3 rounded-md border border-border-subtle bg-surface px-3 py-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 className="text-xs font-semibold text-fg-muted">行动结果</h4>
            {lastActionOutcome ? (
              <p className="mt-1 text-xs text-fg-muted">
                {dailyActionLabels[lastActionOutcome.actionId]} ·{' '}
                {formatDecisionTime(lastActionOutcome.completedAt)} ·{' '}
                {formatActionOutcomeRecency(lastActionOutcome.completedAt)}
              </p>
            ) : hasActiveResearchEntry ? (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                <Badge variant="neutral">待补行动结果</Badge>
                <span>工作流练习证据未记录</span>
              </div>
            ) : (
              <p className="mt-1 text-xs text-fg-muted">
                记录最近一次复盘执行结果
              </p>
            )}
          </div>
          {lastActionOutcome ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={onClearActionOutcome}
              disabled={clearingActionOutcome || savingActionOutcome}
              aria-label="清除行动结果"
            >
              <RotateCcw className="h-4 w-4" />
              {clearingActionOutcome ? '清除中' : '清除'}
            </Button>
          ) : null}
        </div>
        {lastActionOutcome ? (
          <p className="mt-2 text-xs text-fg">{lastActionOutcome.outcome}</p>
        ) : null}
        {activeActionContext && actionContextSemanticLabel ? (
          <div
            className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-border-subtle bg-canvas px-2 py-1.5 text-xs text-fg-muted"
            role="status"
            aria-label={actionContextSemanticLabel}
          >
            <Badge variant="info">工作流行动上下文</Badge>
            <Badge variant="neutral">
              {actionContextSourceLabels[activeActionContext.source]}
            </Badge>
            <span>预选 · {dailyActionLabels[activeActionContext.actionId]}</span>
            {hasManualActionContextOverride ? (
              <>
                <Badge variant="warning">已手动改选</Badge>
                <span>将保存 · {dailyActionLabels[actionId]}</span>
              </>
            ) : null}
          </div>
        ) : null}
        {!lastActionOutcome ? (
          <div
            className="mt-3 flex flex-wrap items-center gap-2 text-xs text-fg-muted"
            aria-label="当前行动结果类型"
          >
            <Badge variant="neutral">当前选择</Badge>
            <span>当前将保存 · {dailyActionLabels[actionId]}</span>
          </div>
        ) : null}
        <div className="mt-3 grid gap-2 md:grid-cols-[180px_180px_1fr]">
          <label className="block text-xs font-medium text-fg-muted">
            行动类型
            <select
              aria-label="选择行动结果类型"
              value={actionId}
              onChange={(event) =>
                setActionId(event.target.value as OpportunityResearchDailyActionId)
              }
              className="mt-1 h-9 w-full rounded-button border border-border bg-canvas px-2 text-sm text-fg"
            >
              {dailyActionIds.map((value) => (
                <option key={value} value={value}>
                  {dailyActionLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-fg-muted">
            完成日期
            <input
              type="date"
              aria-label="选择行动完成日期"
              value={completedDate}
              max={todayDate}
              onChange={(event) => setCompletedDate(event.target.value)}
              className="mt-1 h-9 w-full rounded-button border border-border bg-canvas px-2 text-sm text-fg"
            />
          </label>
          <div className="block text-xs font-medium text-fg-muted">
            <span className="flex items-center justify-between gap-2">
              <label htmlFor="action-outcome-textarea">执行结果</label>
              <EvidenceTextLengthGuidance
                value={outcome}
                max={OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH}
                ariaLabel="行动执行结果字数"
              />
            </span>
            <textarea
              id="action-outcome-textarea"
              aria-label="编辑行动执行结果"
              aria-describedby="action-outcome-evidence-prompt action-outcome-evidence-example"
              value={outcome}
              placeholder={selectedActionOutcomePrompt}
              onChange={(event) => setOutcome(event.target.value)}
              className="mt-1 min-h-16 w-full rounded-button border border-border bg-canvas px-2 py-2 text-sm text-fg"
            />
            <span
              id="action-outcome-evidence-prompt"
              className="mt-1 block text-xs font-normal text-fg-muted"
              aria-label="行动结果证据提示"
            >
              证据提示 · {selectedActionOutcomePrompt}
            </span>
            <span
              id="action-outcome-evidence-example"
              className="mt-1 block text-xs font-normal text-fg-muted"
              aria-label="行动结果证据样例"
            >
              证据样例 · {selectedActionOutcomeExample}
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setOutcome(selectedActionOutcomeFrame)}
                disabled={Boolean(outcomeValue)}
                aria-label={`填入记录框架：${dailyActionLabels[actionId]}`}
                aria-describedby="action-outcome-frame-fill-help"
              >
                <PencilLine className="h-4 w-4" />
                填入记录框架
              </Button>
              <span
                id="action-outcome-frame-fill-help"
                className="text-xs font-normal text-fg-muted"
              >
                空白时可用；填入后仍需手动确认并保存。
              </span>
            </div>
          </div>
        </div>
        <div
          className="mt-3 rounded-md border border-border-subtle bg-canvas px-3 py-2"
          aria-label="行动结果完成定义"
        >
          <p className="text-xs font-semibold text-fg">完成定义</p>
          <p className="mt-1 text-xs text-fg-muted">
            适用行动 · {dailyActionLabels[actionId]}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-fg-muted">
            {selectedActionCompletionCriteria.map((criterion) => (
              <li key={criterion} className="flex gap-1.5">
                <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-success" />
                <span>{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1 text-xs text-fg-muted">
            <p id="action-outcome-save-scope">
              行动结果只作为复盘练习证据，不改变评分或市场/业务信号。
            </p>
            {actionOutcomeSaveBlocker ? (
              <p
                id="action-outcome-save-hint"
                aria-label="行动结果保存提示"
                aria-live="polite"
              >
                {actionOutcomeSaveBlocker}
              </p>
            ) : null}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              onSaveActionOutcome(opportunity.product.id, {
                actionId,
                outcome: outcomeValue,
                completedAt: completedAtValue ?? Date.now(),
              })
            }
            disabled={actionOutcomeSaveDisabled}
            aria-label="保存行动结果"
            aria-describedby={
              actionOutcomeSaveBlocker
                ? 'action-outcome-save-scope action-outcome-save-hint'
                : 'action-outcome-save-scope'
            }
          >
            <Save className="h-4 w-4" />
            {savingActionOutcome ? '保存中' : '保存结果'}
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-button border border-border">
        {(['go', 'hold', 'no_go'] as OpportunityResearchDecisionStatus[]).map(
          (value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={cn(
                'h-9 border-r border-border text-xs font-medium last:border-r-0',
                status === value
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface text-fg-muted hover:bg-subtle',
              )}
              aria-label={`选择${decisionLabels[value]}决策`}
            >
              {decisionLabels[value]}
            </button>
          ),
        )}
      </div>

      <div className="mt-3 block text-xs font-medium text-fg-muted">
        <span className="flex items-center justify-between gap-2">
          <label htmlFor="decision-reason-textarea">判断依据</label>
          <EvidenceTextLengthGuidance
            value={reason}
            max={OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH}
            ariaLabel="决策依据字数"
          />
        </span>
        <textarea
          id="decision-reason-textarea"
          aria-label="编辑机会决策依据"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1 min-h-20 w-full rounded-button border border-border bg-surface px-2 py-2 text-sm text-fg"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setReason(selectedDecisionEvidenceFrame)}
            disabled={Boolean(reasonValue)}
            aria-label={`填入决策框架：${decisionLabels[status]}`}
            aria-describedby="decision-evidence-frame-fill-help"
          >
            <PencilLine className="h-4 w-4" />
            填入决策框架
          </Button>
          <span
            id="decision-evidence-frame-fill-help"
            className="text-xs font-normal text-fg-muted"
          >
            空白时可用；填入后仍需手动确认并保存。
          </span>
        </div>
      </div>
      <label className="mt-3 block text-xs font-medium text-fg-muted">
        <span className="flex items-center justify-between gap-2">
          <span>下一步</span>
          <EvidenceTextLengthGuidance
            value={nextAction}
            max={OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH}
            ariaLabel="决策下一步字数"
          />
        </span>
        <input
          aria-label="编辑机会决策下一步"
          value={nextAction}
          onChange={(event) => setNextAction(event.target.value)}
          className="mt-1 h-9 w-full rounded-button border border-border bg-surface px-2 text-sm text-fg"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1 text-xs text-fg-muted">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {decision
                ? `证据快照 ${formatDecisionTime(decision.snapshot.capturedAt)}`
                : '保存时记录当前评分快照'}
            </span>
          </div>
          {decisionSaveBlocker ? (
            <p aria-label="机会决策保存提示" aria-live="polite">
              {decisionSaveBlocker}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {decision ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={onClear}
              disabled={clearing || saving}
              aria-label="清除机会决策"
            >
              <RotateCcw className="h-4 w-4" />
              {clearing ? '清除中' : '清除'}
            </Button>
          ) : null}
          <Button
            size="sm"
            onClick={() =>
              onSave(opportunity.product.id, {
                status,
                reason: reasonValue,
                nextAction: nextActionValue ? nextActionValue : null,
              })
            }
            disabled={decisionSaveDisabled}
            aria-label="保存机会决策"
          >
            <Save className="h-4 w-4" />
            {saving ? '保存中' : '保存决策'}
          </Button>
        </div>
      </div>
    </section>
  );
}

function decisionVariant(
  status: OpportunityResearchDecisionStatus,
): 'success' | 'warning' | 'neutral' {
  if (status === 'go') return 'success';
  if (status === 'hold') return 'warning';
  return 'neutral';
}

function formatDecisionTime(value: number): string {
  return new Date(value).toLocaleString();
}

function formatActionOutcomeRecency(value: number, now: number = Date.now()): string {
  const completedDate = new Date(value);
  const nowDate = new Date(now);
  const completedDay = new Date(
    completedDate.getFullYear(),
    completedDate.getMonth(),
    completedDate.getDate(),
  ).getTime();
  const today = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate(),
  ).getTime();
  const days = Math.max(
    0,
    Math.floor((today - completedDay) / (24 * 60 * 60 * 1000)),
  );

  if (days === 0) return '今天完成';
  if (days === 1) return '昨天完成';
  return `${days} 天前完成`;
}

function formatDecisionAge(daysSinceDecision: number): string {
  if (daysSinceDecision <= 0) return '今天决策';
  if (daysSinceDecision === 1) return '昨天决策';
  return `${daysSinceDecision} 天前决策`;
}

function formatLocalDateInputValue(value: number = Date.now()): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localDateInputToTimestamp(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const timestamp = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  ).getTime();
  if (Number.isNaN(timestamp)) return null;
  return formatLocalDateInputValue(timestamp) === value ? timestamp : null;
}

function DecisionReviewBadges({
  review,
  includeUndecided = false,
}: {
  review?: OpportunityResearchDecisionReview | null;
  includeUndecided?: boolean;
}) {
  const badges = decisionReviewBadges(review, includeUndecided);
  if (!badges.length) return null;

  return (
    <>
      {badges.map((badge) => (
        <Badge key={badge.label} variant={badge.variant}>
          {badge.label}
        </Badge>
      ))}
    </>
  );
}

function decisionReviewBadges(
  review: OpportunityResearchDecisionReview | null | undefined,
  includeUndecided = false,
): Array<{ label: string; variant: 'warning' | 'error' | 'neutral' }> {
  if (!review?.hasDecision) {
    return includeUndecided ? [{ label: '未决策', variant: 'neutral' }] : [];
  }

  const badges: Array<{ label: string; variant: 'warning' | 'error' | 'neutral' }> = [];
  if (review.needsNextAction) {
    badges.push({ label: '待下一步', variant: 'warning' });
  }
  if (review.stale) {
    badges.push({ label: '需复盘', variant: 'error' });
  }

  return badges;
}

function ResearchSummary({
  research,
}: {
  research?: ProductOpportunity['research'];
}) {
  if (!research) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed border-border-subtle px-3 py-2 text-xs text-fg-muted">
        <Tags className="h-3.5 w-3.5" />
        <span>未加入研究工作台</span>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-border-subtle bg-surface px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant={research.archived ? 'neutral' : 'info'}>
          {researchStatusLabels[research.status]}
        </Badge>
        <Badge variant={research.priority === 'high' ? 'warning' : 'neutral'}>
          优先级 {researchPriorityLabels[research.priority]}
        </Badge>
        {research.decision ? (
          <Badge variant={decisionVariant(research.decision.status)}>
            决策 {decisionLabels[research.decision.status]}
          </Badge>
        ) : null}
        <DecisionReviewBadges review={research.decisionReview} />
        {research.tags.map((tag) => (
          <Badge key={tag} variant="neutral">
            #{tag}
          </Badge>
        ))}
      </div>
      {research.notesSummary ? (
        <p className="mt-2 line-clamp-2 text-xs text-fg-muted">
          {research.notesSummary}
        </p>
      ) : null}
      {research.decision ? (
        <p className="mt-2 line-clamp-2 text-xs text-fg-muted">
          决策依据 · {research.decision.reason}
        </p>
      ) : null}
      {research.decision &&
      research.decisionReview?.daysSinceDecision !== null &&
      research.decisionReview?.daysSinceDecision !== undefined ? (
        <p className="mt-2 text-xs text-fg-muted">
          决策时间 ·{' '}
          {formatDecisionAge(research.decisionReview.daysSinceDecision)}
        </p>
      ) : null}
      {research.decision?.nextAction ? (
        <p className="mt-2 line-clamp-2 text-xs text-fg-muted">
          下一步 · {research.decision.nextAction}
        </p>
      ) : null}
      {research.lastActionOutcome ? (
        <div className="mt-2 space-y-1 text-xs text-fg-muted">
          <p className="line-clamp-2">
            行动结果 · {dailyActionLabels[research.lastActionOutcome.actionId]} ·{' '}
            {formatActionOutcomeRecency(research.lastActionOutcome.completedAt)}：{' '}
            {research.lastActionOutcome.outcome}
          </p>
          <p>完成时间 · {formatDecisionTime(research.lastActionOutcome.completedAt)}</p>
        </div>
      ) : !research.archived ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
          <Badge variant="neutral">待补行动结果</Badge>
          <span>工作流练习证据未记录</span>
        </div>
      ) : null}
    </div>
  );
}

function ResearchEditor({
  opportunity,
  saving,
  onSave,
  onAdd,
}: {
  opportunity: ProductOpportunity;
  saving: boolean;
  onSave: (
    productId: string,
    data: {
      status: OpportunityResearchStatus;
      priority: OpportunityResearchPriority;
      tags: string[];
      notes: string | null;
    },
  ) => void;
  onAdd: () => void;
}) {
  const research = opportunity.research;
  const [status, setStatus] = useState<OpportunityResearchStatus>(
    research?.status ?? 'researching',
  );
  const [priority, setPriority] = useState<OpportunityResearchPriority>(
    research?.priority ?? 'medium',
  );
  const [tags, setTags] = useState(research?.tags.join(', ') ?? '');
  const [notes, setNotes] = useState(research?.notes ?? '');

  const normalizedTags = tags
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  if (!research) {
    return (
      <section className="rounded-card border border-dashed border-border-subtle bg-canvas p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
              研究工作台
            </h3>
            <p className="mt-1 text-xs text-fg-muted">
              该商品还没有研究状态、标签或备注。
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={onAdd}
            disabled={saving}
            aria-label="加入研究工作台"
          >
            <Plus className="h-4 w-4" />
            加入
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-border-subtle bg-canvas p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
          研究工作台
        </h3>
        <Badge variant={research.archived ? 'neutral' : 'info'}>
          {research.archived ? '已归档' : '已加入'}
        </Badge>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-medium text-fg-muted">
          状态
          <select
            aria-label="编辑研究状态"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as OpportunityResearchStatus)
            }
            className="mt-1 h-9 w-full rounded-button border border-border bg-surface px-2 text-sm text-fg"
          >
            <option value="researching">调研中</option>
            <option value="watching">观察</option>
            <option value="ready">准备推进</option>
            <option value="rejected">已排除</option>
          </select>
        </label>
        <label className="text-xs font-medium text-fg-muted">
          优先级
          <select
            aria-label="编辑研究优先级"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as OpportunityResearchPriority)
            }
            className="mt-1 h-9 w-full rounded-button border border-border bg-surface px-2 text-sm text-fg"
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </label>
      </div>
      <label className="mt-3 block text-xs font-medium text-fg-muted">
        标签
        <input
          aria-label="编辑研究标签"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          className="mt-1 h-9 w-full rounded-button border border-border bg-surface px-2 text-sm text-fg"
          placeholder="launch, margin"
        />
      </label>
      <label className="mt-3 block text-xs font-medium text-fg-muted">
        备注
        <textarea
          aria-label="编辑研究备注"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-1 min-h-20 w-full rounded-button border border-border bg-surface px-2 py-2 text-sm text-fg"
        />
      </label>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-fg-muted">
          状态、标签和备注只影响研究工作流，不改变机会评分。
        </p>
        <Button
          size="sm"
          onClick={() =>
            onSave(opportunity.product.id, {
              status,
              priority,
              tags: normalizedTags,
              notes: notes.trim() ? notes : null,
            })
          }
          disabled={saving}
          aria-label="保存研究元数据"
        >
          <Save className="h-4 w-4" />
          {saving ? '保存中' : '保存'}
        </Button>
      </div>
    </section>
  );
}

function ComparisonTable({
  opportunities,
}: {
  opportunities: ProductOpportunity[];
}) {
  return (
    <section className="rounded-card border border-border-subtle bg-surface shadow-e1">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h2 className="text-sm font-semibold text-fg">候选对比</h2>
        <Badge variant="neutral">{opportunities.length} 个商品</Badge>
      </div>
      <div className="overflow-auto">
        <table className="min-w-[1120px] w-full text-left text-sm">
          <thead className="bg-subtle text-xs uppercase tracking-wide text-fg-muted">
            <tr>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">评分</th>
              <th className="px-4 py-3">建议</th>
              <th className="px-4 py-3">研究状态</th>
              <th className="px-4 py-3">决策</th>
              <th className="px-4 py-3">行动结果</th>
              <th className="px-4 py-3">采集</th>
              <th className="px-4 py-3">市场</th>
              <th className="px-4 py-3">业务</th>
              <th className="px-4 py-3">缺失信号</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {opportunities.map((item) => {
              const marketSignals = getMarketSignals(item);
              const businessSignals = getBusinessSignals(item);
              const lastActionOutcome = item.research?.lastActionOutcome ?? null;
              const comparisonDecisionReview = item.research?.decisionReview ?? null;
              const comparisonDecisionAgeText =
                item.research?.decision &&
                comparisonDecisionReview?.daysSinceDecision !== null &&
                comparisonDecisionReview?.daysSinceDecision !== undefined
                  ? formatDecisionAge(comparisonDecisionReview.daysSinceDecision)
                  : '';
              const snapshotGate =
                item.research?.decision?.snapshot.recommendationGate ?? null;
              const hasSnapshotGateContext = snapshotGate
                ? hasRecommendationGateContext(snapshotGate)
                : false;
              const snapshotGateReasonText =
                snapshotGate?.reasons
                  .filter((snapshotReason) => snapshotReason.trim())
                  .slice(0, 2)
                  .map(localizeOpportunityDiagnosticText)
                  .join('；') ?? '';
              const snapshotGateSignalText =
                snapshotGate?.signals
                  ? opportunitySignalListText(snapshotGate.signals, 4)
                  : '';
              const snapshotGateNextActionText =
                snapshotGate?.nextActions
                  .filter((snapshotAction) => snapshotAction.trim())
                  .slice(0, 2)
                  .join('；') ?? '';
              const snapshotKeyReasonText =
                item.research?.decision?.snapshot.keyReasons
                  .filter((snapshotReason) => snapshotReason.trim())
                  .slice(0, 2)
                  .map(localizeOpportunityDiagnosticText)
                  .join('；') ?? '';
              const snapshotMissingSignalText =
                item.research?.decision?.snapshot.missingSignals
                  ? opportunitySignalListText(
                      item.research.decision.snapshot.missingSignals,
                      4,
                    )
                  : '';
              const snapshotBusiness =
                item.research?.decision?.snapshot.businessSignals ?? null;
              const snapshotBusinessMissingSignalText =
                snapshotBusiness?.missingSignals
                  ? opportunitySignalListText(snapshotBusiness.missingSignals, 4)
                  : '';
              const snapshotBusinessMetrics = snapshotBusiness?.metrics ?? null;
              const snapshotBusinessMetricItems = snapshotBusinessMetrics
                ? [
                    {
                      key: 'netMargin',
                      label: '净利率',
                      value:
                        snapshotBusinessMetrics.netMargin === null
                          ? null
                          : percentValue(snapshotBusinessMetrics.netMargin),
                    },
                    {
                      key: 'roi',
                      label: 'ROI',
                      value:
                        snapshotBusinessMetrics.roi === null
                          ? null
                          : percentValue(snapshotBusinessMetrics.roi),
                    },
                    {
                      key: 'breakevenSellPrice',
                      label: '盈亏平衡价',
                      value:
                        snapshotBusinessMetrics.breakevenSellPrice === null
                          ? null
                          : `${snapshotBusinessMetrics.currency} ${snapshotBusinessMetrics.breakevenSellPrice}`,
                    },
                    {
                      key: 'contributionProfitPerUnit',
                      label: '单件贡献',
                      value:
                        snapshotBusinessMetrics.contributionProfitPerUnit === null
                          ? null
                          : `${snapshotBusinessMetrics.currency} ${snapshotBusinessMetrics.contributionProfitPerUnit}`,
                    },
                  ].filter(
                    (
                      metric,
                    ): metric is { key: string; label: string; value: string } =>
                      metric.value !== null,
                  )
                : [];
              const snapshotMarket =
                item.research?.decision?.snapshot.marketSignals ?? null;
              const snapshotMarketProviderSourceText =
                snapshotMarket && (snapshotMarket.provider || snapshotMarket.source)
                  ? `${snapshotMarket.provider ?? '无'} / ${snapshotMarket.source ?? '无'}`
                  : '';
              const snapshotMarketMissingSignalText =
                snapshotMarket?.missingSignals
                  ? opportunitySignalListText(snapshotMarket.missingSignals, 4)
                  : '';
              const snapshotMarketFactorItems =
                snapshotMarket?.factors
                  .filter((factor) => factor.label.trim() || factor.name.trim())
                  .slice(0, 2)
                  .map((factor) => ({
                    key: factor.name,
                    label: factor.label || factor.name,
                    value: marketValue(factor.rawValue),
                    explanation: localizeOpportunityDiagnosticText(factor.explanation),
                  })) ?? [];
              return (
                <tr key={item.product.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-fg">{item.product.title}</p>
                    <p className="mt-1 text-xs text-fg-muted">
                      {item.product.platform} · {item.product.currency}{' '}
                      {item.product.currentPrice ?? '缺失'}
                    </p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {item.score.toFixed(1)}
                    <p className="text-xs text-fg-muted">
                      {Math.round(item.confidence * 100)}%
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={recommendationVariants[item.recommendation]}>
                      {recommendationLabels[item.recommendation]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {item.research ? (
                      <div className="space-y-1">
                        <Badge variant="info">
                          {researchStatusLabels[item.research.status]}
                        </Badge>
                        <p className="text-xs text-fg-muted">
                          {researchPriorityLabels[item.research.priority]} ·{' '}
                          {item.research.tags.join(', ') || '无标签'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-fg-muted">未加入</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.research?.decision ? (
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant={decisionVariant(item.research.decision.status)}>
                            {decisionLabels[item.research.decision.status]}
                          </Badge>
                          <DecisionReviewBadges review={comparisonDecisionReview} />
                          <Badge
                            variant={
                              recommendationVariants[
                                item.research.decision.snapshot.recommendation
                              ]
                            }
                          >
                            快照 {item.research.decision.snapshot.score.toFixed(1)} ·{' '}
                            {
                              recommendationLabels[
                                item.research.decision.snapshot.recommendation
                              ]
                            }
                          </Badge>
                          <Badge variant="neutral">
                            快照置信度{' '}
                            {Math.round(item.research.decision.snapshot.confidence * 100)}%
                          </Badge>
                          {snapshotGate && hasSnapshotGateContext ? (
                            <Badge variant={recommendationGateVariant(snapshotGate.status)}>
                              快照门控 {recommendationGateStatusLabel(snapshotGate.status)}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="line-clamp-2 text-xs text-fg-muted">
                          {item.research.decision.reason}
                        </p>
                        {comparisonDecisionAgeText ? (
                          <p className="text-xs text-fg-muted">
                            决策时间 · {comparisonDecisionAgeText}
                          </p>
                        ) : null}
                        <p className="text-xs text-fg-muted">
                          快照时间 ·{' '}
                          {formatDecisionTime(
                            item.research.decision.snapshot.capturedAt,
                          )}
                        </p>
                        {snapshotKeyReasonText ? (
                          <p className="line-clamp-2 text-xs text-fg-muted">
                            快照依据 · {snapshotKeyReasonText}
                          </p>
                        ) : null}
                        {snapshotMissingSignalText ? (
                          <p className="line-clamp-2 text-xs text-fg-muted">
                            快照缺口 · {snapshotMissingSignalText}
                          </p>
                        ) : null}
                        {snapshotBusiness ? (
                          <p className="text-xs text-fg-muted">
                            快照业务完整度 ·{' '}
                            {businessCompletenessLabel(snapshotBusiness.completeness)}
                          </p>
                        ) : null}
                        {snapshotBusinessMissingSignalText ? (
                          <p className="line-clamp-2 text-xs text-fg-muted">
                            快照业务缺口 · {snapshotBusinessMissingSignalText}
                          </p>
                        ) : null}
                        {snapshotBusinessMetricItems.length > 0 ? (
                          <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-fg-muted">
                            {snapshotBusinessMetricItems.map((metric) => (
                              <span key={metric.key}>
                                快照业务指标 · {metric.label} {metric.value}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {snapshotMarket ? (
                          <div className="space-y-1 text-xs text-fg-muted">
                            <p>快照市场状态 · {marketStatusLabel(snapshotMarket.status)}</p>
                            {snapshotMarketProviderSourceText ? (
                              <p>快照市场来源 · {snapshotMarketProviderSourceText}</p>
                            ) : null}
                            {snapshotMarket.confidence !== null ? (
                              <p>
                                快照市场置信度 ·{' '}
                                {Math.round(snapshotMarket.confidence * 100)}%
                              </p>
                            ) : null}
                            {snapshotMarket.freshnessMs !== null ? (
                              <p>
                                快照市场新鲜度 ·{' '}
                                {formatMarketAge(snapshotMarket.freshnessMs)}
                              </p>
                            ) : null}
                            {snapshotMarketMissingSignalText ? (
                              <p className="line-clamp-2">
                                快照市场缺口 · {snapshotMarketMissingSignalText}
                              </p>
                            ) : null}
                            {snapshotMarketFactorItems.length > 0 ? (
                              <div className="space-y-1">
                                {snapshotMarketFactorItems.map((factor) => (
                                  <p key={factor.key} className="line-clamp-2">
                                    快照市场因子 · {factor.label} {factor.value}
                                    {factor.explanation ? ` · ${factor.explanation}` : ''}
                                  </p>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        {snapshotGate?.applied && hasSnapshotGateContext ? (
                          <p className="text-xs text-fg-muted">
                            快照门控 ·{' '}
                            {recommendationLabels[snapshotGate.originalRecommendation]} →{' '}
                            {recommendationLabels[snapshotGate.finalRecommendation]}
                          </p>
                        ) : null}
                        {snapshotGateReasonText ? (
                          <p className="line-clamp-2 text-xs text-fg-muted">
                            快照门控原因 · {snapshotGateReasonText}
                          </p>
                        ) : null}
                        {snapshotGateSignalText ? (
                          <p className="line-clamp-2 text-xs text-fg-muted">
                            快照门控信号 · {snapshotGateSignalText}
                          </p>
                        ) : null}
                        {snapshotGateNextActionText ? (
                          <p className="line-clamp-2 text-xs text-fg-muted">
                            快照门控下一步 · {snapshotGateNextActionText}
                          </p>
                        ) : null}
                        {item.research.decision.nextAction ? (
                          <p className="line-clamp-2 text-xs text-fg-muted">
                            下一步 · {item.research.decision.nextAction}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-fg-muted">未决策</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lastActionOutcome ? (
                      <div className="space-y-1 text-xs text-fg-muted">
                        <p>
                          {dailyActionLabels[lastActionOutcome.actionId]} ·{' '}
                          {formatActionOutcomeRecency(lastActionOutcome.completedAt)}
                        </p>
                        <p>完成时间 · {formatDecisionTime(lastActionOutcome.completedAt)}</p>
                        <p className="line-clamp-2">{lastActionOutcome.outcome}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-fg-muted">未记录</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-muted">
                    {item.acquisitionHealth.provider ?? '无'}
                    {item.acquisitionHealth.status
                      ? ` · ${item.acquisitionHealth.status}`
                      : ''}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-muted">
                    {marketSignalStatusText(marketSignals)}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-muted">
                    {businessCompletenessLabel(businessSignals.completeness)} · ROI{' '}
                    {percentValue(businessSignals.metrics?.roi ?? null)}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-muted">
                    {opportunitySignalListText(item.missingSignals, 4) || '无'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border-subtle px-4 py-3 text-xs text-fg-muted">
        对比中的市场趋势和业务指标仍是代理信号或商家假设，不是已验证销量、需求、利润率或 ROI。
      </p>
    </section>
  );
}

function ScorePill({ score, confidence }: { score: number; confidence: number }) {
  return (
    <div className="flex flex-shrink-0 flex-col items-end">
      <span className="text-xl font-bold tabular-nums text-fg">{score.toFixed(1)}</span>
      <span className="text-xs text-fg-muted">{Math.round(confidence * 100)}%</span>
    </div>
  );
}

function InfoTerm({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-fg-muted">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-fg">{value}</dd>
    </div>
  );
}

function percentValue(value: number | null): string {
  return value === null ? '缺失' : `${(value * 100).toFixed(1)}%`;
}

function getMarketSignals(
  opportunity: ProductOpportunity,
): OpportunityMarketSignalSummary {
  return (
    opportunity.marketSignals ?? {
      status: 'missing',
      provider: null,
      source: null,
      confidence: null,
      freshnessMs: null,
      missingSignals: ['market_trend'],
      caveat:
        'Keepa market signals are historical trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.',
      factors: [],
    }
  );
}

function getBusinessSignals(opportunity: ProductOpportunity) {
  return (
    opportunity.businessSignals ?? {
      completeness: 'none',
      missingSignals: ['costBasis', 'shipping', 'fees', 'advertisingCost'],
      metrics: null,
      caveat:
        'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
    }
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function deriveAcquisitionOperationalState(
  diagnostics?: AcquisitionProductJobDiagnostics,
): AcquisitionOperationalState {
  if (!diagnostics) {
    return {
      kind: 'unknown',
      label: '读取中',
      detail: '正在读取采集 job diagnostics。',
      retryable: false,
      delayed: false,
    };
  }

  const job = diagnostics.job;
  const gate = diagnostics.providerGate;
  const caveat = diagnostics.caveat;

  if (job?.retryable) {
    return {
      kind: 'retryable',
      label: '可重试',
      detail: `${job.status} job 可从产品详情页 retry，历史 attempts 会保留。`,
      retryable: true,
      delayed: false,
      caveat,
    };
  }

  if (gate && gate.status !== 'open') {
    return {
      kind: 'delayed',
      label: 'provider gate',
      detail: `${gate.provider} ${humanizeOperationKey(gate.status)}${
        gate.resetAt ? `，预计 ${formatOperationTime(gate.resetAt)} 后重试` : ''
      }。`,
      retryable: false,
      delayed: true,
      caveat,
    };
  }

  if (job?.delayReason || job?.status === 'retry_scheduled') {
    return {
      kind: 'delayed',
      label: '延迟采集',
      detail: job.delayReason
        ? humanizeOperationKey(job.delayReason)
        : `retry scheduled at ${formatOperationTime(job.nextRunAt)}`,
      retryable: false,
      delayed: true,
      caveat,
    };
  }

  if (job?.status === 'running') {
    return {
      kind: 'running',
      label: '运行中',
      detail: job.leaseOwner
        ? `worker ${job.leaseOwner} 正在处理，lease 到 ${formatOperationTime(job.leaseExpiresAt)}。`
        : 'job 已被 worker claim，正在处理。',
      retryable: false,
      delayed: false,
      caveat,
    };
  }

  if (!job) {
    return {
      kind: 'no_history',
      label: '无 job',
      detail: '暂无该商品的采集 job 历史。',
      retryable: false,
      delayed: false,
      caveat,
    };
  }

  return {
    kind: 'healthy',
    label: job.status === 'succeeded' ? '已完成' : '可执行',
    detail: `${job.status} · attempts ${job.attemptCount}/${job.maxAttempts}`,
    retryable: false,
    delayed: false,
    caveat,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function matchesAcquisitionOperationalFilter(
  state: AcquisitionOperationalState | undefined,
  filter: AcquisitionOperationalFilter,
): boolean {
  if (filter === 'all') return true;
  if (!state) return false;
  if (filter === 'delayed') return state.delayed;
  return state.retryable;
}

function operationalStateBadge(
  kind: AcquisitionOperationalStateKind,
): 'success' | 'warning' | 'neutral' | 'error' | 'info' {
  if (kind === 'healthy') return 'success';
  if (kind === 'delayed') return 'warning';
  if (kind === 'retryable') return 'error';
  if (kind === 'running') return 'info';
  return 'neutral';
}

function humanizeOperationKey(value: string): string {
  return value.replace(/_/g, ' ');
}

function formatOperationTime(value: number | null | undefined): string {
  if (!value) return '未知时间';
  return new Date(value).toLocaleString();
}

function marketSignalStatusVariant(
  status: OpportunityMarketSignalSummary['status'],
): 'success' | 'warning' | 'neutral' | 'error' {
  if (status === 'fresh') return 'success';
  if (status === 'stale') return 'warning';
  if (status === 'failed') return 'error';
  return 'neutral';
}

function marketSignalStatusText(
  summary: OpportunityMarketSignalSummary,
): string {
  if (summary.status === 'fresh') {
    return `${summary.provider ?? 'keepa'} · ${formatMarketAge(summary.freshnessMs)}`;
  }
  if (summary.status === 'stale') {
    return `${marketStatusLabel(summary.status)} · ${formatMarketAge(summary.freshnessMs)}`;
  }
  if (summary.status === 'failed') return marketStatusLabel(summary.status);
  return '缺失';
}

function formatMarketAge(value: number | null): string {
  if (value === null) return '缺失';
  const minutes = Math.round(value / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function marketValue(value: number | string | boolean | null): string {
  if (value === null) return '缺失';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return String(value);
}
