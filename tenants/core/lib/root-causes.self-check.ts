import assert from "node:assert/strict";

import { buildRootCauseInsights, type RootCauseInput } from "./root-causes";

const input: RootCauseInput = {
  kris: [
    { name: "Frecuencia Meta", value: 4.2, threshold: 3, status: "red", reason: "Fatiga de creatividades" },
    { name: "CPL", value: 5, threshold: 8, status: "green", reason: "OK" },
  ],
  deltas: {
    reservations: { current: 12, previous: 20, absolute: -8, relative: -0.4 },
    roas: { current: 2.1, previous: 2.2, absolute: -0.1, relative: -0.045 },
  },
  campaigns: [
    { name: "Remarketing", spend: 1200, reservations: 0, costPerReservation: 0, frequency: 4.5, ctr: 0.008, action: "pause" },
    { name: "Prospecting", spend: 800, reservations: 6, costPerReservation: 133, frequency: 1.8, ctr: 0.02, action: "scale" },
  ],
  kpis: {
    leadToQualifiedRate: 0.1, // far below 0.4 target -> bottleneck
    qualifiedToMeetingRate: 0.6,
    meetingToReservation: 0.25,
    leadToCustomerRate: 0.05,
  },
};

const insights = buildRootCauseInsights(input);

assert.ok(insights.length >= 4, "should synthesize multiple evidence-based insights");
assert.ok(insights.every((i) => i.evidence.length > 0), "every insight carries supporting evidence");

// Red KRI surfaces as a high-severity insight with its threshold numbers.
const kri = insights.find((i) => i.id === "kri:Frecuencia Meta");
assert.ok(kri && kri.severity === "high", "red KRI -> high severity");
assert.ok(kri!.evidence.some((e) => e.label === "Umbral"), "KRI insight cites its threshold");

// Reservations dropped 40% -> high severity drop.
const drop = insights.find((i) => i.id === "delta:reservations");
assert.ok(drop && drop.severity === "high", "25%+ reservation drop -> high");

// Paused / zero-conversion campaign flagged with wasted spend in the recommendation.
const ineff = insights.find((i) => i.id === "campaign:inefficient");
assert.ok(ineff && /\$/.test(ineff.recommendation ?? ""), "inefficient-spend insight quantifies wasted budget");

// Weakest funnel stage identified.
const bottleneck = insights.find((i) => i.id === "funnel:bottleneck");
assert.ok(bottleneck && /Lead → calificado/.test(bottleneck.title), "weakest stage is the lead->qualified step");

// Green KRI must not appear.
assert.ok(!insights.some((i) => i.id === "kri:CPL"), "green KRI is not surfaced");

// High-severity insights sort first.
assert.equal(insights[0]!.severity, "high", "high severity insights come first");

console.log("root-causes.self-check OK");
