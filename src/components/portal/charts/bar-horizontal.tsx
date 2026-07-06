"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { colorAt, TOOLTIP_STYLE } from "./palette";
import { resolveFormat, type FormatKind } from "@/components/portal/chart-format";

export type Datum = { name: string; value: number };

// Barras horizontales (ranking). `format` es un TOKEN (no función — RSC no serializa
// funciones) que controla cómo se muestran los valores (CRC, conteo, %).
export function BarHorizontal({
  data,
  height,
  format = "num",
  color,
}: {
  data: Datum[];
  height?: number;
  format?: FormatKind;
  /** Color fijo (si se omite, alterna la paleta). */
  color?: string;
}) {
  const fmt = resolveFormat(format);
  const h = height ?? Math.max(160, data.length * 38 + 20);

  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <XAxis
          type="number"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={(v: number) => fmt(v)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={168}
          // Nombres largos (campañas) se cortaban; los truncamos con … y el nombre
          // completo queda en el tooltip.
          tickFormatter={(v: string) => (v.length > 26 ? v.slice(0, 25) + "…" : v)}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
          formatter={(v) => [fmt(v as number), ""]}
          labelFormatter={(label) => String(label)}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
          {data.map((_, i) => (
            <Cell key={i} fill={color ?? colorAt(i)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
