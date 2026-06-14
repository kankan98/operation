import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useProduct } from '@/hooks/useProducts';
import { usePriceStats, usePriceSnapshots } from '@/hooks/usePriceStats';
import { PriceTrendChart } from '@/components/products/PriceTrendChart';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PriceSnapshot, Availability } from '@/types';

const availabilityBadge: Record<Availability, 'success' | 'warning' | 'error'> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'error',
};

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['products', 'common']);

  const { data: product, isLoading: pl } = useProduct(id!);
  const { data: stats, isLoading: sl } = usePriceStats(id!);
  const { data: snapshots, isLoading: snl } = usePriceSnapshots(id!, 30);

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
          <Button>
            <RefreshCw className="h-4 w-4" />
            {t('checkNow')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <KPICard label={t('currentPrice')} value={formatCurrency(stats.currentPrice, product.currency)} />
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
              {up && '+'}
              {formatCurrency(priceChange, product.currency)}
            </p>
            <p
              className={cn(
                'mt-1 text-sm tabular-nums',
                up && 'text-error',
                down && 'text-success',
                !up && !down && 'text-fg-muted',
              )}
            >
              {up && '+'}
              {pct.toFixed(2)}%
            </p>
          </Card>
          <KPICard label={t('highestPrice')} value={formatCurrency(stats.highestPrice, product.currency)} />
          <KPICard label={t('lowestPrice')} value={formatCurrency(stats.lowestPrice, product.currency)} />
          <KPICard label={t('averagePrice')} value={formatCurrency(stats.averagePrice, product.currency)} />
          <KPICard label={t('dataPoints')} value={stats.dataPoints} />
          <Card className="p-6 sm:col-span-2">
            <p className="text-[13px] font-medium text-fg-muted">{t('trackingPeriod')}</p>
            <div className="mt-2 space-y-1 text-sm tabular-nums text-fg">
              <p>
                <span className="text-fg-subtle">{t('common:from')}: </span>
                {formatDateTime(stats.firstRecordedAt)}
              </p>
              <p>
                <span className="text-fg-subtle">{t('common:to')}: </span>
                {formatDateTime(stats.lastRecordedAt)}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Chart */}
      {snapshots && <PriceTrendChart snapshots={snapshots} currency={product.currency} />}

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
