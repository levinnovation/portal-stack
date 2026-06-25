"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { colorAt, TOOLTIP_STYLE } from "./palette";
import { resolveFormat, type FormatKind } from "@tenants/core/lib/chart-format";
import type { Datum } from "./bar-horizontal";

// Barras verticales (categorías ordinales: score 1–10, etapas del funnel, etc.).
export function BarVertical({
  data,
  height = 280,
  format = "num",
  color,
}: {
  data: Datum[];
  height?: number;
  format?: FormatKind;
  color?: string;
}) {
  const fmt = resolveFormat(format);
  // Con muchas categorías de nombre largo (ej. estados del funnel) las etiquetas
  // horizontales se montan; las inclinamos y reservamos altura abajo.
  const angled = data.length > 4 || data.some((d) => d.name.length > 7);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: angled ? 28 : 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1c2438" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#8b94ac", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={angled ? -35 : 0}
          textAnchor={angled ? "end" : "middle"}
          height={angled ? 70 : 30}
        />
        <YAxis
          tick={{ fill: "#8b94ac", fontSize: 11 }}
          tickFormatter={(v: number) => fmt(v)}
          axisLine={false}
          tickLine={false}
          width={44}
          allowDecimals={false}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          cursor={{ fill: "#ffffff08" }}
          formatter={(v) => [fmt(v as number), ""]}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((_, i) => (
            <Cell key={i} fill={color ?? colorAt(i)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
