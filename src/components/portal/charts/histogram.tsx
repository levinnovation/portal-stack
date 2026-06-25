"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { colorAt, TOOLTIP_STYLE } from "./palette";
import { num } from "@tenants/core/lib/format";

export type Bin = { label: string; count: number };

// Histograma de distribución (ej. score 1–10, días a cierre por rango). Cada bin ya
// viene agregado desde la fuente; aquí solo se pinta.
export function Histogram({
  data,
  height = 260,
  color,
}: {
  data: Bin[];
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={(v: number) => num(v)}
          axisLine={false}
          tickLine={false}
          width={36}
          allowDecimals={false}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
          formatter={(v) => [num(v as number), "Leads"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={color ?? colorAt(0)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
