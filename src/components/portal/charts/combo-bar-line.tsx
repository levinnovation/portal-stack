"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TOOLTIP_STYLE } from "./palette";

export function ComboBarLine({
  data,
  barKey,
  lineKey,
  barLabel,
  lineLabel,
  barColor = "hsl(var(--primary))",
  lineColor = "hsl(var(--chart-1))",
  height = 280,
  leftTickFormatter,
  rightTickFormatter,
}: {
  data: Record<string, string | number>[];
  barKey: string;
  lineKey: string;
  barLabel?: string;
  lineLabel?: string;
  barColor?: string;
  lineColor?: string;
  height?: number;
  leftTickFormatter?: (v: number) => string;
  rightTickFormatter?: (v: number) => string;
}) {
  const lfmt = leftTickFormatter ?? ((v) => String(v));
  const rfmt = rightTickFormatter ?? ((v) => `${(v * 100).toFixed(0)}%`);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={lfmt} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={rfmt}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v, name) => {
            const isBar = name === (barLabel ?? barKey);
            return [isBar ? lfmt(v as number) : rfmt(v as number), name];
          }}
        />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey={barKey}
          name={barLabel ?? barKey}
          fill={barColor}
          radius={[5, 5, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey={lineKey}
          name={lineLabel ?? lineKey}
          stroke={lineColor}
          strokeWidth={2.2}
          dot={{ fill: lineColor, r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

