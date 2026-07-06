import "server-only";

import { env, requireEnv } from "@tenants/core/lib/env";

// ── Fuente de datos de Cashflows ─────────────────────────────────────────────
// Llama al worker `agent-core-finanzas-cashflows` (POST /api/v1/run) con la
// acción read-only `report_snapshot`: el flow relee el último periodo ya
// persistido (movimientos clasificados + plan por partida) desde Postgres y
// recalcula actuals-vs-plan sin volver a golpear Quickbase/SharePoint —
// mismo patrón que `sources/formalizaciones.ts`. La historia append-only
// (`agent_run_snapshots`) usa el endpoint genérico GET /api/v1/snapshots/*.
//
// Env requerido (Railway → portal-stack):
//   CASHFLOWS_API_URL — ej. https://agent-core-finanzas-cashflows-production.up.railway.app
//   CASHFLOWS_API_KEY — el API_KEY del worker de Cashflows

export type CashflowsSummary = {
  periodMonth: string;
  project: string;
  totalIncomeUsd: number;
  totalOutflowUsd: number;
  netPositionUsd: number;
  recoveryPct: number | null;
  deviationCount: number;
  movementsNeedingReview: number;
  generatedAt: string;
};

export type VarianceStatus = "ok" | "warning" | "breach";

export type VarianceRow = {
  project: string;
  categoryCode: string | null;
  categoryName: string | null;
  flowType: string | null;
  periodMonth: string;
  plannedAmountUsd: number;
  actualAmountUsd: number;
  varianceAmountUsd: number;
  variancePct: number | null;
  status: VarianceStatus;
};

export type TrustAccount = {
  accountNumber: string;
  project: string;
  bank: string;
  currency: string;
  trustName: string;
  cedulaJuridica: string;
  source: string;
};

export type CashflowsReport = {
  summary: CashflowsSummary;
  varianceRows: VarianceRow[];
  topVariances: VarianceRow[];
  accounts: TrustAccount[];
  dryRun: boolean;
};

const asNum = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return isFinite(n) ? n : 0;
};
const asOptNum = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isFinite(n) ? n : null;
};
const asStr = (v: unknown): string => (v === null || v === undefined ? "" : String(v));
const asOptStr = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));

function mapSummary(raw: unknown): CashflowsSummary {
  const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    periodMonth: asStr(s.period_month),
    project: asStr(s.project) || "ALL",
    totalIncomeUsd: asNum(s.total_income_usd),
    totalOutflowUsd: asNum(s.total_outflow_usd),
    netPositionUsd: asNum(s.net_position_usd),
    recoveryPct: asOptNum(s.recovery_pct),
    deviationCount: asNum(s.deviation_count),
    movementsNeedingReview: asNum(s.movements_needing_review),
    generatedAt: asStr(s.generated_at),
  };
}

function mapVarianceRow(raw: Record<string, unknown>): VarianceRow {
  const status = asStr(raw.status);
  return {
    project: asStr(raw.project),
    categoryCode: asOptStr(raw.category_code),
    categoryName: asOptStr(raw.category_name),
    flowType: asOptStr(raw.flow_type),
    periodMonth: asStr(raw.period_month),
    plannedAmountUsd: asNum(raw.planned_amount_usd),
    actualAmountUsd: asNum(raw.actual_amount_usd),
    varianceAmountUsd: asNum(raw.variance_amount_usd),
    variancePct: asOptNum(raw.variance_pct),
    status: (["ok", "warning", "breach"].includes(status) ? status : "ok") as VarianceStatus,
  };
}

function mapAccount(raw: Record<string, unknown>): TrustAccount {
  return {
    accountNumber: asStr(raw.account_number),
    project: asStr(raw.project),
    bank: asStr(raw.bank),
    currency: asStr(raw.currency),
    trustName: asStr(raw.trust_name),
    cedulaJuridica: asStr(raw.cedula_juridica),
    source: asStr(raw.source),
  };
}

/** Un punto de la historia append-only (`agent_run_snapshots` en Postgres). */
export type SnapshotHistoryPoint = {
  id: string;
  generatedAt: string;
  runKind: "cron" | "manual" | string;
  triggerSource: string;
  dryRun: boolean;
  summary: CashflowsSummary;
};

/** Serie temporal por métrica: `{ total_income_usd: [{t, v}, ...], ... }`. */
export type MetricTimeseries = Record<string, { t: string; v: number }[]>;

