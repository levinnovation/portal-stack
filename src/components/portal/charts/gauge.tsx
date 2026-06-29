"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

export function Gauge({
  value,
  threshold,
  height = 240,
  caption,
}: {
  value: number;
  threshold: number;
  height?: number;
  caption?: string;
}) {
  const v = Math.max(0, value);
  // Sensitive scale: pin the target at 75% of the arc so under/over-performance both
  // move the needle visibly instead of getting flattened against a fixed 0–100% domain.
  const max = threshold > 0 ? threshold / 0.75 : 1;
  const fill = Math.max(0, Math.min(100, (v / max) * 100));
  const ratio = threshold > 0 ? v / threshold : 0;
  const color =
    ratio >= 1 ? "hsl(var(--success))" : ratio >= 0.6 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  const statusCaption =
    caption ??
    (ratio >= 1
      ? `Meta ${Math.round(threshold * 100)}% · cumple (+${Math.round((v - threshold) * 100)} pts)`
      : `Meta ${Math.round(threshold * 100)}% · ${Math.round(ratio * 100)}% del objetivo`);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart
        innerRadius="65%"
        outerRadius="95%"
        data={[{ value: fill }]}
        startAngle={180}
        endAngle={0}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar background dataKey="value" fill={color} cornerRadius={10} />
        <text x="50%" y="56%" textAnchor="middle" fill="hsl(var(--foreground))" fontSize={24} fontWeight={700}>
          {Math.round(v * 100)}%
        </text>
        <text x="50%" y="72%" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={12}>
          {statusCaption}
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
