// Chart palette using CORE CSS tokens (hsl(var(--chart-N))).
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--accent))",
  "hsl(var(--primary))",
  "hsl(var(--muted-foreground))",
];

export function colorAt(i: number): string {
  return CHART_COLORS[i % CHART_COLORS.length];
}

export const TOOLTIP_STYLE = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12,
    fontSize: 12,
    color: "hsl(var(--foreground))",
    boxShadow: "var(--shadow-card)",
  },
  labelStyle: { color: "hsl(var(--muted-foreground))", marginBottom: 4 },
  itemStyle: { color: "hsl(var(--foreground))" },
} as const;
