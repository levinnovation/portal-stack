"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { TOOLTIP_STYLE } from "./palette";

// Radar of heterogeneous KPIs normalized to "% of target" so funnel-stage conversions and
// financial ratios share one 0–120 axis. The grey ring = the 100% target; the accent area =
// current performance, making bottlenecks (the dents) jump out at a glance.
export function KpiRadar({
  data,
  height = 300,
}: {
  data: { metric: string; value: number; target: number }[];
  height?: number;
}) {
  const rows = data.map((d) => ({
    metric: d.metric,
    pct: d.target > 0 ? Math.min(120, Math.round((d.value / d.target) * 100)) : 0,
    target: 100,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={rows} outerRadius="72%" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 120]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
        <Radar
          name="Meta"
          dataKey="target"
          stroke="hsl(var(--muted-foreground))"
          fill="hsl(var(--muted-foreground))"
          fillOpacity={0.08}
        />
        <Radar
          name="% del objetivo"
          dataKey="pct"
          stroke="hsl(var(--accent))"
          fill="hsl(var(--accent))"
          fillOpacity={0.35}
        />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v, n) => [`${v}%`, n]} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
