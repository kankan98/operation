import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './Card';

export type Trend = 'up' | 'down' | 'neutral';

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: Trend;
  /** Secondary line, e.g. a description or delta like "↑ 12.5%". */
  description?: string;
  /** When true, an "up" trend is treated as positive (green). Default true. */
  upIsGood?: boolean;
}

export function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  description,
  upIsGood = true,
}: KPICardProps) {
  const positive = trend === 'up' ? upIsGood : trend === 'down' ? !upIsGood : null;
  const dotClass =
    trend === 'up'
      ? 'bg-success'
      : trend === 'down'
        ? 'bg-error'
        : 'bg-fg-subtle';

  return (
    <Card className="p-6 hover:shadow-e2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-fg-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-fg">{value}</p>
          {description && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-fg-muted">
              <span className={cn('inline-block h-2 w-2 rounded-full', dotClass)} />
              {trend === 'up' && (
                <TrendingUp className={cn('h-3.5 w-3.5', positive ? 'text-success' : 'text-error')} />
              )}
              {trend === 'down' && (
                <TrendingDown
                  className={cn('h-3.5 w-3.5', positive ? 'text-success' : 'text-error')}
                />
              )}
              {description}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-primary-50">
            <Icon className="h-5 w-5 text-primary-600" />
          </div>
        )}
      </div>
    </Card>
  );
}
