export type SeriesPoint = { date: string; value: number };

export type DerivedAnomaly = {
  metric: string;
  date: string;
  value: number;
  z_score: number;
  direction: "up" | "down";
  severity: "medium" | "high";
};

// ponytail: global mean/std z-score (population). Ceiling: ignores trend/seasonality so a
// steadily climbing series can flag its endpoints. Upgrade path: rolling window or STL.
export function detectAnomalies(
  series: SeriesPoint[],
  opts: { metric?: string; medium?: number; high?: number } = {}
): DerivedAnomaly[] {
  const metric = opts.metric ?? "reservations";
  const medium = opts.medium ?? 1.5; // more sensitive than a typical |z|>3 gate
  const high = opts.high ?? 2.5;
  const vals = series.map((p) => p.value).filter((v) => Number.isFinite(v));
  if (vals.length < 3) return [];
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  const std = Math.sqrt(variance);
  if (std === 0) return [];
  const out: DerivedAnomaly[] = [];
  for (const p of series) {
    if (!Number.isFinite(p.value)) continue;
    const z = (p.value - mean) / std;
    const az = Math.abs(z);
    if (az < medium) continue;
    out.push({
      metric,
      date: p.date,
      value: p.value,
      z_score: Number(z.toFixed(2)),
      direction: z >= 0 ? "up" : "down",
      severity: az >= high ? "high" : "medium",
    });
  }
  return out;
}

// Trailing simple moving average; keeps the series length so it overlays the raw line.
export function movingAverage(series: SeriesPoint[], window = 3): SeriesPoint[] {
  if (window < 2) return series.map((p) => ({ date: p.date, value: p.value }));
  return series.map((p, i) => {
    const slice = series
      .slice(Math.max(0, i - window + 1), i + 1)
      .map((s) => s.value)
      .filter(Number.isFinite);
    const avg = slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : p.value;
    return { date: p.date, value: Number(avg.toFixed(2)) };
  });
}
