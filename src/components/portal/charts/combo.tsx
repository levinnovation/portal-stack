"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { resolveFormat, type FormatKind } from "@/components/portal/chart-format";
import { TOOLTIP_STYLE } from "./palette";

export function ComboSpendReservations({
  data,
  height = 280,
  leftFormat = "money",
  rightFormat = "num",
}: {
  data: { name: string; spend: number; reservations: number }[];
  height?: number;
  leftFormat?: FormatKind;
  rightFormat?: FormatKind;
}) {
  const lfmt = resolveFormat(leftFormat);
  const rfmt = resolveFormat(rightFormat);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => lfmt(v as number)} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => rfmt(v as number)} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v, name) => [name === "spend" ? lfmt(v as number) : rfmt(v as number), name]}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="spend" name="Inversión" fill="var(--primary)" radius={[6, 6, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="reservations" name="Reservas" stroke="#2dd4bf" strokeWidth={2.2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
