import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '@/stores/useAppStore';

interface ThemedLineChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
  formatY?: (value: number) => string;
  formatTooltip?: (value: number) => string;
  tooltipLabel?: string;
}

export function ThemedLineChart({
  data,
  xKey,
  yKey,
  height = 300,
  color = '#7c3aed',
  formatY,
  formatTooltip,
  tooltipLabel,
}: ThemedLineChartProps) {
  const theme = useAppStore((s) => s.theme);
  const grid = theme === 'dark' ? '#1f2937' : '#e5e7eb';
  const axis = theme === 'dark' ? '#6b7280' : '#9ca3af';
  const surface = theme === 'dark' ? '#111827' : '#ffffff';
  const fg = theme === 'dark' ? '#f9fafb' : '#111827';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="4 4" stroke={grid} strokeOpacity={0.5} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: axis }}
          stroke={grid}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis
          tickFormatter={formatY ? (v) => formatY(Number(v)) : undefined}
          tick={{ fontSize: 12, fill: axis }}
          stroke={grid}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip
          formatter={(value) => [
            formatTooltip ? formatTooltip(Number(value)) : String(value),
            tooltipLabel ?? '',
          ]}
          contentStyle={{
            backgroundColor: surface,
            border: `1px solid ${grid}`,
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(16,24,40,.08)',
            color: fg,
            fontSize: 13,
          }}
          labelStyle={{ color: axis }}
          cursor={{ stroke: color, strokeOpacity: 0.2, strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
