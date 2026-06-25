import "server-only";

import { env, requireEnv } from "@tenants/core/lib/env";

export type InteligenciaRunType = "weekly" | "monthly";
export type KriStatus = "green" | "amber" | "red";

export type Kri = {
  name: string;
  value: number;
  threshold: number;
  status: KriStatus;
  reason: string;
};

export type ForecastPoint = {
  date: string;
  actual?: number;
  forecast?: number;
  lower?: number;
  upper?: number;
};

export type Anomaly = {
  metric: string;
  date: string;
  value: number;
  z_score?: number;
  zScore?: number;
  direction: "up" | "down";
  severity: "medium" | "high";
};

export type Predictions = {
  forecast_reservations_next_period?: number;
  forecastReservationsNextPeriod?: number;
  forecasts: Record<string, ForecastPoint[]>;
  anomalies: Anomaly[];
  method?: string;
};

export type Diagnostics = {
  deltas: Record<string, { current: number; previous: number; absolute: number; relative: number }>;
  waterfall: { name: string; value: number; type: "total" | "delta" }[];
  pareto: { name: string; value: number; cumulative: number }[];
  root_causes?: string[];
  rootCauses?: string[];
  source_breakdown?: { name: string; value: number }[];
  sourceBreakdown?: { name: string; value: number }[];
};

export type AbTestRecommendation = {
  id?: string;
  campaign?: string;
  hypothesis: string;
  variant_a?: string;
  variantA?: string;
  variant_b?: string;
  variantB?: string;
  primary_metric?: string;
  primaryMetric?: string;
  expected_lift?: number;
  expectedLift?: number;
  minimum_sample_size?: number;
  minimumSampleSize?: number;
  priority: "low" | "medium" | "high";
  status: string;
  rationale: string;
};

export type InteligenciaSnapshot = {
  runType: InteligenciaRunType;
  periodLabel: string;
  periodStart?: string;
  periodEnd?: string;
  updatedAt?: string;
  kpis: {
    leads: number;
    qualified: number;
    meetings: number;
    reservations: number;
    customers: number;
    adSpend: number;
    revenue: number;
    avgContractValue: number;
    customerLtv: number;
    cpl: number;
    cpql: number;
    costPerMeeting: number;
    costPerReservation: number;
    cac: number;
    roas: number;
    mer: number;
    ltvCacRatio: number;
    leadToQualifiedRate: number;
    qualifiedToMeetingRate: number;
    showUpRate: number;
    meetingToReservation: number;
    leadToCustomerRate: number;
    forecastReservationsNextPeriod: number;
  };
  funnel: { name: string; value: number }[];
  segments: { name: string; value: number }[];
  reps: { name: string; meetings: number; reservations: number; showUpRate: number; avgScore: number }[];
  campaigns: {
    name: string;
    spend: number;
    qualified: number;
    meetings: number;
    reservations: number;
    impressions?: number;
    clicks?: number;
    reach?: number;
    frequency?: number;
    ctr?: number;
    cpm?: number;
    costPerLead?: number;
    costPerQualified: number;
    costPerMeeting?: number;
    costPerReservation: number;
    roas?: number;
    action: "scale" | "pause" | "adjust";
    reason: string;
  }[];
  kris: Kri[];
  predictions: Predictions;
  diagnostics: Diagnostics;
  abTests: AbTestRecommendation[];
  recommendations: string[];
  sourceStatus?: Record<string, { ok: boolean; error?: string | null }>;
};

