import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import type { Alert } from '@/types';

interface RecentAlertsProps {
  alerts: Alert[];
}

const severityConfig = {
  critical: { icon: AlertCircle, color: 'text-error', bg: 'bg-error/10' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10' },
} as const;

export function RecentAlerts({ alerts }: RecentAlertsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t('recentAlerts')}</CardTitle>
          <CardDescription>{t('last5')}</CardDescription>
        </div>
        <button
          onClick={() => navigate('/alerts')}
          className="flex items-center gap-0.5 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          {t('viewAll')}
          <ChevronRight className="h-4 w-4" />
        </button>
      </CardHeader>

      {alerts.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-fg-muted">{t('noRecentAlerts')}</div>
      ) : (
        <div className="mt-4 divide-y divide-border-subtle border-t border-border-subtle">
          {alerts.slice(0, 5).map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            return (
              <button
                key={alert.id}
                onClick={() => navigate('/alerts')}
                className={cn(
                  'flex w-full items-start gap-3 px-6 py-4 text-left transition-colors duration-150 hover:bg-subtle',
                  !alert.isRead && 'bg-primary-50/40',
                )}
              >
                <div className={cn('mt-0.5 rounded-[10px] p-2', config.bg)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm text-fg', !alert.isRead && 'font-semibold')}>
                    {alert.title}
                  </p>
                  {alert.message && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-fg-muted">{alert.message}</p>
                  )}
                  <p className="mt-1 text-xs text-fg-subtle tabular-nums">
                    {formatDateTime(alert.createdAt)}
                  </p>
                </div>
                {!alert.isRead && (
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
