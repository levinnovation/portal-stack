"use client";

import { CartesianGrid, Legend, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { TOOLTIP_STYLE } from "./palette";

export function AnomalyTimeline({
  data,
  anomalies,
  trend,
  height = 280,
}: {
  data: { date: string; value: number }[];
  anomalies: { date: string; value: number; severity: "medium" | "high"; metric: string }[];
  trend?: { date: string; value: number }[];
  height?: number;
}) {
  const trendByDate = new Map((trend ?? []).map((t) => [t.date, t.value]));
  const rows = data.map((d) => ({ ...d, trend: trendByDate.get(d.date) }));
  const hasTrend = trendByDate.size > 0;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend />
        <Line type="monotone" dataKey="value" name="Valor" stroke="hsl(var(--primary))" strokeWidth={2.4} dot={false} />
        {hasTrend ? (
          <Line
            type="monotone"
            dataKey="trend"
            name="Tendencia (media móvil)"
            stroke="hsl(var(--accent))"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ) : null}
        {anomalies.map((a) => (
          <ReferenceDot
            key={`${a.metric}-${a.date}`}
            x={a.date}
            y={a.value}
            r={6}
            fill={a.severity === "high" ? "hsl(var(--destructive))" : "hsl(var(--warning))"}
            stroke="none"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