function normalizeFromApi(raw: unknown, runType: InteligenciaRunType): InteligenciaSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === "object" ? obj.data : obj) as Record<string, unknown>;
  const kpis = data.kpis as Record<string, unknown> | undefined;
  if (!kpis) return null;

  return {
    runType,
    periodLabel: String(data.period_label ?? data.periodLabel ?? ""),
    periodStart: String(data.period_start ?? data.periodStart ?? ""),
    periodEnd: String(data.period_end ?? data.periodEnd ?? ""),
    updatedAt: String(data.updated_at ?? data.updatedAt ?? ""),
    kpis: {
      leads: Number(kpis.leads ?? 0),
      qualified: Number(kpis.qualified ?? 0),
      meetings: Number(kpis.meetings ?? 0),
      reservations: Number(kpis.reservations ?? 0),
      customers: Number(kpis.customers ?? 0),
      adSpend: Number(kpis.ad_spend ?? kpis.adSpend ?? 0),
      revenue: Number(kpis.revenue ?? 0),
      avgContractValue: Number(kpis.avg_contract_value ?? kpis.avgContractValue ?? 0),
      customerLtv: Number(kpis.customer_ltv ?? kpis.customerLtv ?? 0),
      cpl: Number(kpis.cpl ?? 0),
      cpql: Number(kpis.cpql ?? 0),
      costPerMeeting: Number(kpis.cost_per_meeting ?? kpis.costPerMeeting ?? 0),
      costPerReservation: Number(kpis.cost_per_reservation ?? kpis.costPerReservation ?? 0),
      cac: Number(kpis.cac ?? 0),
      roas: Number(kpis.roas ?? 0),
      mer: Number(kpis.mer ?? 0),
      ltvCacRatio: Number(kpis.ltv_cac_ratio ?? kpis.ltvCacRatio ?? 0),
      leadToQualifiedRate: Number(kpis.lead_to_qualified_rate ?? kpis.leadToQualifiedRate ?? 0),
      qualifiedToMeetingRate: Number(kpis.qualified_to_meeting_rate ?? kpis.qualifiedToMeetingRate ?? 0),
      showUpRate: Number(kpis.show_up_rate ?? kpis.showUpRate ?? 0),
      meetingToReservation: Number(kpis.meeting_to_reservation ?? kpis.meetingToReservation ?? 0),
      leadToCustomerRate: Number(kpis.lead_to_customer_rate ?? kpis.leadToCustomerRate ?? 0),
      forecastReservationsNextPeriod: Number(kpis.forecast_reservations_next_period ?? kpis.forecastReservationsNextPeriod ?? 0),
    },
    funnel: Array.isArray(data.funnel) ? (data.funnel as { name: string; value: number }[]) : [],
    segments: Array.isArray(data.segments) ? (data.segments as { name: string; value: number }[]) : [],
    reps: Array.isArray(data.reps)
      ? (data.reps as { name: string; meetings: number; reservations: number; showUpRate: number; avgScore: number }[])
      : [],
    campaigns: Array.isArray(data.campaigns)
      ? (data.campaigns as InteligenciaSnapshot["campaigns"])
      : [],
    kris: Array.isArray(data.kris) ? (data.kris as Kri[]) : [],
    predictions:
      data.predictions && typeof data.predictions === "object"
        ? (data.predictions as Predictions)
        : { forecasts: {}, anomalies: [] },
    diagnostics:
      data.diagnostics && typeof data.diagnostics === "object"
        ? (data.diagnostics as Diagnostics)
        : { deltas: {}, waterfall: [], pareto: [] },
    abTests: Array.isArray(data.ab_tests)
      ? (data.ab_tests as AbTestRecommendation[])
      : Array.isArray(data.abTests)
        ? (data.abTests as AbTestRecommendation[])
        : [],
    recommendations: Array.isArray(data.recommendations) ? (data.recommendations as string[]) : [],
    sourceStatus:
      data.source_status && typeof data.source_status === "object"
        ? (data.source_status as Record<string, { ok: boolean; error?: string | null }>)
        : data.sourceStatus && typeof data.sourceStatus === "object"
          ? (data.sourceStatus as Record<string, { ok: boolean; error?: string | null }>)
          : undefined,
  };
}

function inteligenciaWorkspaceId(): string {
  return env.INTELIGENCIA_WORKSPACE_ID || env.NEXT_PUBLIC_WORKSPACE_ID;
}

export async function getInteligenciaData(runType: InteligenciaRunType): Promise<InteligenciaSnapshot> {
  const baseUrl = requireEnv("INTELIGENCIA_API_URL").replace(/\/$/, "");
  const apiKey = requireEnv("INTELIGENCIA_API_KEY");

  const res = await fetch(
    `${baseUrl}/api/v1/inteligencia/latest?run_type=${runType}&workspace_id=${encodeURIComponent(inteligenciaWorkspaceId())}`,
    {
      method: "GET",
      headers: { "X-API-Key": apiKey },
      next: { revalidate: 300 },
    },
  );
  if (!res.ok) throw new Error(`Inteligencia API error ${res.status}: ${await res.text()}`);
  const raw = await res.json().catch(() => null);
  const normalized = normalizeFromApi(raw, runType);
  if (!normalized) throw new Error("Inteligencia API returned an invalid payload.");
  return normalized;
}

export async function getInteligenciaTimeseries(metric: string, runType: InteligenciaRunType = "weekly", days = 30) {
  const baseUrl = requireEnv("INTELIGENCIA_API_URL").replace(/\/$/, "");
  const apiKey = requireEnv("INTELIGENCIA_API_KEY");
  const params = new URLSearchParams({
    metric,
    run_type: runType,
    days: String(days),
    workspace_id: inteligenciaWorkspaceId(),
  });
  const res = await fetch(`${baseUrl}/api/v1/inteligencia/timeseries?${params}`, {
    headers: { "X-API-Key": apiKey },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Inteligencia timeseries error ${res.status}: ${await res.text()}`);
  const raw = await res.json();
  const data = raw?.data && typeof raw.data === "object" ? raw.data : raw;
  return {
    metric: String(data.metric ?? metric),
    points: Array.isArray(data.points) ? (data.points as { date: string; value: number }[]) : [],
  };
}
