"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TOOLTIP_STYLE, colorAt } from "./palette";

export type MultiLineSeries = { key: string; label: string; data: { t: string; v: number }[] };

/**
 * Multi-metric time series (one line per metric), used by agent BI
 * "Histórico" screens reading a worker's `/snapshots/timeseries` endpoint —
 * generic across agents (Formalizaciones, Eyal, …).
 */
export function MultiLineTrend({ series, height = 280 }: { series: MultiLineSeries[]; height?: number }) {
  const timestamps = Array.from(new Set(series.flatMap((s) => s.data.map((p) => p.t)))).sort();
  const rows = timestamps.map((t) => {
    const row: Record<string, string | number> = { t };
    for (const s of series) {
      const point = s.data.find((p) => p.t === t);
      if (point) row[s.key] = point.v;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="t"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={(d: string) => (d ? d.slice(5, 10) : "")}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip {...TOOLTIP_STYLE} labelFormatter={(l) => String(l)} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={colorAt(i)}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
