"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

export function Gauge({
  value,
  threshold,
  height = 240,
}: {
  value: number;
  threshold: number;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value));
  const thresholdPct = Math.max(0, Math.min(1, threshold));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart
        innerRadius="65%"
        outerRadius="95%"
        data={[{ value: pct * 100 }]}
        startAngle={180}
        endAngle={0}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar background dataKey="value" fill="hsl(var(--accent))" cornerRadius={10} />
        <text x="50%" y="56%" textAnchor="middle" fill="hsl(var(--foreground))" fontSize={24} fontWeight={700}>
          {Math.round(pct * 100)}%
        </text>
        <text x="50%" y="72%" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={12}>
          Umbral {Math.round(thresholdPct * 100)}%
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
