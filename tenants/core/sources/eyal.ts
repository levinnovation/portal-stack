import "server-only";

import { requireEnv } from "@tenants/core/lib/env";

// ── Fuente de datos de Eyal (PM Cronograma) ──────────────────────────────────
// Llama al worker `agent-eyal` (POST /api/v1/run) con el trigger read-only
// `report_snapshot`: el flow lee del historial append-only en Postgres
// (`eyal_report_snapshots`, poblado en cada `cron_daily_checkin`) — zero
// llamadas en vivo a MS Graph/Quickbase/Teams/WhatsApp. Soporta time-travel
// por `snapshot_id` y ventanas de historia (`window`) para el timeseries.
//
// Env requerido (Railway → portal-stack):
//   EYAL_API_URL  — ej. https://agent-eyal-production.up.railway.app
//   EYAL_API_KEY  — el API_KEY del worker eyal

export type EyalWindow = "1w" | "1m" | "3m" | "6m" | "1y" | "full";

export type EyalKpis = {
  incompleteCount: number | null;
  urgentCount: number | null;
  overdueCount: number | null;
  avgProgress: number | null;
  arNext30: number | null;
  apNext30: number | null;
  net30: number | null;
  ocExposure: number | null;
  activeEtapasCount: number | null;
  soldPct: number | null;
  reservedPct: number | null;
  availablePct: number | null;
  totalUnits: number | null;
  soldUnits: number | null;
  reservedUnits: number | null;
  availableUnits: number | null;
  ocTotalCount: number | null;
  ocProjectsCount: number | null;
  projectsRed: number;
  projectsYellow: number;
  projectsGreen: number;
  riskQueueCount: number;
};

export type EyalSnapshot = {
  id: string;
  runDate: string;
  generatedAt: string;
  kpis: EyalKpis;
  reportSections: Record<string, unknown>;
};

export type EyalHistoryPoint = {
  id: string;
  runDate: string;
  generatedAt: string;
  kpis: EyalKpis;
};

const asNum = (v: unknown): number | null => (typeof v === "number" && isFinite(v) ? v : null);

function mapKpis(raw: unknown): EyalKpis {
  const k = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    incompleteCount: asNum(k.incomplete_count),
    urgentCount: asNum(k.urgent_count),
    overdueCount: asNum(k.overdue_count),
    avgProgress: asNum(k.avg_progress),
    arNext30: asNum(k.ar_next_30),
    apNext30: asNum(k.ap_next_30),
    net30: asNum(k.net_30),
    ocExposure: asNum(k.oc_exposure),
    activeEtapasCount: asNum(k.active_etapas_count),
    soldPct: asNum(k.sold_pct),
    reservedPct: asNum(k.reserved_pct),
    availablePct: asNum(k.available_pct),
    totalUnits: asNum(k.total_units),
    soldUnits: asNum(k.sold_units),
    reservedUnits: asNum(k.reserved_units),
    availableUnits: asNum(k.available_units),
    ocTotalCount: asNum(k.oc_total_count),
    ocProjectsCount: asNum(k.oc_projects_count),
    projectsRed: asNum(k.projects_red) ?? 0,
    projectsYellow: asNum(k.projects_yellow) ?? 0,
    projectsGreen: asNum(k.projects_green) ?? 0,
    riskQueueCount: asNum(k.risk_queue_count) ?? 0,
  };
}

function mapSnapshot(raw: unknown): EyalSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  return {
    id: String(s.id || ""),
    runDate: String(s.run_date || ""),
    generatedAt: String(s.generated_at || ""),
    kpis: mapKpis(s.kpis),
    reportSections: (s.report_sections as Record<string, unknown>) || {},
  };
}

async function callEyal(inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
  const baseUrl = requireEnv("EYAL_API_URL").replace(/\/$/, "");
  const apiKey = requireEnv("EYAL_API_KEY");

  const res = await fetch(`${baseUrl}/api/v1/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify({ inputs }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Eyal API error ${res.status}: ${await res.text()}`);

  const payload = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  const result = (payload?.result ?? {}) as Record<string, unknown>;
  if (result.status !== "success") {
    throw new Error(`Eyal API devolvió un payload inválido: ${JSON.stringify(result).slice(0, 300)}`);
  }
  return result;
}

/**
 * Snapshot puntual (por id — vista "time travel" — o el más reciente) más la
 * historia de KPIs en la ventana dada, para el timeseries.
 */
export async function getEyalReport(
  params: { snapshotId?: string; window?: EyalWindow } = {},
): Promise<{ snapshot: EyalSnapshot | null; history: EyalHistoryPoint[]; window: EyalWindow }> {
  const result = await callEyal({
    trigger: "report_snapshot",
    ...(params.snapshotId ? { snapshot_id: params.snapshotId } : {}),
    window: params.window ?? "1m",
  });
  const rawHistory = Array.isArray(result.history) ? (result.history as Record<string, unknown>[]) : [];
  return {
    snapshot: mapSnapshot(result.snapshot),
    history: rawHistory.map((row) => ({
      id: String(row.id || ""),
      runDate: String(row.run_date || ""),
      generatedAt: String(row.generated_at || ""),
      kpis: mapKpis(row.kpis),
    })),
    window: (result.window as EyalWindow) || params.window || "1m",
  };
}
