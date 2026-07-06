import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, Activity, Bell, AlertCircle, Plus } from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import { RecentAlerts } from '@/components/dashboard/RecentAlerts';
import { useProducts } from '@/hooks/useProducts';
import { useAlerts } from '@/hooks/useAlerts';

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[116px] animate-skeleton rounded-card" />
        ))}
      </div>
      <div className="h-80 animate-skeleton rounded-card" />
    </div>
  );
}

export function Dashboard() {
  const { t } = useTranslation('dashboard');
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();

  if (productsLoading || alertsLoading) return <PageSkeleton />;

  const totalProducts = products?.length || 0;
  const monitoringProducts = products?.filter((p) => p.isMonitoring).length || 0;
  const pausedProducts = totalProducts - monitoringProducts;
  const unreadAlerts = alerts?.filter((a) => !a.isRead).length || 0;
  const totalAlerts = alerts?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('subtitle')}</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label={t('totalProducts')} value={totalProducts} icon={Package} trend="neutral" description={t('allTracked')} />
        <KPICard label={t('monitoring')} value={monitoringProducts} icon={Activity} trend="up" description={t('activeMonitoring')} />
        <KPICard label={t('unreadAlerts')} value={unreadAlerts} icon={Bell} trend={unreadAlerts > 0 ? 'up' : 'neutral'} upIsGood={false} description={t('requireAttention')} />
        <KPICard label={t('totalAlerts')} value={totalAlerts} icon={AlertCircle} trend="neutral" description={t('allTimeAlerts')} />
      </div>

      {totalProducts === 0 && (
        <section className="flex flex-col gap-4 rounded-card border border-border-subtle bg-surface p-5 shadow-e1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-fg">{t('coldStartTitle')}</h2>
            <p className="mt-1 text-sm text-fg-muted">{t('coldStartDesc')}</p>
          </div>
          <Link
            to="/products"
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-button bg-primary-600 px-4 text-sm font-medium text-white shadow-e1 transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
          >
            <Plus className="h-4 w-4" />
            {t('addFirstProduct')}
          </Link>
        </section>
      )}

      {/* Overview + Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('monitoringOverview')}</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6 pt-2">
            <DonutChart
              data={[
                { name: t('active'), value: monitoringProducts, color: '#6e54ee' },
                { name: t('paused'), value: pausedProducts, color: '#e5e7eb' },
              ]}
              centerValue={totalProducts}
              centerLabel={t('totalProducts')}
              height={200}
            />
            <div className="mt-4 space-y-2">
              <LegendRow color="#6e54ee" label={t('active')} value={monitoringProducts} />
              <LegendRow color="#d1d5db" label={t('paused')} value={pausedProducts} />
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <RecentAlerts alerts={alerts || []} />
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-fg-muted">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-semibold tabular-nums text-fg">{value}</span>
    </div>
  );
}
