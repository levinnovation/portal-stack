"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
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
  showLabels = false,
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
  showLabels?: boolean;
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
        >
          {showLabels ? (
            <LabelList
              dataKey={barKey}
              position="top"
              fill="hsl(var(--muted-foreground))"
              fontSize={10}
              formatter={(v) => lfmt(Number(v ?? 0))}
            />
          ) : null}
        </Bar>
        <Line
          yAxisId="right"
          type="monotone"
          dataKey={lineKey}
          name={lineLabel ?? lineKey}
          stroke={lineColor}
          strokeWidth={2.2}
          dot={{ fill: lineColor, r: 3 }}
        >
          {showLabels ? (
            <LabelList
              dataKey={lineKey}
              position="top"
              fill={lineColor}
              fontSize={10}
              formatter={(v) => rfmt(Number(v ?? 0))}
            />
          ) : null}
        </Line>
      </ComposedChart>
    </ResponsiveContainer>
  );
}

