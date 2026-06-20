import { useMemo, useState, type ReactNode } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  Archive,
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  GitCompare,
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
import {
  useArchiveOpportunityResearch,
  useCompareOpportunityResearch,
  useExportOpportunityResearch,
  useOpportunities,
  useProductOpportunity,
  useUpsertOpportunityResearch,
} from '@/hooks/useOpportunities';
import {
  useCheckProductNow,
  useRefreshProductMarketSignals,
} from '@/hooks/useProducts';
import type {
  AcquisitionProductJobDiagnostics,
  BusinessReadiness,
  OpportunityMarketSignalSummary,
  OpportunityRecommendation,
  OpportunityResearchPriority,
  OpportunityResearchStatus,
  ProductOpportunity,
} from '@/types';
import { scraperApi, type OpportunityFilters } from '@/services/api';
import { cn } from '@/lib/utils';

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

export function Opportunities() {
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
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [exportMessage, setExportMessage] = useState('');

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
      sortBy: 'score',
      sortOrder,
      limit: 30,
    }),
    [
      businessReadiness,
      minRoi,
      minScore,
      platform,
      recommendation,
      researchStatus,
      researchTag,
      shortlistedOnly,
      sortOrder,
    ]
  );

  const opportunitiesQuery = useOpportunities(filters);
  const opportunities = opportunitiesQuery.data?.data ?? [];
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
  const upsertResearch = useUpsertOpportunityResearch();
  const archiveResearch = useArchiveOpportunityResearch();
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

  const handleCompare = () => {
    if (comparisonIds.length > 0 && comparisonIds.length <= compareLimit) {
      compareResearch.mutate({ productIds: comparisonIds });
    }
  };

  const hasExportFilter = shortlistedOnly || Boolean(researchStatus || researchTag);
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
    <div className="flex h-full min-h-0 flex-col gap-5">
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
            : `${visibleOpportunities.length}/${opportunities.length} 个候选`}
        </div>
      </header>

      <section className="flex flex-wrap items-end gap-3 rounded-card border border-border-subtle bg-surface p-4 shadow-e1">
        <FilterField label="建议">
          <select
            aria-label="推荐动作筛选"
            value={recommendation}
            onChange={(event) => setRecommendation(event.target.value)}
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
            onChange={(event) => setPlatform(event.target.value)}
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
            onChange={(event) => setMinScore(event.target.value)}
            className="h-10 w-24 rounded-button border border-border bg-surface px-3 text-sm text-fg"
          />
        </FilterField>
        <FilterField label="业务完整度">
          <select
            aria-label="业务完整度筛选"
            value={businessReadiness}
            onChange={(event) => setBusinessReadiness(event.target.value as BusinessReadiness)}
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
            onChange={(event) =>
              setOperationalFilter(event.target.value as AcquisitionOperationalFilter)
            }
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
            onChange={(event) => setMinRoi(event.target.value)}
            className="h-10 w-28 rounded-button border border-border bg-surface px-3 text-sm text-fg"
          />
        </FilterField>
        <FilterField label="排序">
          <div className="inline-flex h-10 overflow-hidden rounded-button border border-border">
            <button
              type="button"
              onClick={() => setSortOrder('desc')}
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
              onClick={() => setSortOrder('asc')}
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
            onChange={(event) => setResearchStatus(event.target.value)}
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
            onChange={(event) => setResearchTag(event.target.value)}
            className="h-10 w-28 rounded-button border border-border bg-surface px-3 text-sm text-fg"
            placeholder="launch"
          />
        </FilterField>
        <label className="flex h-10 items-center gap-2 rounded-button border border-border px-3 text-sm font-medium text-fg-muted">
          <input
            aria-label="只看研究工作台"
            type="checkbox"
            checked={shortlistedOnly}
            onChange={(event) => setShortlistedOnly(event.target.checked)}
          />
          只看工作台
        </label>
        <SlidersHorizontal className="ml-auto hidden h-5 w-5 text-fg-muted sm:block" />
      </section>

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

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-h-0 overflow-hidden rounded-card border border-border-subtle bg-surface shadow-e1">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <h2 className="text-sm font-semibold text-fg">机会排行</h2>
            <span className="text-xs text-fg-muted">按当前筛选计算</span>
          </div>
          <div className="h-full min-h-0 overflow-auto p-3">
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
                <p className="mt-1 text-sm text-fg-muted">调整筛选条件或先补充采集数据。</p>
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
          operations={selectedOperations}
          savingResearch={upsertResearch.isPending}
          onSaveResearch={handleSaveResearch}
          onAddResearch={handleAddResearch}
        />
      </div>
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

function OpportunityRow({
  opportunity,
  operations,
  selected,
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
          business {businessSignals.completeness}
        </Badge>
        <Badge variant={marketSignalStatusVariant(marketSignals.status)}>
          market {marketSignals.status}
        </Badge>
        {businessSignals.missingSignals.slice(0, 3).map((signal) => (
          <Badge key={signal} variant="warning">
            {signal}
          </Badge>
        ))}
        {marketSignals.missingSignals.slice(0, 2).map((signal) => (
          <Badge key={signal} variant="warning">
            {signal}
          </Badge>
        ))}
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-fg-muted">
        {opportunity.keyReasons[0] ?? '暂无关键原因'}
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
  operations,
  savingResearch,
  onSaveResearch,
  onAddResearch,
}: {
  opportunity?: ProductOpportunity;
  loading: boolean;
  checking: boolean;
  onCheckNow: () => void;
  refreshingMarketSignals: boolean;
  onRefreshMarketSignals: () => void;
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
    <aside className="min-h-0 overflow-auto rounded-card border border-border-subtle bg-surface shadow-e1">
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
        <ResearchEditor
          key={`research-${opportunity.product.id}-${opportunity.research?.id ?? 'new'}`}
          opportunity={opportunity}
          saving={savingResearch}
          onSave={onSaveResearch}
          onAdd={() => onAddResearch(opportunity.product.id)}
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
                <span>{reason}</span>
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
                <p className="mt-2 text-xs text-fg-muted">{factor.explanation}</p>
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
              label="Completeness"
              value={businessSignals.completeness}
            />
            <InfoTerm
              label="Net margin"
              value={percentValue(businessSignals.metrics?.netMargin ?? null)}
            />
            <InfoTerm
              label="ROI"
              value={percentValue(businessSignals.metrics?.roi ?? null)}
            />
            <InfoTerm
              label="Breakeven"
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
              {marketSignals.status}
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
                  <p className="mt-1 text-xs text-fg-muted">{factor.explanation}</p>
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
                  {signal}
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
                {signal}
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
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="bg-subtle text-xs uppercase tracking-wide text-fg-muted">
            <tr>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">评分</th>
              <th className="px-4 py-3">建议</th>
              <th className="px-4 py-3">研究状态</th>
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
                    {businessSignals.completeness} · ROI{' '}
                    {percentValue(businessSignals.metrics?.roi ?? null)}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-muted">
                    {item.missingSignals.slice(0, 4).join(', ') || '无'}
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
    return `stale · ${formatMarketAge(summary.freshnessMs)}`;
  }
  if (summary.status === 'failed') return 'failed';
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
