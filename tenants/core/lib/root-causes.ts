import { delta, money, num, pct } from "@tenants/core/lib/format";
import type { Diagnostics, Kri } from "@tenants/core/sources/inteligencia";

export type RootCauseSeverity = "high" | "medium" | "low";

export type RootCauseEvidence = { label: string; value: string };

/** A runnable remediation tied to a root cause — dispatched through /api/inteligencia/command. */
export type RootCauseAction = {
  label: string;
  target: string;
  op: string;
  payload: Record<string, unknown>;
  variant?: "default" | "danger" | "ghost";
  destructive?: boolean;
  description?: string;
};

export type RootCauseInsight = {
  id: string;
  title: string;
  severity: RootCauseSeverity;
  detail: string;
  evidence: RootCauseEvidence[];
  recommendation?: string;
  /** Cookbook of recommended actions, enriched at the screen with live Meta IDs. */
  actions?: RootCauseAction[];
};

export type RootCauseCampaign = {
  name: string;
  spend: number;
  reservations: number;
  costPerReservation: number;
  frequency?: number;
  ctr?: number;
  action: "scale" | "pause" | "adjust";
};

export type RootCauseInput = {
  kris: Kri[];
  deltas: Diagnostics["deltas"];
  campaigns: RootCauseCampaign[];
  kpis: {
    leadToQualifiedRate: number;
    qualifiedToMeetingRate: number;
    meetingToReservation: number;
    leadToCustomerRate: number;
  };
};

const FREQ_FATIGUE = 3.0; // Meta frequency over which the same audience sees an ad repeatedly.
const SEVERITY_RANK: Record<RootCauseSeverity, number> = { high: 0, medium: 1, low: 2 };

function fmtKri(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return Number.isInteger(v) ? num(v) : v.toFixed(2);
}

// Deterministic, evidence-backed root-cause synthesis over the live KPIs/KRIs/campaigns —
// turns the terse upstream signals into data-driven insights with the supporting numbers.
export function buildRootCauseInsights(input: RootCauseInput): RootCauseInsight[] {
  const { kris, deltas, campaigns, kpis } = input;
  const insights: RootCauseInsight[] = [];

  // 1) KRIs already breaching their threshold — the deterministic KPI/KRI layer.
  for (const k of kris) {
    if (k.status === "green") continue;
    const gap = k.value - k.threshold;
    insights.push({
      id: `kri:${k.name}`,
      title: k.name,
      severity: k.status === "red" ? "high" : "medium",
      detail: k.reason || "Indicador de riesgo fuera de su umbral objetivo.",
      evidence: [
        { label: "Valor", value: fmtKri(k.value) },
        { label: "Umbral", value: fmtKri(k.threshold) },
        { label: "Brecha", value: `${gap >= 0 ? "+" : ""}${fmtKri(gap)}` },
      ],
    });
  }

  // 2) Period-over-period drops in the headline outcomes.
  const dRes = deltas.reservations;
  if (dRes && dRes.relative <= -0.1) {
    insights.push({
      id: "delta:reservations",
      title: "Caída de reservas vs período anterior",
      severity: dRes.relative <= -0.25 ? "high" : "medium",
      detail: "Las reservas confirmadas bajaron respecto al snapshot previo.",
      evidence: [
        { label: "Actual", value: num(dRes.current) },
        { label: "Anterior", value: num(dRes.previous) },
        { label: "Variación", value: delta(dRes.relative) },
      ],
      recommendation: "Revisar pauta activa y velocidad de seguimiento comercial del período.",
    });
  }
  const dRoas = deltas.roas;
  if (dRoas && dRoas.relative <= -0.1) {
    insights.push({
      id: "delta:roas",
      title: "Deterioro del ROAS",
      severity: dRoas.relative <= -0.25 ? "high" : "medium",
      detail: "El retorno sobre la inversión publicitaria cayó frente al período anterior.",
      evidence: [
        { label: "Actual", value: `${dRoas.current.toFixed(2)}x` },
        { label: "Anterior", value: `${dRoas.previous.toFixed(2)}x` },
        { label: "Variación", value: delta(dRoas.relative) },
      ],
      recommendation: "Reasignar presupuesto hacia las campañas con mejor costo por reserva.",
    });
  }

  // 3) Creative fatigue: campaigns whose frequency crossed the fatigue band.
  const fatigued = campaigns
    .filter((c) => (c.frequency ?? 0) >= FREQ_FATIGUE)
    .sort((a, b) => (b.frequency ?? 0) - (a.frequency ?? 0));
  if (fatigued.length) {
    insights.push({
      id: "campaign:fatigue",
      title: `${fatigued.length} campaña(s) en zona de fatiga de frecuencia`,
      severity: (fatigued[0]!.frequency ?? 0) >= 4 ? "high" : "medium",
      detail: `Frecuencia ≥ ${FREQ_FATIGUE.toFixed(1)} significa que el mismo público ve el anuncio repetidamente; suele subir el CPM y bajar el CTR.`,
      evidence: fatigued.slice(0, 3).map((c) => ({
        label: c.name,
        value: `freq ${(c.frequency ?? 0).toFixed(1)}${c.ctr != null ? ` · CTR ${pct(c.ctr)}` : ""}`,
      })),
      recommendation: "Refrescar creatividades o ampliar el público de estas campañas.",
    });
  }

  // 4) Spend without conversion: paused-flagged or zero-reservation campaigns still spending.
  const inefficient = campaigns
    .filter((c) => c.action === "pause" || (c.reservations === 0 && c.spend > 0))
    .sort((a, b) => b.spend - a.spend);
  if (inefficient.length) {
    const wasted = inefficient.reduce((s, c) => s + c.spend, 0);
    insights.push({
      id: "campaign:inefficient",
      title: `${inefficient.length} campaña(s) gastando sin convertir`,
      severity: "high",
      detail: "Campañas con inversión sin reservas atribuidas o ya marcadas para pausar.",
      evidence: inefficient.slice(0, 3).map((c) => ({
        label: c.name,
        value: `${money(c.spend)} · ${num(c.reservations)} reservas`,
      })),
      recommendation: `Reasignar el presupuesto en riesgo (~${money(wasted)}) a campañas con mejor costo por reserva.`,
    });
  }

  // 5) Funnel bottleneck: the stage furthest below its conversion target.
  const stages = [
    { label: "Lead → calificado", rate: kpis.leadToQualifiedRate, target: 0.4 },
    { label: "Calificado → cita", rate: kpis.qualifiedToMeetingRate, target: 0.5 },
    { label: "Cita → reserva", rate: kpis.meetingToReservation, target: 0.2 },
  ].filter((s) => s.target > 0 && s.rate < s.target * 0.7);
  if (stages.length) {
    const worst = stages.sort((a, b) => a.rate / a.target - b.rate / b.target)[0]!;
    insights.push({
      id: "funnel:bottleneck",
      title: `Cuello de botella en "${worst.label}"`,
      severity: worst.rate < worst.target * 0.5 ? "high" : "medium",
      detail: "Esta etapa convierte muy por debajo de su meta y limita todo el embudo aguas abajo.",
      evidence: [
        { label: "Tasa actual", value: pct(worst.rate) },
        { label: "Meta", value: pct(worst.target) },
        { label: "% del objetivo", value: `${Math.round((worst.rate / worst.target) * 100)}%` },
      ],
    });
  }

  return insights.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}
