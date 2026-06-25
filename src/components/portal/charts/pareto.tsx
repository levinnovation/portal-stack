"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { TOOLTIP_STYLE } from "./palette";

export function ParetoChart({
  data,
  height = 300,
}: {
  data: { name: string; value: number; cumulative: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `${Math.round((v as number) * 100)}%`} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v, name) => [name === "Cumulativo" ? `${Math.round((v as number) * 100)}%` : v, name]}
        />
        <Bar yAxisId="left" dataKey="value" name="Reservas" fill="var(--primary)" radius={[6, 6, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulativo" stroke="#2dd4bf" strokeWidth={2.4} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
