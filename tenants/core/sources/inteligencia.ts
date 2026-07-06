import "server-only";

import { env, requireEnv } from "@tenants/core/lib/env";
import { crcToUsd, getCrcPerUsd } from "@tenants/core/lib/fx";

export type InteligenciaRunType =
  | "today"
  | "weekly"
  | "monthly"
  | "7d"
  | "1m"
  | "3m"
  | "6m"
  | "12m"
  | "full";

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

export type SourceHeatmap = {
  sources: string[];
  buckets: string[];
  cells: { source: string; bucket: string; value: number }[];
  bucket_type: "daily" | "weekly";
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

export type SegmentEnriched = {
  name: string;
  value: number;
  leads: number;
  qualified: number;
  qualifiedRate: number;
  meetings: number;
  avgScore: number;
  topSource: string;
};

export type PostMetric = {
  id?: string;
  postId: string;
  adId: string;
  adName: string;
  campaignName: string;
  permalink?: string | null;
  source: "FB" | "IG" | string;
  format: "reel" | "photo" | "carousel" | "other";
  impressions: number;
  clicks: number;
  reach: number;
  spend: number;
  frequency: number;
  ctr: number;
  cpm: number;
  reactions: number;
  comments: number;
  shares: number;
  engagements: number;
  engagementRate: number;
  qualifiedLeads: number | null;
};

export type LeadTemp = "cold" | "warm" | "hot";

export type LeadImpact = {
  id: string;
  hsContactId: string;
  name: string;
  email: string;
  phone: string;
  owner: string;
  segment: string;
  source: string;
  campaign: string;
  lifecycle: string;
  leadStatus: string;
  score: number;
  daysSinceTouch: number | null;
  lastTouchAt: string | null;
  currentTemp: LeadTemp;
  tempScore: number;
  prevTemp: LeadTemp | null;
  observedTransition: string | null;
  predictedTemp: LeadTemp;
  predictedTransition: string;
  transitionConfidence: number;
  direction: "warming" | "cooling" | "stable";
  revenueAtRisk: number;
  nextBestAction: string;
  prescriptionIds: string[];
};

export type Prescription = {
  id: string;
  scope: "campaign" | "lead";
  type: string;
  title: string;
  reason: string;
  impactedCount: number;
  revenueAtRisk: number;
  transitionSummary: { label: string; count: number }[];
  priority: "high" | "medium" | "low";
  leadFilter?: Record<string, unknown>;
  campaignData?: {
    spend?: number;
    cpl?: number;
    cpql?: number;
    roas?: number;
    meetings?: number;
    reservations?: number;
  };
};

export type TransitionMatrix = {
  states: string[];
  cells: { from: string; to: string; value: number }[];
  sankey: {
    nodes: { name: string; id: string }[];
    links: { source: number; target: number; value: number }[];
  };
};

export type LeadTemperatureSummary = {
  hot: number;
  warm: number;
  cold: number;
  total: number;
  warming: number;
  cooling: number;
  netMomentum: number;
  hotPct: number;
  warmPct: number;
  coldPct: number;
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
  segments: SegmentEnriched[];
  segmentSourceMatrix?: Record<string, number | string>[];
  reps: { name: string; meetings: number; reservations: number; showUpRate: number; avgScore: number }[];
  sourceHeatmap?: SourceHeatmap;
  campaigns: {
    name: string;
    campaignId?: string;
    platform?: string;
    permalink?: string | null;
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
  prescriptions: Prescription[];
  transitionMatrix?: TransitionMatrix;
  leadTemperatureSummary?: LeadTemperatureSummary;
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
    segments: Array.isArray(data.segments)
      ? (data.segments as SegmentEnriched[])
      : [],
    segmentSourceMatrix: Array.isArray(data.segment_source_matrix)
      ? (data.segment_source_matrix as Record<string, number>[])
      : undefined,
    reps: Array.isArray(data.reps)
      ? (data.reps as { name: string; meetings: number; reservations: number; showUpRate: number; avgScore: number }[])
      : [],
    sourceHeatmap:
      data.source_heatmap && typeof data.source_heatmap === "object" && (data.source_heatmap as SourceHeatmap).sources
        ? (data.source_heatmap as SourceHeatmap)
        : data.sourceHeatmap && typeof data.sourceHeatmap === "object" && (data.sourceHeatmap as SourceHeatmap).sources
          ? (data.sourceHeatmap as SourceHeatmap)
          : undefined,
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
    prescriptions: Array.isArray(data.prescriptions)
      ? (data.prescriptions as unknown[]).map((p: unknown) => {
          const pp = p as Record<string, unknown>;
          return {
            id: String(pp.id ?? ""),
            scope: (pp.scope ?? "campaign") as Prescription["scope"],
            type: String(pp.type ?? "adjust"),
            title: String(pp.title ?? ""),
            reason: String(pp.reason ?? ""),
            impactedCount: Number(pp.impacted_count ?? pp.impactedCount ?? 0),
            revenueAtRisk: Number(pp.revenue_at_risk ?? pp.revenueAtRisk ?? 0),
            transitionSummary: Array.isArray(pp.transition_summary)
              ? (pp.transition_summary as { label: string; count: number }[])
              : [],
            priority: (pp.priority ?? "medium") as Prescription["priority"],
            leadFilter: (pp.lead_filter ?? pp.leadFilter) as Record<string, unknown> | undefined,
            campaignData: pp.campaign_data
              ? (pp.campaign_data as Prescription["campaignData"])
              : undefined,
          } satisfies Prescription;
        })
      : [],
    transitionMatrix:
      data.transition_matrix && typeof data.transition_matrix === "object" && (data.transition_matrix as TransitionMatrix).cells
        ? (data.transition_matrix as TransitionMatrix)
        : data.transitionMatrix && typeof data.transitionMatrix === "object"
          ? (data.transitionMatrix as TransitionMatrix)
          : undefined,
    leadTemperatureSummary: (() => {
      const raw = (data.lead_temperature_summary ?? data.leadTemperatureSummary) as Record<string, unknown> | undefined;
      if (!raw || typeof raw !== "object" || raw.total == null) return undefined;
      return {
        hot: Number(raw.hot ?? 0),
        warm: Number(raw.warm ?? 0),
        cold: Number(raw.cold ?? 0),
        total: Number(raw.total ?? 0),
        warming: Number(raw.warming ?? 0),
        cooling: Number(raw.cooling ?? 0),
        netMomentum: Number(raw.net_momentum ?? raw.netMomentum ?? 0),
        hotPct: Number(raw.hot_pct ?? raw.hotPct ?? 0),
        warmPct: Number(raw.warm_pct ?? raw.warmPct ?? 0),
        coldPct: Number(raw.cold_pct ?? raw.coldPct ?? 0),
      } satisfies LeadTemperatureSummary;
    })(),
  };
}

/** Workspace id the BI backend persists snapshots under (control-plane tenant
 * UUID), distinct from the theming id in NEXT_PUBLIC_WORKSPACE_ID. */
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
    }
  );
  if (!res.ok) throw new Error(`Inteligencia API error ${res.status}: ${await res.text()}`);
  const raw = await res.json().catch(() => null);
  const normalized = normalizeFromApi(raw, runType);
  if (!normalized) throw new Error("Inteligencia API returned an invalid payload.");
  return normalized;
}

