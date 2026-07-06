import { useMemo, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  ExternalLink,
  PauseCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Server,
  Tags,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import {
  useAcquisitionQueueHealth,
  useCancelAcquisitionJob,
  useCheckProductNow,
  useProduct,
  useProductAcquisitionAttempts,
  useProductBusinessSignals,
  useProductJobDiagnostics,
  useProductMarketSignalHistory,
  useProductMarketSignalLatest,
  useProviderHealth,
  useKeepaMarketSignalHealth,
  useRefreshProductMarketSignals,
  useRetryAcquisitionJob,
  useUpsertProductBusinessSignals,
} from '@/hooks/useProducts';
import {
  useProductOpportunity,
  useUpsertOpportunityResearch,
} from '@/hooks/useOpportunities';
import { usePriceStats, usePriceSnapshots, useCreateSnapshot } from '@/hooks/usePriceStats';
import { ManualReadingForm } from '@/components/products/ManualReadingForm';
import { PriceTrendChart } from '@/components/products/PriceTrendChart';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
  Availability,
  AcquisitionProductJobDiagnostics,
  AcquisitionQueueHealth,
  MarketSignalProviderHealth,
  MarketSignalRefreshResult,
  MarketSignalSnapshot,
  OpportunityResearchPriority,
  OpportunityResearchStatus,
  OpportunityResearchDecision,
  OpportunityFactor,
  PriceSnapshot,
  PriceSnapshotSource,
  ProviderHealthResponse,
  ProductBusinessSignalUpsert,
  ScrapeAttempt,
  ScrapeResult,
} from '@/types';
import type { MarketSignalLatestResponse } from '@/services/api';

const availabilityBadge: Record<Availability, 'success' | 'warning' | 'error'> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'error',
};

// 数据来源标签：让用户一眼看出每条读数从哪来、可不可信
const sourceLabels: Record<PriceSnapshotSource, string> = {
  manual: '手动录入',
  browser: '浏览器抓取',
  cache: '缓存',
  keepa: 'Keepa',
  rainforest: 'Rainforest',
  'ebay-browse': 'eBay',
  unknown: '未知来源',
};

