"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TOOLTIP_STYLE } from "./palette";
import { compactMoney, money } from "@tenants/core/lib/format";

export type TrendPoint = { dia: string; valor: number };

// Tendencia temporal (ej. monto atribuido por fecha de firma). Por defecto formatea
// como CRC; el eje X muestra MM-DD.
export function AreaTrend({
  data,
  height = 280,
  format = (v: number) => money(v),
  axisFormat = (v: number) => compactMoney(v),
  label = "Monto",
}: {
  data: TrendPoint[];
  height?: number;
  format?: (v: number) => string;
  axisFormat?: (v: number) => string;
  label?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradValor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1, #5b8cff)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--chart-1, #5b8cff)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="dia"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={(d: string) => d.slice(5)}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={(v: number) => axisFormat(v)}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v) => [format(v as number), label]}
          labelFormatter={(l) => `${l}`}
        />
        <Area
          type="monotone"
          dataKey="valor"
          stroke="var(--chart-1, #5b8cff)"
          strokeWidth={2}
          fill="url(#gradValor)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
