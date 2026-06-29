import assert from "node:assert/strict";

import { detectAnomalies, movingAverage } from "./forecast-insights";

const series = [
  { date: "1", value: 10 },
  { date: "2", value: 11 },
  { date: "3", value: 9 },
  { date: "4", value: 10 },
  { date: "5", value: 30 },
  { date: "6", value: 10 },
];

const anomalies = detectAnomalies(series);
assert.ok(
  anomalies.some((a) => a.date === "5" && a.direction === "up"),
  "spike at date 5 should be flagged as an up-anomaly"
);
// A clear spike over a longer flat-ish series crosses the high-severity gate (|z| ≥ 2.5).
const longSeries = Array.from({ length: 19 }, (_, i) => ({ date: String(i + 1), value: 10 }));
longSeries.push({ date: "spike", value: 40 });
const bigSpike = detectAnomalies(longSeries);
assert.ok(
  bigSpike.some((a) => a.date === "spike" && a.severity === "high"),
  "large spike over a long series should be flagged high"
);
assert.equal(detectAnomalies([{ date: "1", value: 5 }]).length, 0, "too few points -> no anomalies");
assert.equal(
  detectAnomalies([
    { date: "1", value: 5 },
    { date: "2", value: 5 },
    { date: "3", value: 5 },
  ]).length,
  0,
  "flat series (std 0) -> no anomalies"
);

const ma = movingAverage(series, 3);
assert.equal(ma.length, series.length, "moving average preserves length");
assert.equal(ma[0].value, 10, "first MA equals first value");
assert.equal(ma[2].value, Number(((10 + 11 + 9) / 3).toFixed(2)), "3rd MA equals avg of first three");

console.log("forecast-insights.self-check OK");