function snapshotsAuth() {
  return {
    baseUrl: requireEnv("CASHFLOWS_API_URL").replace(/\/$/, ""),
    apiKey: requireEnv("CASHFLOWS_API_KEY"),
  };
}

/**
 * Snapshot en vivo del periodo actual (o el pedido via `periodMonth`/`project`):
 * resumen + variance por categoría + top desviaciones + cuentas fideicomiso,
 * recalculado desde lo ya persistido — sin ingestión (POST /api/v1/run,
 * action: "report_snapshot").
 */
export async function getCashflowsReport(
  params: { periodMonth?: string; project?: string } = {},
): Promise<CashflowsReport> {
  const baseUrl = requireEnv("CASHFLOWS_API_URL").replace(/\/$/, "");
  const apiKey = requireEnv("CASHFLOWS_API_KEY");

  const res = await fetch(`${baseUrl}/api/v1/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify({
      inputs: {
        action: "report_snapshot",
        ...(params.periodMonth ? { period_month: params.periodMonth } : {}),
        ...(params.project ? { project: params.project } : {}),
      },
      workspace_id: env.NEXT_PUBLIC_WORKSPACE_ID,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Cashflows API error ${res.status}: ${await res.text()}`);

  const payload = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  const result = (payload?.result ?? {}) as Record<string, unknown>;
  if (result.status !== "success") {
    throw new Error(`Cashflows API devolvió un payload inválido: ${JSON.stringify(result).slice(0, 300)}`);
  }

  return {
    summary: mapSummary(result.summary),
    varianceRows: Array.isArray(result.variance_rows) ? (result.variance_rows as Record<string, unknown>[]).map(mapVarianceRow) : [],
    topVariances: Array.isArray(result.top_variances) ? (result.top_variances as Record<string, unknown>[]).map(mapVarianceRow) : [],
    accounts: Array.isArray(result.accounts) ? (result.accounts as Record<string, unknown>[]).map(mapAccount) : [],
    dryRun: result.dry_run !== false,
  };
}

/**
 * Historia append-only del pipeline (cada corrida real y cada refresh del
 * snapshot) para las tarjetas de tendencia y la tabla drill-down de
 * "Histórico" — GET /api/v1/snapshots/history.
 */
export async function getCashflowsHistory(params: {
  from?: string | null;
  to?: string | null;
  runKind?: string;
  limit?: number;
} = {}): Promise<SnapshotHistoryPoint[]> {
  const { baseUrl, apiKey } = snapshotsAuth();
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.runKind) qs.set("run_kind", params.runKind);
  qs.set("limit", String(params.limit ?? 500));

  const res = await fetch(`${baseUrl}/api/v1/snapshots/history?${qs.toString()}`, {
    headers: { "X-API-Key": apiKey },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Cashflows snapshots API error ${res.status}: ${await res.text()}`);

  const payload = (await res.json().catch(() => null)) as { history?: unknown[] } | null;
  const rows = Array.isArray(payload?.history) ? (payload!.history as Record<string, unknown>[]) : [];
  return rows.map((r) => ({
    id: asStr(r.id),
    generatedAt: asStr(r.generated_at),
    runKind: asStr(r.run_kind) || "cron",
    triggerSource: asStr(r.trigger_source),
    dryRun: r.dry_run === true,
    summary: mapSummary(r.summary),
  }));
}

/**
 * Series temporales de métricas escalares (extraídas de `summary_json`) para
 * el gráfico de tendencia — GET /api/v1/snapshots/timeseries.
 */
export async function getCashflowsTimeseries(
  metrics: string[],
  params: { from?: string | null; to?: string | null; runKind?: string } = {},
): Promise<MetricTimeseries> {
  const { baseUrl, apiKey } = snapshotsAuth();
  const qs = new URLSearchParams();
  qs.set("metrics", metrics.join(","));
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.runKind) qs.set("run_kind", params.runKind);

  const res = await fetch(`${baseUrl}/api/v1/snapshots/timeseries?${qs.toString()}`, {
    headers: { "X-API-Key": apiKey },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Cashflows timeseries API error ${res.status}: ${await res.text()}`);

  const payload = (await res.json().catch(() => null)) as { series?: MetricTimeseries } | null;
  return payload?.series ?? {};
}
