import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  height?: number;
  centerValue?: string | number;
  centerLabel?: string;
}

export function DonutChart({ data, height = 200, centerValue, centerLabel }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hasData = total > 0;
  const chartData = hasData ? data : [{ name: 'empty', value: 1, color: '#e5e7eb' }];

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="68%"
            outerRadius="100%"
            paddingAngle={hasData && data.length > 1 ? 2 : 0}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerValue !== undefined || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue !== undefined && (
            <span className="text-2xl font-bold tabular-nums text-fg">{centerValue}</span>
          )}
          {centerLabel && <span className="mt-0.5 text-xs text-fg-muted">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}
