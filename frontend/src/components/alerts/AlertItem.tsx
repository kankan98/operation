import { AlertCircle, AlertTriangle, Info, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { Alert, Severity, AlertType } from '@/types';

interface AlertItemProps {
  alert: Alert;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const severityConfig: Record<
  Severity,
  { icon: typeof AlertCircle; color: string; bg: string; accent: string; badge: 'error' | 'warning' | 'info' }
> = {
  critical: { icon: AlertCircle, color: 'text-error', bg: 'bg-error/10', accent: 'bg-error', badge: 'error' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', accent: 'bg-warning', badge: 'warning' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10', accent: 'bg-info', badge: 'info' },
};

const typeBadge: Record<AlertType, 'success' | 'error' | 'warning' | 'neutral'> = {
  price_drop: 'success',
  price_surge: 'error',
  out_of_stock: 'warning',
  price_threshold: 'neutral',
  price_change_percent: 'neutral',
  stock_change: 'neutral',
};

export function AlertItem({ alert, onMarkAsRead, onDelete }: AlertItemProps) {
  const { t } = useTranslation('alerts');
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'group relative flex items-start gap-4 overflow-hidden rounded-card border border-border-subtle bg-surface p-5 shadow-e1 transition-shadow duration-200 hover:shadow-e2',
        !alert.isRead && 'bg-primary-50/30',
      )}
    >
      {/* Severity accent bar */}
      <span className={cn('absolute inset-y-0 left-0 w-1', config.accent)} aria-hidden />

      <div className={cn('mt-0.5 flex-shrink-0 rounded-[12px] p-2.5', config.bg)}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className={cn('text-sm text-fg', !alert.isRead ? 'font-semibold' : 'font-medium')}>
            {alert.title}
          </h3>
          {!alert.isRead && (
            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-600" />
          )}
        </div>

        {alert.message && <p className="mt-1.5 text-sm text-fg-muted">{alert.message}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={config.badge}>{t(alert.severity)}</Badge>
          <Badge variant={typeBadge[alert.alertType]}>{t(`type.${alert.alertType}`)}</Badge>
          <span className="text-xs text-fg-subtle tabular-nums">
            {formatDateTime(alert.createdAt)}
          </span>
        </div>
      </div>

      {/* Actions — revealed on hover */}
      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
        {!alert.isRead && (
          <button
            onClick={() => onMarkAsRead(alert.id)}
            aria-label={t('markAsRead')}
            title={t('markAsRead')}
            className="flex h-9 w-9 items-center justify-center rounded-button text-success transition-colors hover:bg-success/10"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(alert.id)}
          aria-label={t('deleteAlert')}
          title={t('deleteAlert')}
          className="flex h-9 w-9 items-center justify-center rounded-button text-error transition-colors hover:bg-error/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
