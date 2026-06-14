import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ThemedLineChart } from '@/components/ui/charts/LineChart';
import type { PriceSnapshot } from '@/types';

interface PriceTrendChartProps {
  snapshots: PriceSnapshot[];
  currency: string;
}

export function PriceTrendChart({ snapshots, currency }: PriceTrendChartProps) {
  const { t } = useTranslation('products');

  const chartData = [...snapshots]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((s) => ({ date: formatDate(s.timestamp), price: s.price }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('priceTrend')}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-chart bg-subtle text-sm text-fg-muted">
            {t('noPriceData')}
          </div>
        ) : (
          <ThemedLineChart
            data={chartData}
            xKey="date"
            yKey="price"
            formatY={(v) => formatCurrency(v, currency)}
            formatTooltip={(v) => formatCurrency(v, currency)}
            tooltipLabel={t('table.price')}
          />
        )}
      </CardContent>
    </Card>
  );
}
