"use client";

import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { TOOLTIP_STYLE } from "./palette";

export function AnomalyTimeline({
  data,
  anomalies,
  height = 280,
}: {
  data: { date: string; value: number }[];
  anomalies: { date: string; value: number; severity: "medium" | "high"; metric: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Line type="monotone" dataKey="value" name="Valor" stroke="var(--primary)" strokeWidth={2.4} dot={false} />
        {anomalies.map((a) => (
          <ReferenceDot
            key={`${a.metric}-${a.date}`}
            x={a.date}
            y={a.value}
            r={6}
            fill={a.severity === "high" ? "#fb7185" : "#fbbf24"}
            stroke="none"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
