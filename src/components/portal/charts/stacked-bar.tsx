"use client";

import {
  Bar,
  CartesianGrid,
  Legend,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { compactMoney } from "@tenants/core/lib/format";
import { CHART_COLORS, TOOLTIP_STYLE } from "./palette";

export function StackedBar({
  data,
  keys,
  height = 280,
  moneyFormat = false,
}: {
  data: Record<string, string | number>[];
  keys: string[];
  height?: number;
  /** Format Y-axis ticks as compact currency (e.g. "$1.2M"). A plain
   * function prop can't cross the server→client boundary from an async
   * server-component screen, so callers pass this flag instead. */
  moneyFormat?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={moneyFormat ? (v: number) => compactMoney(v) : (v: number) => String(v)}
        />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend />
        {keys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            radius={i === keys.length - 1 ? [4, 4, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

