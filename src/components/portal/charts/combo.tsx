"use client";

import { Bar, CartesianGrid, ComposedChart, LabelList, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { resolveFormat, type FormatKind } from "@/components/portal/chart-format";
import { compactMoney } from "@tenants/core/lib/format";
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
        <Bar yAxisId="left" dataKey="spend" name="Inversión" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="reservations" name="Reservas" stroke="hsl(var(--accent))" strokeWidth={2.2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Stacked funnel-by-campaign bars (Calificados → Citas → Reservas) with data labels,
// plus the spend line on a second axis so over/under-converting campaigns stand out.
export function StackedSpendReservations({
  data,
  height = 300,
}: {
  data: { name: string; qualified: number; meetings: number; reservations: number; spend: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 16, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={(v) => compactMoney(v as number)}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v, name) => [name === "Inversión" ? compactMoney(v as number) : String(v), name]}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="qualified" name="Calificados" stackId="funnel" fill="hsl(var(--chart-3))" />
        <Bar yAxisId="left" dataKey="meetings" name="Citas" stackId="funnel" fill="hsl(var(--chart-4))" />
        <Bar yAxisId="left" dataKey="reservations" name="Reservas" stackId="funnel" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]}>
          <LabelList dataKey="reservations" position="top" fill="hsl(var(--foreground))" fontSize={10} />
        </Bar>
        <Line yAxisId="right" type="monotone" dataKey="spend" name="Inversión" stroke="hsl(var(--primary))" strokeWidth={2.2} dot={{ fill: "hsl(var(--primary))", r: 3 }}>
          <LabelList dataKey="spend" position="top" fill="hsl(var(--primary))" fontSize={10} formatter={(v) => compactMoney(Number(v ?? 0))} />
        </Line>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
