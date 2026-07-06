"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TOOLTIP_STYLE } from "./palette";
import { resolveFormat, type FormatKind } from "@/components/portal/chart-format";
import { compactMoney } from "@tenants/core/lib/format";
import type { Datum } from "./bar-horizontal";

type WaterfallRow = Datum & { base: number; positive: number; negative: number };

/**
 * Cumulative variance bridge: each bar floats from the running total of the
 * previous bars (a transparent `base` stack), colored green (favorable) or
 * red (unfavorable) — distinct from the simpler `<WaterfallChart>` in
 * `waterfall.tsx` (Inteligencia's diagnóstico chart, which plots each value
 * directly with no cumulative offset). Used by the Cashflows dashboard's
 * "top desviaciones por partida" chart. `data` should already be signed
 * deltas (e.g. `variance_amount_usd` per categoría); this component does not
 * resort them.
 */
export function VarianceWaterfall({
  data,
  height,
  format = "money",
  positiveColor = "hsl(var(--success))",
  negativeColor = "hsl(var(--destructive))",
}: {
  data: Datum[];
  height?: number;
  format?: FormatKind;
  positiveColor?: string;
  negativeColor?: string;
}) {
  const fmt = resolveFormat(format);
  let running = 0;
  const rows: WaterfallRow[] = data.map((d) => {
    const start = running;
    running += d.value;
    return {
      ...d,
      base: Math.min(start, running),
      positive: d.value >= 0 ? Math.abs(d.value) : 0,
      negative: d.value < 0 ? Math.abs(d.value) : 0,
    };
  });
  const h = height ?? Math.max(220, rows.length * 34 + 60);

  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-35}
          textAnchor="end"
          height={64}
          tickFormatter={(v: string) => (v.length > 20 ? v.slice(0, 19) + "…" : v)}
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={(v: number) => compactMoney(v)}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(_v, _n, item) => [fmt(item?.payload?.value ?? 0), "Variación"]}
          labelFormatter={(label) => String(label)}
        />
        <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="positive" stackId="wf" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {rows.map((r, i) => (
            <Cell key={`pos-${i}`} fill={r.value >= 0 ? positiveColor : "transparent"} />
          ))}
        </Bar>
        <Bar dataKey="negative" stackId="wf" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {rows.map((r, i) => (
            <Cell key={`neg-${i}`} fill={r.value < 0 ? negativeColor : "transparent"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
