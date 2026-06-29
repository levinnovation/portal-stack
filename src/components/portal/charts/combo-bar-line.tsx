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
  barColor = "var(--primary)",
  lineColor = "#2dd4bf",
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
        <CartesianGrid stroke="#1c2438" strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fill: "#8b94ac", fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fill: "#8b94ac", fontSize: 11 }} tickFormatter={lfmt} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "#8b94ac", fontSize: 11 }}
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

