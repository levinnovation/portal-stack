"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { TOOLTIP_STYLE } from "./palette";

export function WaterfallChart({
  data,
  height = 280,
}: {
  data: { name: string; value: number; type: "total" | "delta" }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar dataKey="value" name="Impacto" radius={[6, 6, 0, 0]}>
          {data.map((row) => (
            <Cell key={row.name} fill={row.type === "total" ? "var(--primary)" : row.value >= 0 ? "#34d399" : "#fb7185"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
