"use client";

import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";

import { TOOLTIP_STYLE } from "./palette";

export function ScatterEfficiency({
  data,
  height = 280,
}: {
  data: { name: string; x: number; y: number; z?: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis type="number" dataKey="x" name="Costo/Lead calificado" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <YAxis type="number" dataKey="y" name="Costo/Reserva" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v, key) => [Number(v ?? 0).toFixed(1), key]}
          labelFormatter={(_, payload) => String(payload?.[0]?.payload?.name ?? "")}
        />
        <Scatter data={data} fill="hsl(var(--accent))" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
