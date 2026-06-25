"use client";

import { Area, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { resolveFormat, type FormatKind } from "@/components/portal/chart-format";
import { TOOLTIP_STYLE } from "./palette";

export function ForecastLine({
  data,
  height = 300,
  format = "num",
}: {
  data: { date: string; actual?: number; forecast?: number; lower?: number; upper?: number }[];
  height?: number;
  format?: FormatKind;
}) {
  const fmt = resolveFormat(format);
  const normalized = data.map((row) => ({
    ...row,
    bandHigh: row.upper,
    bandLow: row.lower,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={normalized} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => fmt(v as number)} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => fmt(v as number)} />
        <Area type="monotone" dataKey="bandHigh" stroke="none" fill="#2dd4bf22" name="Banda superior" />
        <Area type="monotone" dataKey="bandLow" stroke="none" fill="hsl(var(--background))" name="Banda inferior" />
        <Line type="monotone" dataKey="actual" name="Real" stroke="var(--primary)" strokeWidth={2.4} dot={false} />
        <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#2dd4bf" strokeDasharray="5 5" strokeWidth={2.4} />
      </LineChart>
    </ResponsiveContainer>
  );
}