/**
 * Like getInteligenciaData, but returns null when the selected window has no
 * silver snapshot yet (API 404). Each time-slicer window (7d/1m/3m/6m/12m/full)
 * is its own on-demand snapshot, so an absent window is an expected empty state,
 * not an outage — the page renders the ETL trigger so the user can generate it.
 * Genuine failures (5xx, network, invalid payload) still throw and surface the
 * error boundary.
 */
export async function getInteligenciaDataOrNull(
  runType: InteligenciaRunType
): Promise<InteligenciaSnapshot | null> {
  const baseUrl = requireEnv("INTELIGENCIA_API_URL").replace(/\/$/, "");
  const apiKey = requireEnv("INTELIGENCIA_API_KEY");

  const res = await fetch(
    `${baseUrl}/api/v1/inteligencia/latest?run_type=${runType}&workspace_id=${encodeURIComponent(inteligenciaWorkspaceId())}`,
    {
      method: "GET",
      headers: { "X-API-Key": apiKey },
      next: { revalidate: 300 },
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Inteligencia API error ${res.status}: ${await res.text()}`);
  const raw = await res.json().catch(() => null);
  return normalizeFromApi(raw, runType);
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

// ── ETL trigger (on-demand silver-layer refresh) ────────────────────────────
// Reuses the standard agent contract: POST /api/v1/run (async) returns a
// trace_id; terminal status comes from GET /api/v1/jobs/{trace}; live steps come
// from Langfuse (see app/api/inteligencia/etl/status/[traceId]). The full flow
// (ETL ingest + LLM narrative) runs for the selected window with refresh=true.
export type EtlRunAccepted = { traceId: string; status: string };

export async function triggerEtlRun(runType: InteligenciaRunType): Promise<EtlRunAccepted> {
  const baseUrl = requireEnv("INTELIGENCIA_API_URL").replace(/\/$/, "");
  const apiKey = requireEnv("INTELIGENCIA_API_KEY");
  const res = await fetch(`${baseUrl}/api/v1/inteligencia/etl/run`, {
    method: "POST",
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ run_type: runType, workspace_id: inteligenciaWorkspaceId() }),
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Inteligencia run ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as { trace_id?: string; task_id?: string; status?: string };
  const traceId = json.trace_id || json.task_id || "";
  if (!traceId) throw new Error("Inteligencia no devolvió trace_id");
  return { traceId, status: json.status || "accepted" };
}

export type EtlJobStatus = { status: "running" | "success" | "failed" | "unknown"; result?: unknown; error?: string };

export async function getInteligenciaPosts(runType: InteligenciaRunType, limit = 50): Promise<PostMetric[]> {
  const baseUrl = requireEnv("INTELIGENCIA_API_URL").replace(/\/$/, "");
  const apiKey = requireEnv("INTELIGENCIA_API_KEY");
  const params = new URLSearchParams({
    run_type: runType,
    workspace_id: inteligenciaWorkspaceId(),
    limit: String(limit),
  });
  const res = await fetch(`${baseUrl}/api/v1/inteligencia/posts?${params}`, {
    headers: { "X-API-Key": apiKey },
    next: { revalidate: 300 },
  });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Inteligencia posts error ${res.status}: ${await res.text()}`);
  const raw = await res.json();
  const posts = (raw?.data?.posts ?? raw?.posts ?? []) as Record<string, unknown>[];
  // Meta bills CORE's account in colones, so per-ad/post spend & CPM arrive in
  // CRC; convert to USD at the daily rate so the whole UI is consistently USD.
  const crcPerUsd = await getCrcPerUsd();
  return posts.map((p) => ({
    id: String(p.id ?? ""),
    postId: String(p.postId ?? p.post_id ?? ""),
    adId: String(p.adId ?? p.ad_id ?? ""),
    adName: String(p.adName ?? p.ad_name ?? ""),
    campaignName: String(p.campaignName ?? p.campaign_name ?? ""),
    permalink: (p.permalink as string | null | undefined) ?? null,
    source: String(p.source ?? "FB") as PostMetric["source"],
    format: String(p.format ?? "other") as PostMetric["format"],
    impressions: Number(p.impressions ?? 0),
    clicks: Number(p.clicks ?? 0),
    reach: Number(p.reach ?? 0),
    spend: crcToUsd(Number(p.spend ?? 0), crcPerUsd),
    frequency: Number(p.frequency ?? 0),
    ctr: Number(p.ctr ?? 0),
    cpm: crcToUsd(Number(p.cpm ?? 0), crcPerUsd),
    reactions: Number(p.reactions ?? 0),
    comments: Number(p.comments ?? 0),
    shares: Number(p.shares ?? 0),
    engagements: Number(p.engagements ?? 0),
    engagementRate: Number(p.engagementRate ?? p.engagement_rate ?? 0),
    qualifiedLeads: p.qualifiedLeads != null ? Number(p.qualifiedLeads) : null,
  }));
}

function normalizeLeadImpact(raw: unknown): LeadImpact {
  const p = raw as Record<string, unknown>;
  return {
    id: String(p.id ?? ""),
    hsContactId: String(p.hs_contact_id ?? p.hsContactId ?? ""),
    name: String(p.name ?? "—"),
    email: String(p.email ?? ""),
    phone: String(p.phone ?? ""),
    owner: String(p.owner ?? ""),
    segment: String(p.segment ?? "unknown"),
    source: String(p.source ?? "unknown"),
    campaign: String(p.campaign ?? "unknown"),
    lifecycle: String(p.lifecycle ?? "lead"),
    leadStatus: String(p.lead_status ?? p.leadStatus ?? ""),
    score: Number(p.score ?? 0),
    daysSinceTouch: p.days_since_touch != null ? Number(p.days_since_touch ?? p.daysSinceTouch) : null,
    lastTouchAt: p.last_touch_at != null ? String(p.last_touch_at ?? p.lastTouchAt) : null,
    currentTemp: (p.current_temp ?? p.currentTemp ?? "cold") as LeadTemp,
    tempScore: Number(p.temp_score ?? p.tempScore ?? 0),
    prevTemp: p.prev_temp != null ? (p.prev_temp as LeadTemp) : (p.prevTemp != null ? (p.prevTemp as LeadTemp) : null),
    observedTransition: p.observed_transition != null ? String(p.observed_transition) : (p.observedTransition != null ? String(p.observedTransition) : null),
    predictedTemp: (p.predicted_temp ?? p.predictedTemp ?? "cold") as LeadTemp,
    predictedTransition: String(p.predicted_transition ?? p.predictedTransition ?? "stable"),
    transitionConfidence: Number(p.transition_confidence ?? p.transitionConfidence ?? 0),
    direction: (p.direction ?? "stable") as LeadImpact["direction"],
    revenueAtRisk: Number(p.revenue_at_risk ?? p.revenueAtRisk ?? 0),
    nextBestAction: String(p.next_best_action ?? p.nextBestAction ?? ""),
    prescriptionIds: Array.isArray(p.prescription_ids) ? (p.prescription_ids as string[]) : (Array.isArray(p.prescriptionIds) ? (p.prescriptionIds as string[]) : []),
  };
}

export async function getInteligenciaLeads(
  runType: InteligenciaRunType,
  opts?: {
    prescriptionId?: string;
    direction?: string;
    temp?: string;
    segment?: string;
    campaign?: string;
    owner?: string;
    limit?: number;
  }
): Promise<LeadImpact[]> {
  const baseUrl = requireEnv("INTELIGENCIA_API_URL").replace(/\/$/, "");
  const apiKey = requireEnv("INTELIGENCIA_API_KEY");
  const wsId = inteligenciaWorkspaceId();

  const params = new URLSearchParams({ run_type: runType, workspace_id: wsId });
  if (opts?.prescriptionId) params.set("prescription_id", opts.prescriptionId);
  if (opts?.direction) params.set("direction", opts.direction);
  if (opts?.temp) params.set("temp", opts.temp);
  if (opts?.segment) params.set("segment", opts.segment);
  if (opts?.campaign) params.set("campaign", opts.campaign);
  if (opts?.owner) params.set("owner", opts.owner);
  if (opts?.limit) params.set("limit", String(opts.limit));

  const res = await fetch(`${baseUrl}/api/v1/inteligencia/leads?${params}`, {
    headers: { "X-API-Key": apiKey },
    next: { revalidate: 120 },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: { leads?: unknown[] } };
  return (json.data?.leads ?? []).map(normalizeLeadImpact);
}

export async function getEtlJob(traceId: string): Promise<EtlJobStatus> {
  const baseUrl = requireEnv("INTELIGENCIA_API_URL").replace(/\/$/, "");
  const apiKey = requireEnv("INTELIGENCIA_API_KEY");
  const res = await fetch(`${baseUrl}/api/v1/inteligencia/etl/status/${encodeURIComponent(traceId)}`, {
    headers: { "X-API-Key": apiKey },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Inteligencia jobs ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as { status?: string; result?: { error?: string } };
  return {
    status: (json.status as EtlJobStatus["status"]) || "unknown",
    result: json.result,
    error: json.result?.error,
  };
}
