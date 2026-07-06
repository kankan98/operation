import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, PackagePlus } from 'lucide-react';
import { AlertItem } from '@/components/alerts/AlertItem';
import { Select } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useAlerts, useMarkAlertAsRead, useDeleteAlert } from '@/hooks/useAlerts';
import { useProducts } from '@/hooks/useProducts';
import type { Alert, Severity, AlertType } from '@/types';

type FilterTab = 'all' | 'unread' | 'critical' | 'warning' | 'info';

const ALERT_TYPES: AlertType[] = [
  'price_drop',
  'price_surge',
  'out_of_stock',
  'price_threshold',
  'price_change_percent',
  'stock_change',
];

export function AlertsCenter() {
  const { t } = useTranslation('alerts');
  const { data: alerts, isLoading } = useAlerts();
  const { data: products, isLoading: productsLoading } = useProducts();
  const markAsRead = useMarkAlertAsRead();
  const deleteAlert = useDeleteAlert();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [selectedType, setSelectedType] = useState<AlertType | 'all'>('all');

  const filteredAlerts = alerts?.filter((alert: Alert) => {
    if (activeFilter === 'unread' && alert.isRead) return false;
    if (['critical', 'warning', 'info'].includes(activeFilter) && alert.severity !== activeFilter)
      return false;
    if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false;
    if (selectedType !== 'all' && alert.alertType !== selectedType) return false;
    return true;
  });

  const unreadCount = alerts?.filter((a) => !a.isRead).length || 0;
  const counts: Record<FilterTab, number> = {
    all: alerts?.length || 0,
    unread: unreadCount,
    critical: alerts?.filter((a) => a.severity === 'critical').length || 0,
    warning: alerts?.filter((a) => a.severity === 'warning').length || 0,
    info: alerts?.filter((a) => a.severity === 'info').length || 0,
  };

  if (isLoading || productsLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-skeleton rounded-card" />
        ))}
      </div>
    );
  }

  const tabs: FilterTab[] = ['all', 'unread', 'critical', 'warning', 'info'];
  const hasProducts = (products?.length || 0) > 0;
  const isFiltered = activeFilter !== 'all' || selectedSeverity !== 'all' || selectedType !== 'all';
  const emptyDescription = isFiltered
    ? t('noAlertsDescFiltered')
    : hasProducts
      ? t('noAlertsDesc')
      : t('noProductsDesc');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {t('subtitle', { total: alerts?.length || 0, unread: unreadCount })}
        </p>
      </div>

      {/* Filter pills + selects */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-button bg-subtle p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={cn(
                'flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-sm font-medium transition-colors duration-150',
                activeFilter === tab
                  ? 'bg-surface text-fg shadow-e1'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {t(tab)}
              <span
                className={cn(
                  'rounded-badge px-1.5 text-xs tabular-nums',
                  activeFilter === tab ? 'bg-primary-50 text-primary-600' : 'bg-border text-fg-muted',
                )}
              >
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as Severity | 'all')}
            className="h-9 w-auto"
          >
            <option value="all">{t('allSeverities')}</option>
            <option value="critical">{t('critical')}</option>
            <option value="warning">{t('warning')}</option>
            <option value="info">{t('info')}</option>
          </Select>
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as AlertType | 'all')}
            className="h-9 w-auto"
          >
            <option value="all">{t('allTypes')}</option>
            {ALERT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`type.${type}`)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* List */}
      {filteredAlerts && filteredAlerts.length > 0 ? (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onMarkAsRead={(id) => markAsRead.mutate(id)}
              onDelete={(id) => deleteAlert.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-card border border-border-subtle bg-surface p-16 text-center shadow-e1">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-subtle">
            <Bell className="h-7 w-7 text-fg-subtle" />
          </div>
          <h3 className="text-base font-semibold text-fg">{t('noAlertsTitle')}</h3>
          <p className="mt-1 text-sm text-fg-muted">{emptyDescription}</p>
          {!isFiltered && !hasProducts && (
            <Link
              to="/products"
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-button bg-primary-600 px-4 text-sm font-medium text-white shadow-e1 transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
            >
              <PackagePlus className="h-4 w-4" />
              {t('goToProducts')}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
