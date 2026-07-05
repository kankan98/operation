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

  return (
    <div className="relative" style={{ height, minHeight: height }}>
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 120 120"
          className="h-full w-full"
        >
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="var(--border, #e5e7eb)"
            strokeWidth="18"
          />
        </svg>
      )}
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