// manual 视为高可信（用户亲眼录入），cache/unknown 低可信
const sourceBadge: Record<PriceSnapshotSource, 'success' | 'warning' | 'neutral' | 'info'> = {
  manual: 'success',
  rainforest: 'success',
  keepa: 'success',
  'ebay-browse': 'success',
  browser: 'info',
  cache: 'warning',
  unknown: 'neutral',
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

const recommendationDisplayLabels: Record<string, string> = {
  investigate: '重点研究',
  watch: '持续观察',
  check_data: '补充数据',
  ignore: '暂不处理',
};

const businessCompletenessLabels: Record<'none' | 'partial' | 'complete', string> = {
  none: '未填写',
  partial: '部分',
  complete: '完整',
};

const productDetailSignalLabels: Record<string, string> = {
  costBasis: '单件成本',
  inboundShipping: '头程运费',
  outboundShipping: '出库运费',
  fulfillmentFee: '履约费',
  platformFee: '平台固定费',
  referralFeeRate: '佣金比例',
  advertisingCost: '广告成本',
  taxCustomsBuffer: '税费/关税缓冲',
  targetSellPrice: '目标售价',
  targetUnits: '目标销量',
  shipping: '运费',
  fees: '费用',
  price_history: '价格历史',
  price_trend: '价格趋势',
  volatility: '价格波动',
  acquisition_history: '采集历史',
  review_proxy: '评分/评论代理',
  profit_margin: '利润率',
  market_history: '市场历史',
  market_trend: '市场趋势',
  sales_volume: '销量',
  demand: '需求',
};

const businessMetricsCaveat =
  '业务指标基于商家输入假设计算，不是平台验证的销量、需求或利润事实。';

function productDetailSignalLabel(signal: string): string {
  const businessKey = signal.startsWith('business_')
    ? signal.slice('business_'.length)
    : signal;

  return productDetailSignalLabels[signal] ?? productDetailSignalLabels[businessKey] ?? signal;
}

const productDetailKnownSignalTokens = [
  ...Object.keys(productDetailSignalLabels),
  ...Object.keys(productDetailSignalLabels).map((signal) => `business_${signal}`),
].sort((a, b) => b.length - a.length);

function localizeProductDetailDiagnosticText(text: string): string {
  const withReadableMissingSignals = text.replace(
    /Missing signals:\s*([^.]+)\./g,
    (_match, signals: string) => {
      const labels = signals
        .split(',')
        .map((signal) => signal.trim())
        .filter(Boolean)
        .map(productDetailSignalLabel);

      return `缺失信号：${labels.join('、')}。`;
    },
  );

  return productDetailKnownSignalTokens.reduce(
    (localized, signal) => localized.split(signal).join(productDetailSignalLabel(signal)),
    withReadableMissingSignals,
  );
}

function isFirstSetupRouteState(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as { fromProductCreate?: unknown }).fromProductCreate === true
  );
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['products', 'common']);
  const [startedFromProductCreate] = useState(() => isFirstSetupRouteState(location.state));
  const [firstSetupDismissed, setFirstSetupDismissed] = useState(false);

  const { data: product, isLoading: pl } = useProduct(id!);
  const { data: stats, isLoading: sl } = usePriceStats(id!);
  const { data: snapshots, isLoading: snl } = usePriceSnapshots(id!, 30);
  const { data: attempts } = useProductAcquisitionAttempts(id!, 10);
  const { data: jobDiagnostics } = useProductJobDiagnostics(id);
  const { data: businessSignals } = useProductBusinessSignals(id);
  const { data: productOpportunity } = useProductOpportunity(id);
  const { data: marketSignalLatest } = useProductMarketSignalLatest(id);
  const { data: marketSignalHistory } = useProductMarketSignalHistory(id, 5);
  const { data: marketSignalHealth } = useKeepaMarketSignalHealth(id, 24);
  const { data: providerHealth } = useProviderHealth(
    product?.platform,
    product?.id,
    24,
  );
  const { data: queueHealth } = useAcquisitionQueueHealth({
    platform: product?.platform,
  });
  const checkNow = useCheckProductNow();
  const createSnapshot = useCreateSnapshot(id!);
  const refreshMarketSignals = useRefreshProductMarketSignals();
  const retryJob = useRetryAcquisitionJob();
  const cancelJob = useCancelAcquisitionJob();
  const upsertResearch = useUpsertOpportunityResearch();

  if (pl || sl || snl) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-skeleton rounded-button" />
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-skeleton rounded-card" />
          ))}
        </div>
        <div className="h-80 animate-skeleton rounded-card" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => navigate('/products')} label={t('backToProducts')} />
        <div className="rounded-card border border-border-subtle bg-surface p-16 text-center shadow-e1">
          <h3 className="text-base font-semibold text-fg">{t('notFoundTitle')}</h3>
          <p className="mb-6 mt-1 text-sm text-fg-muted">{t('notFoundDesc')}</p>
          <Link to="/products">
            <Button>{t('backToProducts')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const priceChange = stats?.priceChange ?? 0;
  const pct = stats?.priceChangePercent ?? 0;
  const up = priceChange > 0;
  const down = priceChange < 0;
  const latestResult = checkNow.data;
  const showFirstSetupGuide = startedFromProductCreate && !firstSetupDismissed;
  const hasPriceReadings = (stats?.dataPoints ?? 0) > 0;

  const columns: Column<PriceSnapshot>[] = [
    {
      key: 'timestamp',
      header: t('table.dateTime'),
      render: (s) => <span className="tabular-nums">{formatDateTime(s.timestamp)}</span>,
    },
    {
      key: 'price',
      header: t('table.price'),
      render: (s) => (
        <span className="font-semibold tabular-nums text-fg">
          {formatCurrency(s.price, product.currency)}
        </span>
      ),
    },
    {
      key: 'availability',
      header: t('table.availability'),
      render: (s) => (
        <Badge variant={availabilityBadge[s.availability]}>{t(`availability.${s.availability}`)}</Badge>
      ),
    },
    {
      key: 'source',
      header: '来源',
      render: (s) => {
        const source = (s.source ?? 'unknown') as PriceSnapshotSource;
        return (
          <Badge variant={sourceBadge[source] ?? 'neutral'}>
            {sourceLabels[source] ?? source}
          </Badge>
        );
      },
    },
    {
      key: 'rating',
      header: t('table.rating'),
      align: 'right',
      render: (s) =>
        s.rating != null ? (
          <span className="tabular-nums">
            {s.rating.toFixed(1)} ⭐
            {s.reviewCount ? <span className="ml-1 text-fg-subtle">({s.reviewCount})</span> : null}
          </span>
        ) : (
          <span className="text-fg-subtle">{t('common:na')}</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <BackButton onClick={() => navigate('/products')} label={t('backToProducts')} />

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="neutral" className="capitalize">
              {product.platform}
            </Badge>
            {product.isMonitoring && (
              <Badge variant="success" dot>
                {t('live')}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{product.title}</h1>
          {product.brand && (
            <p className="mt-1 text-sm text-fg-muted">
              {t('brand')}: {product.brand}
            </p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">
              <ExternalLink className="h-4 w-4" />
              {t('viewProduct')}
            </Button>
          </a>
          <Button
            onClick={() => checkNow.mutate(product.id)}
            disabled={checkNow.isPending}
          >
            <RefreshCw
              className={cn('h-4 w-4', checkNow.isPending && 'animate-spin')}
            />
            {t('checkNow')}
          </Button>
        </div>
      </div>

      {showFirstSetupGuide ? (
        <FirstResearchSetupGuide onDismiss={() => setFirstSetupDismissed(true)} />
      ) : null}

      <ProductResearchCard
        research={productOpportunity?.research}
        score={productOpportunity?.score}
        recommendation={productOpportunity?.recommendation}
        isSaving={upsertResearch.isPending}
        onAdd={() =>
          upsertResearch.mutate({
            productId: product.id,
            data: {
              status: 'researching',
              priority: 'medium',
              tags: [],
              notes: null,
              archived: false,
            },
          })
        }
      />

      {productOpportunity ? (
        <ScoreBreakdownCard
          score={productOpportunity.score}
          confidence={productOpportunity.confidence}
          recommendation={productOpportunity.recommendation}
          keyReasons={productOpportunity.keyReasons}
          factors={productOpportunity.factors}
          missingSignals={productOpportunity.missingSignals}
        />
      ) : null}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {/* 当前价携带来源溯源：录入即更新，并明确标注来源与是否可能过时，绝不让旧数据伪装成已验证事实 */}
          <Card className="p-6 hover:shadow-e2">
            <p className="truncate text-[13px] font-medium text-fg-muted">{t('currentPrice')}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-fg">
              {hasPriceReadings ? formatCurrency(stats.currentPrice, product.currency) : '暂无读数'}
            </p>
            <div className="mt-2">
              <Badge
                variant={
                  stats.provenance.stale
                    ? 'warning'
                    : sourceBadge[stats.provenance.source] ?? 'neutral'
                }
              >
                {stats.provenance.label}
              </Badge>
            </div>
          </Card>
          <Card className="p-6">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-fg-muted">
              {t('priceChange')}
              {up && <TrendingUp className="h-3.5 w-3.5 text-error" />}
              {down && <TrendingDown className="h-3.5 w-3.5 text-success" />}
            </p>
            <p
              className={cn(
                'mt-2 text-3xl font-bold tabular-nums tracking-tight',
                up && 'text-error',
                down && 'text-success',
                !up && !down && 'text-fg',
              )}
            >
              {hasPriceReadings ? (
                <>
                  {up && '+'}
                  {formatCurrency(priceChange, product.currency)}
                </>
              ) : (
                '缺失'
              )}
            </p>
            <p
              className={cn(
                'mt-1 text-sm tabular-nums',
                up && 'text-error',
                down && 'text-success',
                !up && !down && 'text-fg-muted',
              )}
            >
              {hasPriceReadings ? (
                <>
                  {up && '+'}
                  {pct.toFixed(2)}%
                </>
              ) : (
                '缺失'
              )}
            </p>
          </Card>
          <KPICard
            label={t('highestPrice')}
            value={hasPriceReadings ? formatCurrency(stats.highestPrice, product.currency) : '缺失'}
          />
          <KPICard
            label={t('lowestPrice')}
            value={hasPriceReadings ? formatCurrency(stats.lowestPrice, product.currency) : '缺失'}
          />
          <KPICard
            label={t('averagePrice')}
            value={hasPriceReadings ? formatCurrency(stats.averagePrice, product.currency) : '缺失'}
          />
          <KPICard label={t('dataPoints')} value={stats.dataPoints} />
          <Card className="p-6 sm:col-span-2">
            <p className="text-[13px] font-medium text-fg-muted">{t('trackingPeriod')}</p>
            <div className="mt-2 space-y-1 text-sm tabular-nums text-fg">
              <p>
                <span className="text-fg-subtle">{t('common:from')}: </span>
                {hasPriceReadings ? formatDateTime(stats.firstRecordedAt) : '缺失'}
              </p>
              <p>
                <span className="text-fg-subtle">{t('common:to')}: </span>
                {hasPriceReadings ? formatDateTime(stats.lastRecordedAt) : '缺失'}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Chart */}
      {snapshots && <PriceTrendChart snapshots={snapshots} currency={product.currency} />}

      <section id="business-assumptions">
        <BusinessSignalsCard
          productId={product.id}
          currency={product.currency}
          signalResult={businessSignals}
        />
      </section>

      <MarketSignalsCard
        productId={product.id}
        supported={product.platform === 'amazon'}
        latest={marketSignalLatest}
        history={marketSignalHistory ?? []}
        health={marketSignalHealth}
        refreshResult={refreshMarketSignals.data}
        isRefreshing={refreshMarketSignals.isPending}
        refreshError={refreshMarketSignals.error}
        onRefresh={() => refreshMarketSignals.mutate(product.id)}
      />

      <AcquisitionStatusCard
        latestResult={latestResult}
        attempts={attempts ?? []}
        providerHealth={providerHealth}
        isChecking={checkNow.isPending}
        error={checkNow.error}
      />

      <AcquisitionOperationsCard
        diagnostics={jobDiagnostics}
        queueHealth={queueHealth}
        retrying={retryJob.isPending}
        cancelling={cancelJob.isPending}
        controlMessage={retryJob.data?.message ?? cancelJob.data?.message}
        controlError={retryJob.error ?? cancelJob.error}
        onRetry={(jobId) =>
          retryJob.mutate({
            jobId,
            productId: product.id,
            data: { reason: 'operator_retry_from_product_detail' },
          })
        }
        onCancel={(jobId) =>
          cancelJob.mutate({
            jobId,
            productId: product.id,
            data: { reason: 'operator_cancel_from_product_detail' },
          })
        }
      />

      <section id="manual-reading">
        <ManualReadingCard
          currency={product.currency}
          isSaving={createSnapshot.isPending}
          isError={createSnapshot.isError}
          isSuccess={createSnapshot.isSuccess}
          onSubmit={(data) =>
            createSnapshot.mutate({ productId: product.id, ...data })
          }
        />
      </section>

      {/* History table */}
      {snapshots && snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t('priceHistory')}</CardTitle>
            </div>
          </CardHeader>
          <div className="mt-4">
            <DataTable columns={columns} data={snapshots.slice(0, 10)} rowKey={(s) => s.id} />
          </div>
        </Card>
      )}
    </div>
  );
}

function FirstResearchSetupGuide({ onDismiss }: { onDismiss: () => void }) {
  const actionClass =
    'inline-flex h-9 items-center justify-center rounded-button border border-border bg-surface px-3 text-sm font-medium text-fg transition-colors hover:bg-subtle';

  return (
    <div className="rounded-card border border-primary-200 bg-primary-50/60 p-5 shadow-e1">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">刚添加</Badge>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              First setup
            </p>
          </div>
          <h2 className="mt-2 text-base font-semibold text-fg">
            下一步：补齐选品研究基础
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-fg-muted">
            先记录一条你亲眼确认的价格，再填入成本、运费和目标售价。等价格和业务假设都有数据后，再去机会工作台判断是否值得继续推进。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="#manual-reading" className={actionClass}>
              记录首条读数
            </a>
            <a href="#business-assumptions" className={actionClass}>
              填写业务假设
            </a>
            <Link to="/opportunities" className={actionClass}>
              查看机会工作台
            </Link>
          </div>
        </div>
        <button
          type="button"
          aria-label="关闭设置引导"
          onClick={onDismiss}
          className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-button text-fg-muted transition-colors hover:bg-surface hover:text-fg"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// 评分构成（透明）：把后端算出的每个因子的贡献、权重、原始值和解释全部展开，
// 并明确权重是未经校准的启发式，让用户据此判断、可否决，而不是把分数当真值。
function ScoreBreakdownCard({
  score,
  confidence,
  recommendation,
  keyReasons,
  factors,
  missingSignals,
}: {
  score: number;
  confidence: number;
  recommendation: string;
  keyReasons: string[];
  factors: OpportunityFactor[];
  missingSignals: string[];
}) {
  const sortedFactors = [...factors].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution),
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>评分构成（透明）</CardTitle>
          <p className="mt-1 text-sm text-fg-muted">
            评分的权重与归一化系数是人工设定的启发式，未用真实结果校准。请结合下面每个因子的构成自行判断，不要把分数当作已验证的事实或预测。
          </p>
        </div>
        <Badge variant="info">score {score.toFixed(1)}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricTile label="评分" value={score.toFixed(1)} />
          <MetricTile label="置信度" value={`${Math.round(confidence * 100)}%`} />
          <MetricTile
            label="建议"
            value={recommendationDisplayLabels[recommendation] ?? recommendation}
          />
        </div>

        {keyReasons.length > 0 ? (
          <div className="rounded-md border border-border-subtle bg-subtle p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
              关键理由
            </p>
            <ul className="mt-2 space-y-1 text-sm text-fg">
              {keyReasons.map((reason) => (
                <li key={reason}>· {localizeProductDetailDiagnosticText(reason)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-md border border-border-subtle">
          <div className="grid grid-cols-[1fr_64px_56px_64px] gap-2 border-b border-border-subtle bg-subtle px-3 py-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
            <span>因子</span>
            <span className="text-right">贡献</span>
            <span className="text-right">权重</span>
            <span className="text-right">原始值</span>
          </div>
          <div className="divide-y divide-border-subtle">
            {sortedFactors.map((factor) => (
              <div key={factor.name} className="px-3 py-2.5">
                <div className="grid grid-cols-[1fr_64px_56px_64px] items-center gap-2 text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-fg">
                    {factor.direction === 'positive' ? (
                      <TrendingUp className="h-3.5 w-3.5 text-success" />
                    ) : factor.direction === 'negative' ? (
                      <TrendingDown className="h-3.5 w-3.5 text-error" />
                    ) : (
                      <span className="h-3.5 w-3.5 text-center text-fg-subtle">·</span>
                    )}
                    {factor.label}
                  </span>
                  <span className="text-right tabular-nums font-semibold text-fg">
                    {factor.contribution.toFixed(1)}
                  </span>
                  <span className="text-right tabular-nums text-fg-muted">
                    {Math.round(factor.weight * 100)}%
                  </span>
                  <span className="text-right tabular-nums text-fg-muted">
                    {factor.rawValue === null
                      ? '—'
                      : typeof factor.rawValue === 'number'
                        ? factor.rawValue.toLocaleString()
                        : String(factor.rawValue)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-fg-subtle">
                  {localizeProductDetailDiagnosticText(factor.explanation)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {missingSignals.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
              缺失信号（这些没有数据支撑，未计入可信结论）
            </p>
            <div className="flex flex-wrap gap-2">
              {missingSignals.map((signal) => (
                <Badge key={signal} variant="warning">
                  {productDetailSignalLabel(signal)}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ManualReadingCard({
  currency,
  isSaving,
  isError,
  isSuccess,
  onSubmit,
}: {
  currency: string;
  isSaving: boolean;
  isError: boolean;
  isSuccess: boolean;
  onSubmit: Parameters<typeof ManualReadingForm>[0]['onSubmit'];
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>手动录入读数</CardTitle>
          <p className="mt-1 text-sm text-fg-muted">
            把你在商品页 / Keepa 上亲眼看到的价格、排名、评分录进来。系统会标记为
            <span className="mx-1 font-medium text-fg">手动录入</span>
            来源，超过 7 天会提示复核。补录历史读数可指定日期。
          </p>
        </div>
        <Badge variant="success">manual</Badge>
      </CardHeader>
      <CardContent>
        <ManualReadingForm
          currency={currency}
          isSaving={isSaving}
          isError={isError}
          isSuccess={isSuccess}
          onSubmit={onSubmit}
        />
      </CardContent>
    </Card>
  );
}

function ProductResearchCard({
  research,
  score,
  recommendation,
  isSaving,
  onAdd,
}: {
  research?: {
    status: OpportunityResearchStatus;
    priority: OpportunityResearchPriority;
    tags: string[];
    notes: string | null;
    notesSummary: string | null;
    decision: OpportunityResearchDecision | null;
    archived: boolean;
    updatedAt: number;
  };
  score?: number;
  recommendation?: string;
  isSaving: boolean;
  onAdd: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>机会研究状态</CardTitle>
          <p className="mt-1 text-sm text-fg-muted">
            研究状态、优先级、标签和备注只用于工作流，不改变机会评分。
          </p>
        </div>
        {research ? (
          <Badge variant={research.archived ? 'neutral' : 'info'}>
            {research.archived ? '已归档' : researchStatusLabels[research.status]}
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={onAdd}
            disabled={isSaving}
            aria-label="加入研究工作台"
          >
            <Plus className="h-4 w-4" />
            {isSaving ? '加入中' : '加入工作台'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {research ? (
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <MetricTile label="Opportunity score" value={score == null ? '缺失' : score.toFixed(1)} />
              <MetricTile label="Recommendation" value={recommendation ?? '缺失'} />
              <MetricTile
                label="Priority"
                value={researchPriorityLabels[research.priority]}
              />
              <MetricTile
                label="Updated"
                value={formatDateTime(research.updatedAt)}
              />
            </div>
            <div className="rounded-md border border-border-subtle bg-subtle p-4">
              <div className="flex flex-wrap gap-2">
                {research.tags.length > 0 ? (
                  research.tags.map((tag) => (
                    <Badge key={tag} variant="neutral">
                      #{tag}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="neutral">无标签</Badge>
                )}
              </div>
              <p className="mt-3 text-sm text-fg">
                {research.notesSummary ?? research.notes ?? '暂无研究备注'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-md border border-dashed border-border-subtle p-4 text-sm text-fg-muted">
            <Tags className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              该商品还没有加入机会研究工作台。加入后可以在机会工作台中维护状态、优先级、标签和备注。
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BusinessSignalsCard({
  productId,
  currency,
  signalResult,
}: {
  productId: string;
  currency: string;
  signalResult?: {
    assumptions: (ProductBusinessSignalUpsert & {
      productId: string;
      createdAt: number;
      updatedAt: number;
    }) | null;
    metrics: {
      completeness: 'none' | 'partial' | 'complete';
      missingSignals: string[];
      netMargin: number | null;
      grossMargin: number | null;
      roi: number | null;
      breakevenSellPrice: number | null;
      contributionProfitPerUnit: number | null;
      totalVariableCost: number | null;
      priceSource: string;
      caveat: string;
    };
  };
}) {
  const upsert = useUpsertProductBusinessSignals();
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false);

  // 使用 useMemo 计算初始表单值，避免在 effect 中调用 setState
  const initialFormValue = useMemo(() => {
    const assumptions = signalResult?.assumptions;
    if (!assumptions) {
      return {
        currency,
        costBasis: '',
        inboundShipping: '',
        outboundShipping: '',
        fulfillmentFee: '',
        platformFee: '',
        referralFeeRate: '',
        advertisingCost: '',
        taxCustomsBuffer: '',
        targetSellPrice: '',
        targetUnits: '',
        notes: '',
      };
    }

    return {
      currency: assumptions.currency ?? currency,
      costBasis: valueToInput(assumptions.costBasis),
      inboundShipping: valueToInput(assumptions.inboundShipping),
      outboundShipping: valueToInput(assumptions.outboundShipping),
      fulfillmentFee: valueToInput(assumptions.fulfillmentFee),
      platformFee: valueToInput(assumptions.platformFee),
      referralFeeRate: valueToInput(assumptions.referralFeeRate),
      advertisingCost: valueToInput(assumptions.advertisingCost),
      taxCustomsBuffer: valueToInput(assumptions.taxCustomsBuffer),
      targetSellPrice: valueToInput(assumptions.targetSellPrice),
      targetUnits: valueToInput(assumptions.targetUnits),
      notes: assumptions.notes ?? '',
    };
  }, [currency, signalResult?.assumptions]);

  const [form, setForm] = useState<Record<string, string>>(initialFormValue);

  // 当来源数据（货币/业务假设）变化时，将表单同步为新的初始值。
  // 仅依据 useMemo 后 initialFormValue 的引用变化触发，避免每次渲染
  // 把用户正在输入的编辑重置回初始值。
  const [syncedInitial, setSyncedInitial] = useState(initialFormValue);
  if (initialFormValue !== syncedInitial) {
    setSyncedInitial(initialFormValue);
    setForm(initialFormValue);
  }

  const metrics = signalResult?.metrics;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveSuccessVisible(false);
    upsert.mutate(
      {
        productId,
        data: {
          currency: form.currency || currency,
          costBasis: numberOrNull(form.costBasis),
          inboundShipping: numberOrNull(form.inboundShipping),
          outboundShipping: numberOrNull(form.outboundShipping),
          fulfillmentFee: numberOrNull(form.fulfillmentFee),
          platformFee: numberOrNull(form.platformFee),
          referralFeeRate: referralRateOrNull(form.referralFeeRate),
          advertisingCost: numberOrNull(form.advertisingCost),
          taxCustomsBuffer: numberOrNull(form.taxCustomsBuffer),
          targetSellPrice: numberOrNull(form.targetSellPrice),
          targetUnits: numberOrNull(form.targetUnits),
          notes: form.notes || null,
        },
      },
      {
        onSuccess: () => setSaveSuccessVisible(true),
      },
    );
  };

  const updateField = (field: string, value: string) => {
    setSaveSuccessVisible(false);
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>业务选品假设</CardTitle>
          <p className="mt-1 text-sm text-fg-muted">
            输入单件成本、运费、履约、平台费用、广告和税费，计算假设利润率与 ROI。
          </p>
        </div>
        {metrics ? (
          <Badge
            variant={
              metrics.completeness === 'complete'
                ? 'success'
                : metrics.completeness === 'partial'
                  ? 'warning'
                  : 'neutral'
            }
          >
            {businessCompletenessLabels[metrics.completeness]}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics ? (
          <div className="grid gap-3 md:grid-cols-5">
            <MetricTile label="净利率" value={percentOrMissing(metrics.netMargin)} />
            <MetricTile label="ROI" value={percentOrMissing(metrics.roi)} />
            <MetricTile
              label="保本售价"
              value={
                metrics.breakevenSellPrice !== null
                  ? formatCurrency(metrics.breakevenSellPrice, currency)
                  : '缺失'
              }
            />
            <MetricTile
              label="单件贡献利润"
              value={
                metrics.contributionProfitPerUnit !== null
                  ? formatCurrency(metrics.contributionProfitPerUnit, currency)
                  : '缺失'
              }
            />
            <MetricTile
              label="总变动成本"
              value={
                metrics.totalVariableCost !== null
                  ? formatCurrency(metrics.totalVariableCost, currency)
                  : '缺失'
              }
            />
          </div>
        ) : null}

        {metrics?.missingSignals.length ? (
          <div className="flex flex-wrap gap-2">
            {metrics.missingSignals.map((signal) => (
              <Badge key={signal} variant="warning">
                {productDetailSignalLabel(signal)}
              </Badge>
            ))}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <BusinessInput label="货币" value={form.currency} inputType="text" onChange={(value) => updateField('currency', value)} />
            <BusinessInput label="单件成本" value={form.costBasis} onChange={(value) => updateField('costBasis', value)} />
            <BusinessInput label="头程运费" value={form.inboundShipping} onChange={(value) => updateField('inboundShipping', value)} />
            <BusinessInput label="出库运费" value={form.outboundShipping} onChange={(value) => updateField('outboundShipping', value)} />
            <BusinessInput label="履约费" value={form.fulfillmentFee} onChange={(value) => updateField('fulfillmentFee', value)} />
            <BusinessInput label="平台固定费" value={form.platformFee} onChange={(value) => updateField('platformFee', value)} />
            <BusinessInput
              label="佣金比例"
              value={form.referralFeeRate}
              onChange={(value) => updateField('referralFeeRate', value)}
              step="0.01"
              helpText="可填 12 或 0.12，都会按 12% 保存。"
            />
            <BusinessInput label="广告成本" value={form.advertisingCost} onChange={(value) => updateField('advertisingCost', value)} />
            <BusinessInput label="税费/关税缓冲" value={form.taxCustomsBuffer} onChange={(value) => updateField('taxCustomsBuffer', value)} />
            <BusinessInput label="目标售价" value={form.targetSellPrice} onChange={(value) => updateField('targetSellPrice', value)} />
            <BusinessInput label="目标销量" value={form.targetUnits} onChange={(value) => updateField('targetUnits', value)} step="1" />
          </div>
          <label className="block text-sm font-medium text-fg-muted">
            备注
            <textarea
              value={form.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              aria-label="备注"
              className="mt-1 min-h-20 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-3xl text-xs text-fg-muted">
              {businessMetricsCaveat}
            </p>
            <Button type="submit" disabled={upsert.isPending}>
              {upsert.isPending ? '保存中' : '保存业务假设'}
            </Button>
          </div>
          {upsert.isError ? (
            <p className="text-sm text-error">保存失败，请检查输入后重试。</p>
          ) : null}
          {saveSuccessVisible && !upsert.isError ? (
            <p aria-live="polite" className="text-sm text-success">
              业务假设已保存。
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function MarketSignalsCard({
  productId,
  supported,
  latest,
  history,
  health,
  refreshResult,
  isRefreshing,
  refreshError,
  onRefresh,
}: {
  productId: string;
  supported: boolean;
  latest?: MarketSignalLatestResponse;
  history: MarketSignalSnapshot[];
  health?: MarketSignalProviderHealth;
  refreshResult?: MarketSignalRefreshResult;
  isRefreshing: boolean;
  refreshError: unknown;
  onRefresh: () => void;
}) {
  const snapshot = latest?.data ?? null;
  const failedRefresh = refreshResult && !refreshResult.success;
  const missingSignals =
    snapshot?.missingSignals ?? latest?.missingSignals ?? ['market_history'];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>市场趋势信号</CardTitle>
          <p className="mt-1 text-sm text-fg-muted">
            Keepa 历史价格、排名、评价与评分变化；这些是趋势代理，不是销量或利润事实。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={marketSignalStatusVariant(snapshot ? 'fresh' : latest?.status ?? 'missing')}>
            {snapshot ? 'fresh' : latest?.status ?? 'missing'}
          </Badge>
          {health ? (
            <Badge variant={providerHealthBadge(health.status)}>
              keepa {health.status}
            </Badge>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            disabled={!supported || isRefreshing}
            onClick={onRefresh}
            aria-label="刷新市场趋势信号"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? '刷新中' : '刷新趋势'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!supported ? (
          <div className="rounded-md border border-dashed border-border-subtle p-4 text-sm text-fg-muted">
            Keepa 市场趋势信号当前仅支持 Amazon ASIN 商品。
          </div>
        ) : snapshot ? (
          <div className="grid gap-3 md:grid-cols-5">
            <MetricTile
              label="Confidence"
              value={`${Math.round(snapshot.confidence * 100)}%`}
            />
            <MetricTile
              label="Freshness"
              value={formatAge(snapshot.freshnessMs)}
            />
            <MetricTile
              label="Price trend"
              value={trendValue(snapshot.priceTrend, 'price')}
            />
            <MetricTile
              label="Rank trend"
              value={trendValue(snapshot.salesRankTrend, 'rank')}
            />
            <MetricTile
              label="Reviews/day"
              value={
                snapshot.reviewVelocity == null
                  ? '缺失'
                  : snapshot.reviewVelocity.toFixed(2)
              }
            />
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-dashed border-border-subtle p-4 text-sm text-fg-muted">
            <BarChart3 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              暂无 Keepa 市场趋势快照。刷新后会显示历史价格、销售排名、评价速度和评分变化。
            </span>
          </div>
        )}

        {failedRefresh ? (
          <div className="rounded-md border border-warning/40 bg-warning/5 p-3 text-sm text-warning">
            <p className="font-medium">
              刷新失败：{refreshResult.failureReason ?? 'unknown'}
              {refreshResult.rootCause ? ` · ${refreshResult.rootCause}` : ''}
            </p>
            {refreshResult.error ? (
              <p className="mt-1 text-xs opacity-80">{refreshResult.error}</p>
            ) : null}
          </div>
        ) : null}

        {refreshError ? (
          <div className="flex items-start gap-2 rounded-md border border-error/30 bg-error/5 p-3 text-sm text-error">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>市场趋势刷新请求失败，请稍后重试。</span>
          </div>
        ) : null}

        {missingSignals.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {missingSignals.map((signal) => (
              <Badge key={signal} variant="warning">
                {productDetailSignalLabel(signal)}
              </Badge>
            ))}
          </div>
        ) : null}

        {history.length > 0 ? (
          <div className="overflow-hidden rounded-md border border-border-subtle">
            <div className="grid grid-cols-[1fr_88px_88px_88px] gap-2 border-b border-border-subtle bg-subtle px-3 py-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
              <span>Snapshot</span>
              <span>Confidence</span>
              <span>Rank</span>
              <span>Freshness</span>
            </div>
            <div className="divide-y divide-border-subtle">
              {history.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_88px_88px_88px] gap-2 px-3 py-2 text-xs text-fg-muted"
                >
                  <span className="truncate tabular-nums">{formatDateTime(item.createdAt)}</span>
                  <span className="tabular-nums">{Math.round(item.confidence * 100)}%</span>
                  <span>{trendValue(item.salesRankTrend, 'rank')}</span>
                  <span>{formatAge(item.freshnessMs)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {health?.recommendations.length ? (
          <div className="space-y-1 text-xs text-fg-muted">
            {health.recommendations.slice(0, 2).map((item) => (
              <p key={item.code}>{item.message}</p>
            ))}
          </div>
        ) : null}

        <p className="text-xs text-fg-muted">
          {latest?.caveat ??
            'Keepa market signals are trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.'}
          <span className="ml-1 text-fg-subtle">Product {shortId(productId)}</span>
        </p>
      </CardContent>
    </Card>
  );
}

function BusinessInput({
  label,
  value,
  onChange,
  step = '0.01',
  helpText,
  inputType = 'number',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
  helpText?: string;
  inputType?: 'number' | 'text';
}) {
  const isTextInput = inputType === 'text';
  const helpId = helpText ? `${label.replace(/\s+/g, '-').toLowerCase()}-help` : undefined;
  return (
    <label className="block text-sm font-medium text-fg-muted">
      {label}
      <input
        type={isTextInput ? 'text' : 'number'}
        min={isTextInput ? undefined : 0}
        step={isTextInput ? undefined : step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        aria-describedby={helpId}
        className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
      />
      {helpText ? (
        <span id={helpId} className="mt-1 block text-xs font-normal text-fg-subtle">
          {helpText}
        </span>
      ) : null}
    </label>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-subtle p-3">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-fg">{value}</p>
    </div>
  );
}

function AcquisitionOperationsCard({
  diagnostics,
  queueHealth,
  retrying,
  cancelling,
  controlMessage,
  controlError,
  onRetry,
  onCancel,
}: {
  diagnostics?: AcquisitionProductJobDiagnostics;
  queueHealth?: AcquisitionQueueHealth;
  retrying: boolean;
  cancelling: boolean;
  controlMessage?: string;
  controlError: unknown;
  onRetry: (jobId: string) => void;
  onCancel: (jobId: string) => void;
}) {
  const job = diagnostics?.job ?? null;
  const latestAttempt = diagnostics?.latestAttempt ?? null;
  const providerGate = diagnostics?.providerGate ?? null;
  const retryDisabledReason = job
    ? job.retryable
      ? null
      : retryDisabledText(job.status)
    : '暂无可重试的采集 job。';
  const cancelDisabledReason = job
    ? job.cancellable
      ? null
      : cancelDisabledText(job.status)
    : '暂无可取消的采集 job。';

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>采集队列运行状态</CardTitle>
          <p className="mt-1 text-sm text-fg-muted">
            job、worker 与 provider gate 只说明采集运行情况，不改变商品机会评分。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {queueHealth ? (
            <Badge variant={queueStatusBadge(queueHealth.status)}>
              {queueHealth.backend} {queueHealth.status}
            </Badge>
          ) : null}
          {job ? (
            <Badge variant={jobStatusBadge(job.status)}>{job.status}</Badge>
          ) : (
            <Badge variant="neutral">no job</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {job ? (
          <div className="grid gap-3 md:grid-cols-4">
            <MetricTile label="Attempts" value={`${job.attemptCount}/${job.maxAttempts}`} />
            <MetricTile label="Next run" value={formatQueueTime(job.nextRunAt)} />
            <MetricTile label="Lease" value={formatLeaseState(job)} />
            <MetricTile label="Priority" value={String(job.priority)} />
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-dashed border-border-subtle p-4 text-sm text-fg-muted">
            <Server className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>暂无该商品的采集 job 历史。商品详情仍按现有快照和机会数据展示。</span>
          </div>
        )}

        {job?.delayReason ? (
          <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 p-3 text-sm text-warning">
            <Clock className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              延迟原因：{formatHealthKey(job.delayReason)}
              {job.lastFailureReason ? ` · 最近失败：${job.lastFailureReason}` : ''}
            </span>
          </div>
        ) : null}

        {providerGate ? (
          <div className="rounded-md border border-border-subtle bg-subtle p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-fg">
                {formatPlatformLabel(providerGate.platform)} / {providerGate.provider}
              </p>
              <Badge variant={providerGateBadge(providerGate.status)}>
                {providerGate.status}
              </Badge>
              {providerGate.resetAt ? (
                <Badge variant="neutral">reset {formatQueueTime(providerGate.resetAt)}</Badge>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-fg-muted">
              并发 {providerGate.currentConcurrency}/{providerGate.maxConcurrency} · active{' '}
              {providerGate.activeCount}
            </p>
            {providerGate.recentRootCauses.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {providerGate.recentRootCauses.slice(0, 4).map((cause) => (
                  <Badge key={cause} variant="warning">
                    {formatHealthKey(cause)}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {queueHealth ? (
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-md border border-border-subtle bg-subtle p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                <Server className="h-3.5 w-3.5" />
                Worker
              </div>
              <p className="mt-2 text-fg">
                healthy {queueHealth.workerSummary.healthy}/{queueHealth.workerSummary.total} ·
                active {queueHealth.workerSummary.activeJobCount}/
                {queueHealth.workerSummary.capacity}
              </p>
              {queueHealth.workerSummary.stale > 0 ? (
                <p className="mt-1 text-xs text-warning">
                  stale worker {queueHealth.workerSummary.stale}
                </p>
              ) : null}
            </div>
            <div className="rounded-md border border-border-subtle bg-subtle p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                <PauseCircle className="h-3.5 w-3.5" />
                Backlog
              </div>
              <p className="mt-2 text-fg">
                pending {queueHealth.counts.pending} · running {queueHealth.counts.running} ·
                retry {queueHealth.counts.retryScheduled}
              </p>
              {queueHealth.counts.staleLeases > 0 ? (
                <p className="mt-1 text-xs text-warning">
                  stale leases {queueHealth.counts.staleLeases}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {latestAttempt ? (
          <div className="rounded-md border border-border-subtle p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-fg">最近尝试</p>
              <Badge variant={latestAttempt.status === 'success' ? 'success' : 'error'}>
                {latestAttempt.status}
              </Badge>
              <Badge variant="neutral">{latestAttempt.provider}</Badge>
              <Badge variant="neutral">{latestAttempt.source}</Badge>
            </div>
            <p className="mt-2 text-xs text-fg-muted">
              {formatDateTime(latestAttempt.timestamp)} · {latestAttempt.durationMs}ms
              {latestAttempt.confidence != null
                ? ` · confidence ${Math.round(latestAttempt.confidence * 100)}%`
                : ''}
              {latestAttempt.httpStatus ? ` · HTTP ${latestAttempt.httpStatus}` : ''}
            </p>
            {latestAttempt.failureReason ? (
              <p className="mt-1 text-xs text-fg-muted">
                failure: {latestAttempt.failureReason}
              </p>
            ) : null}
          </div>
        ) : null}

        {diagnostics?.recommendations.length ? (
          <div className="space-y-2">
            {diagnostics.recommendations.slice(0, 3).map((item) => (
              <div
                key={item.code}
                className={cn(
                  'rounded-md border p-3 text-sm',
                  item.severity === 'critical'
                    ? 'border-error/30 bg-error/5 text-error'
                    : item.severity === 'warning'
                      ? 'border-warning/40 bg-warning/5 text-warning'
                      : 'border-border-subtle bg-subtle text-fg-muted',
                )}
              >
                {item.message}
              </div>
            ))}
          </div>
        ) : null}

        {job ? (
          <div className="flex flex-col gap-3 rounded-md border border-border-subtle bg-subtle p-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1 text-xs text-fg-muted">
              <p>Retry: {retryDisabledReason ?? '可将 failed/cancelled job 重新置为可执行。'}</p>
              <p>Cancel: {cancelDisabledReason ?? '可阻止 pending/retry-scheduled job 被 worker claim。'}</p>
              {controlMessage ? <p className="text-success">{controlMessage}</p> : null}
              {controlError ? <p className="text-error">job 控制请求失败，请稍后重试。</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={!job.retryable || retrying || cancelling}
                title={retryDisabledReason ?? 'Retry acquisition job'}
                onClick={() => onRetry(job.id)}
                aria-label="重试采集 job"
              >
                <RotateCcw className={cn('h-4 w-4', retrying && 'animate-spin')} />
                {retrying ? '重试中' : 'Retry'}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!job.cancellable || retrying || cancelling}
                title={cancelDisabledReason ?? 'Cancel acquisition job'}
                onClick={() => onCancel(job.id)}
                aria-label="取消采集 job"
              >
                <XCircle className="h-4 w-4" />
                {cancelling ? '取消中' : 'Cancel'}
              </Button>
            </div>
          </div>
        ) : null}

        <p className="text-xs text-fg-muted">
          {diagnostics?.caveat ??
            queueHealth?.caveat ??
            'Queue health describes acquisition operations only. It is not verified evidence of sales, demand, margin, ROI, or profitability.'}
        </p>
      </CardContent>
    </Card>
  );
}

function AcquisitionStatusCard({
  latestResult,
  attempts,
  providerHealth,
  isChecking,
  error,
}: {
  latestResult?: ScrapeResult;
  attempts: ScrapeAttempt[];
  providerHealth?: ProviderHealthResponse;
  isChecking: boolean;
  error: unknown;
}) {
  const highlightedAttemptId = latestResult?.attemptId;
  const visibleAttempts = attempts.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>采集状态</CardTitle>
          <p className="mt-1 text-sm text-fg-muted">
            最近一次手动检查和 provider 尝试记录
          </p>
        </div>
        {isChecking && (
          <Badge variant="info" dot>
            检查中
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {latestResult && <LatestAcquisitionResult result={latestResult} />}
        {providerHealth ? <ProviderHealthSummary health={providerHealth} /> : null}
        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-error/30 bg-error/5 p-3 text-sm text-error">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>采集请求失败，请稍后重试。</span>
          </div>
        ) : null}

        {visibleAttempts.length === 0 ? (
          <div className="rounded-md border border-dashed border-border-subtle p-4 text-sm text-fg-muted">
            暂无采集尝试记录。
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border-subtle">
            <div className="grid grid-cols-[1fr_96px_96px] gap-3 border-b border-border-subtle bg-subtle px-4 py-2 text-xs font-semibold uppercase tracking-wide text-fg-muted md:grid-cols-[1fr_120px_120px_100px]">
              <span>Provider</span>
              <span>Status</span>
              <span>Reason</span>
              <span className="hidden md:block">Duration</span>
            </div>
            <div className="divide-y divide-border-subtle">
              {visibleAttempts.map((attempt) => (
                <AttemptRow
                  key={attempt.id}
                  attempt={attempt}
                  highlighted={attempt.id === highlightedAttemptId}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProviderHealthSummary({ health }: { health: ProviderHealthResponse }) {
  const primary = health.providerSummaries[0];
  const degraded =
    health.chainSummary.browserFallbackCount > 0 ||
    health.chainSummary.cacheFallbackCount > 0 ||
    health.chainSummary.primaryFailureCount > 0;
  const topRootCauses = topCounts(health.chainSummary.rootCauses ?? {}, 3);
  const degradedPaths = topCounts(health.chainSummary.degradedPathCounts ?? {}, 3);

  return (
    <div className="rounded-md border border-border-subtle bg-subtle p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-fg">
              {formatPlatformLabel(health.platform)} provider health
            </p>
            <Badge variant={providerHealthBadge(health.status)}>{health.status}</Badge>
            {degraded ? <Badge variant="warning">degraded fallback</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-fg-muted">
            最近 {health.window.windowHours} 小时 · attempts {health.chainSummary.totalAttempts}
            {primary
              ? ` · ${primary.provider} success ${Math.round(primary.successRate * 100)}%`
              : ''}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-right text-xs tabular-nums text-fg-muted">
          <div>
            <p className="font-semibold text-fg">{health.chainSummary.browserFallbackCount}</p>
            <p>browser</p>
          </div>
          <div>
            <p className="font-semibold text-fg">{health.chainSummary.cacheFallbackCount}</p>
            <p>cache</p>
          </div>
          <div>
            <p className="font-semibold text-fg">{health.chainSummary.primaryFailureCount}</p>
            <p>primary fail</p>
          </div>
        </div>
      </div>
      {topRootCauses.length > 0 || degradedPaths.length > 0 ? (
        <div className="mt-3 grid gap-2 text-xs text-fg-muted md:grid-cols-2">
          {topRootCauses.length > 0 ? (
            <p>
              <span className="font-medium text-fg">Root causes:</span>{' '}
              {topRootCauses.map(([key, count]) => `${formatHealthKey(key)} ${count}`).join(' · ')}
            </p>
          ) : null}
          {degradedPaths.length > 0 ? (
            <p>
              <span className="font-medium text-fg">Paths:</span>{' '}
              {degradedPaths.map(([key, count]) => `${formatHealthKey(key)} ${count}`).join(' · ')}
            </p>
          ) : null}
        </div>
      ) : null}
      {health.recommendations.length > 0 ? (
        <div className="mt-3 space-y-1 text-xs text-fg-muted">
          {health.recommendations.slice(0, 2).map((item) => (
            <p key={item.code}>{item.message}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function topCounts(record: Record<string, number>, limit: number): Array<[string, number]> {
  return Object.entries(record)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);
}

function formatHealthKey(value: string): string {
  return value.replace(/_/g, ' ');
}

function formatPlatformLabel(value: string): string {
  if (value === 'ebay') return 'eBay';
  if (value === 'amazon') return 'Amazon';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function providerHealthBadge(
  status: ProviderHealthResponse['status'],
): 'success' | 'warning' | 'neutral' {
  if (status === 'healthy') return 'success';
  if (status === 'degraded') return 'warning';
  return 'neutral';
}

function queueStatusBadge(
  status: AcquisitionQueueHealth['status'],
): 'success' | 'warning' | 'neutral' | 'error' {
  if (status === 'healthy') return 'success';
  if (status === 'degraded') return 'warning';
  if (status === 'unavailable') return 'error';
  return 'neutral';
}

function jobStatusBadge(
  status: NonNullable<AcquisitionProductJobDiagnostics['job']>['status'],
): 'success' | 'warning' | 'neutral' | 'error' | 'info' {
  if (status === 'succeeded') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'running') return 'info';
  if (status === 'retry_scheduled') return 'warning';
  return 'neutral';
}

function providerGateBadge(
  status: NonNullable<AcquisitionProductJobDiagnostics['providerGate']>['status'],
): 'success' | 'warning' | 'neutral' | 'error' {
  if (status === 'open') return 'success';
  if (status === 'rate_limited' || status === 'quota_exhausted') return 'warning';
  if (status === 'unavailable') return 'error';
  return 'neutral';
}

function formatQueueTime(value: number | null | undefined): string {
  if (!value) return '无';
  return formatDateTime(value);
}

function formatLeaseState(
  job: NonNullable<AcquisitionProductJobDiagnostics['job']>,
): string {
  if (!job.leaseOwner) return '无 active lease';
  return `${shortId(job.leaseOwner)} until ${formatQueueTime(job.leaseExpiresAt)}`;
}

function retryDisabledText(
  status: NonNullable<AcquisitionProductJobDiagnostics['job']>['status'],
): string {
  if (status === 'running') return '运行中的 job 不能直接 retry，请等待完成或 lease 过期。';
  if (status === 'pending' || status === 'retry_scheduled') {
    return '该 job 已在等待执行，不需要 retry。';
  }
  if (status === 'succeeded') return '已成功的 job 不需要 retry。';
  return '当前状态不支持 retry。';
}

function cancelDisabledText(
  status: NonNullable<AcquisitionProductJobDiagnostics['job']>['status'],
): string {
  if (status === 'running') return '运行中的 job 只能等待 worker 完成或 lease 过期。';
  if (status === 'failed' || status === 'cancelled' || status === 'succeeded') {
    return '已结束的 job 不能取消。';
  }
  return '当前状态不支持 cancel。';
}

function marketSignalStatusVariant(
  status: 'fresh' | 'missing' | 'failed' | 'stale',
): 'success' | 'warning' | 'neutral' | 'error' {
  if (status === 'fresh') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'stale') return 'warning';
  return 'neutral';
}

function formatAge(value: number | null | undefined): string {
  if (value == null) return '缺失';
  const minutes = Math.round(value / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function trendValue(
  trend: MarketSignalSnapshot['priceTrend'],
  kind: 'price' | 'rank',
): string {
  if (!trend) return '缺失';
  const current = trend.current ?? trend.average;
  const change =
    trend.changePercent == null
      ? ''
      : `${trend.changePercent > 0 ? '+' : ''}${trend.changePercent.toFixed(1)}%`;
  if (current == null) return change || trend.direction || '缺失';
  const formatted =
    kind === 'rank'
      ? Math.round(current).toLocaleString()
      : current.toFixed(2);
  return change ? `${formatted} ${change}` : formatted;
}

function LatestAcquisitionResult({ result }: { result: ScrapeResult }) {
  const success = result.success;
  const degraded =
    result.provider === 'amazon-browser' ||
    result.source === 'browser' ||
    result.provider === 'cache' ||
    result.source === 'cache';
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-md border p-4 text-sm md:flex-row md:items-center md:justify-between',
        success
          ? 'border-success/30 bg-success/5 text-success'
          : 'border-warning/40 bg-warning/5 text-warning',
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        {success ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className="font-medium">
            {success ? '采集成功' : `采集未完成：${result.failureReason ?? 'unknown'}`}
          </p>
          <p className="mt-1 break-words text-xs opacity-80">
            provider: {result.provider ?? 'unknown'} · source: {result.source ?? 'unknown'}
            {result.confidence != null ? ` · confidence: ${Math.round(result.confidence * 100)}%` : ''}
          </p>
          {degraded ? (
            <p className="mt-1 text-xs opacity-80">
              当前结果来自 browser/cache 降级路径，不代表 live API provider 健康。
            </p>
          ) : null}
        </div>
      </div>
      <div className="text-xs opacity-80">
        {result.jobId ? <p>Job {shortId(result.jobId)}</p> : null}
        {result.attemptId ? <p>Attempt {shortId(result.attemptId)}</p> : null}
      </div>
    </div>
  );
}

function AttemptRow({
  attempt,
  highlighted,
}: {
  attempt: ScrapeAttempt;
  highlighted: boolean;
}) {
  const diagnostics = parseDiagnostics(attempt);
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_96px_96px] gap-3 px-4 py-3 text-sm md:grid-cols-[1fr_120px_120px_100px]',
        highlighted && 'bg-primary-50/60',
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-fg">{attempt.provider}</span>
          <Badge variant="neutral">{attempt.source}</Badge>
        </div>
        <p className="mt-1 text-xs text-fg-subtle">
          {formatDateTime(attempt.timestamp)}
          {attempt.confidence != null
            ? ` · ${Math.round(attempt.confidence * 100)}%`
            : ''}
        </p>
        {diagnostics ? (
          <p className="mt-1 break-words text-xs text-fg-muted">{diagnostics}</p>
        ) : null}
      </div>
      <div>
        <Badge variant={attempt.status === 'success' ? 'success' : 'error'}>
          {attempt.status}
        </Badge>
      </div>
      <div className="min-w-0 text-xs text-fg-muted">
        {attempt.failureReason ?? 'none'}
      </div>
      <div className="hidden text-xs tabular-nums text-fg-muted md:block">
        {attempt.durationMs}ms
      </div>
    </div>
  );
}

function parseDiagnostics(attempt: ScrapeAttempt): string | null {
  const parts = [
    attempt.httpStatus ? `HTTP ${attempt.httpStatus}` : null,
    attempt.pageTitle ? `title: ${attempt.pageTitle}` : null,
    attempt.finalUrl ? `url: ${attempt.finalUrl}` : null,
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(' · ');

  if (!attempt.diagnostics) return null;
  try {
    const parsed = JSON.parse(attempt.diagnostics) as Record<string, unknown>;
    const summary = [
      valueAsText(parsed.detectedState, 'state'),
      valueAsText(parsed.rootCause, 'root cause'),
      valueAsText(parsed.providerErrorCode, 'code'),
      valueAsText(parsed.marketplace, 'marketplace'),
      valueAsText(parsed.providerMessage, 'message'),
      valueAsText(parsed.sanitizedMessage, 'message'),
    ].filter(Boolean);
    return summary.length > 0 ? summary.join(' · ') : null;
  } catch {
    return null;
  }
}

function valueAsText(value: unknown, label: string): string | null {
  return typeof value === 'string' && value ? `${label}: ${value}` : null;
}

function valueToInput(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

function numberOrNull(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function referralRateOrNull(value: string): number | null {
  const parsed = numberOrNull(value);
  if (parsed === null) return null;
  if (parsed > 1 && parsed <= 100) return parsed / 100;
  return parsed;
}

function percentOrMissing(value: number | null): string {
  return value === null ? '缺失' : `${(value * 100).toFixed(1)}%`;
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
