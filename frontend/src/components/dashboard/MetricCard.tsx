import type { LucideIcon } from 'lucide-react';
import { KPICard, type Trend } from '@/components/ui/KPICard';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: Trend;
}

/** Thin wrapper around the design-system KPICard, kept for existing call sites. */
export function MetricCard({ title, value, icon, description, trend }: MetricCardProps) {
  return (
    <KPICard label={title} value={value} icon={icon} description={description} trend={trend} />
  );
}
