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
  // Treasury KPIs merged in from `_build_treasury_sections`' `summary_extra`.
  arTotalUsd: number;
  arVencidoUsd: number;
  arRiskWeightedUsd: number;
  apGastoMesUsd: number;
  saldoPrestamoTotalUsd: number;
  pctDesembolsadoAvg: number | null;
  runwayWeeksP10: number | null;
  forecastNet3mP50: number | null;
  anomalyCount: number;
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

// ── Treasury tabs (Flujo / Proyección / CxC / CxP / Deuda / Cuentas&FX / Proyectos) ──

export type NamedValue = { name: string; value: number };
export type ParetoRow = { name: string; value: number; cumulative: number };
export type TrendPoint = { dia: string; valor: number };

export type FlujoSection = {
  monthlySeries: { name: string; ingresos: number; egresos: number; neto: number }[];
  cumulativeNetCurve: TrendPoint[];
  bridgeMom: NamedValue[];
  varianceHeatmap: { x: string; y: string; value: number }[];
};

export type ForecastPoint = { date: string; p10: number; p50: number; p90: number };
export type ForecastResult = {
  available: boolean;
  reason?: string;
  model?: string;
  trainPoints: number;
  history: { date: string; actual: number }[];
  forecast: ForecastPoint[];
};

export type WeeklyProjectionRow = {
  week: number;
  inflowNominalUsd: number;
  inflowRiskWeightedUsd: number;
  outflowUsd: number;
  cumulativeP50Usd: number;
  cumulativeP10Usd: number;
};

export type ProyeccionSection = {
  weeks: WeeklyProjectionRow[];
  runwayWeeksP10: number | null;
  startingCashUsd: number;
  avgWeeklyOutflowUsd: number;
  forecast6m: ForecastResult;
};

export type CollectionPriorityRow = {
  pagoRid: string;
  negociacionRid: string;
  cliente: string;
  project: string;
  unidad: string;
  tipoPago: string;
  saldoUsd: number;
  fechaEstimada: string | null;
  diasAtraso: number | null;
  agingBucket: string;
  riskWeight: number;
  riskWeightedSaldoUsd: number;
  priorityScore: number;
};

export type CxcSection = {
  kpis: {
    arTotalUsd: number;
    arVencidoUsd: number;
    arVencidoPct: number | null;
    arVencido90Usd: number;
    hhi: number | null;
    openLines: number;
  };
  agingByProject: Record<string, string | number>[];
  agingByTipoPago: Record<string, string | number>[];
  paretoClientes: ParetoRow[];
  concentracionTop5: NamedValue[];
  recuperacion: { name: string; plan: number; recibos: number; recuperacionPct: number | null }[];
  dsoDays: number | null;
  priorityList: CollectionPriorityRow[];
  notes: string[];
};

export type CxpSection = {
  kpis: {
    gastoMesActualUsd: number;
    pctTopProveedor: number | null;
    proveedoresActivos: number;
    presupuestoRestanteUsd: number | null;
  };
  paretoProveedores: ParetoRow[];
  concentracionHhi: number | null;
  gastoPorPartidaMes: Record<string, string | number>[];
  topPartidas: string[];
  presupuestoVsEjecutado: { name: string; plan: number; actual: number }[];
  histogramaPagos: { label: string; count: number }[];
  notes: string[];
};

export type Fideicomiso = {
  fideicomisoRid: string;
  nombre: string;
  project: string;
  banco: string;
  montoInicialUsd: number | null;
  montoLiberacionesUsd: number | null;
  saldoTotalUsd: number | null;
  excedenteGarantiaUsd: number | null;
  pctDesembolsado: number | null;
};

export type DeudaSection = {
  kpis: {
    saldoTotalPrestamoUsd: number;
    excedenteGarantiaTotalUsd: number;
    interesesYtdUsd: number;
    fideicomisosActivos: number;
  };
  fideicomisos: Fideicomiso[];
  saldoPorFideicomiso: NamedValue[];
  desembolsosAcumulados: TrendPoint[];
  debtServiceMensual: { name: string; Cuota: number; Intereses: number }[];
  desembolsosRecientes: { fecha: string; fideicomisoRid: string; montoUsd: number }[];
  notes: string[];
};

export type CuentasFxSection = {
  flujoPorBanco: NamedValue[];
  flujoPorMoneda: NamedValue[];
  flujoPorProyecto: NamedValue[];
  flujoPorCuenta: NamedValue[];
  tipoCambioDiario: TrendPoint[];
  mezclaMonedaMensual: Record<string, string | number>[];
  cuentas: TrustAccount[];
  notes: string[];
};

export type ProyectoRollup = {
  project: string;
  netPositionUsd: number;
  arTotalUsd: number;
  arVencidoUsd: number;
  saldoPrestamoUsd: number;
};

export type AnomaliesSection = {
  available: boolean;
  series: { date: string; value: number }[];
  trend: { date: string; value: number }[];
  anomalies: { date: string; value: number; severity: "medium" | "high"; metric: string }[];
};

export type CashflowsReport = {
  summary: CashflowsSummary;
  varianceRows: VarianceRow[];
  topVariances: VarianceRow[];
  accounts: TrustAccount[];
  dryRun: boolean;
  flujo: FlujoSection;
  proyeccion: ProyeccionSection;
  cxc: CxcSection;
  cxp: CxpSection;
  deuda: DeudaSection;
  cuentasFx: CuentasFxSection;
  proyectos: ProyectoRollup[];
  /** Canonical union of every project name across movements + AR, returned
   * unconditionally (unlike `proyectos`, which the agent only computes on the
   * unfiltered "todos los proyectos" call) — see `uniqueProjects`. */
  allProjects: string[];
  anomalies: AnomaliesSection;
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
    arTotalUsd: asNum(s.ar_total_usd),
    arVencidoUsd: asNum(s.ar_vencido_usd),
    arRiskWeightedUsd: asNum(s.ar_risk_weighted_usd),
    apGastoMesUsd: asNum(s.ap_gasto_mes_usd),
    saldoPrestamoTotalUsd: asNum(s.saldo_prestamo_total_usd),
    pctDesembolsadoAvg: asOptNum(s.pct_desembolsado_avg),
    runwayWeeksP10: asOptNum(s.runway_weeks_p10),
    forecastNet3mP50: asOptNum(s.forecast_net_3m_p50),
    anomalyCount: asNum(s.anomaly_count),
  };
}

function asRecordArray(raw: unknown): Record<string, unknown>[] {
  return Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
}

function mapNamedValue(raw: Record<string, unknown>): NamedValue {
  return { name: asStr(raw.name), value: asNum(raw.value) };
}

function mapParetoRow(raw: Record<string, unknown>): ParetoRow {
  return { name: asStr(raw.name), value: asNum(raw.value), cumulative: asNum(raw.cumulative) };
}

function mapTrendPoint(raw: Record<string, unknown>): TrendPoint {
  return { dia: asStr(raw.dia), valor: asNum(raw.valor) };
}

/** Bucket/partida stacked-bar rows have a dynamic `name` + arbitrary numeric
 * keys (aging buckets, tipo de pago, partida names) — pass through as-is. */
function mapBucketRow(raw: Record<string, unknown>): Record<string, string | number> {
  const out: Record<string, string | number> = { name: asStr(raw.name) };
  for (const [k, v] of Object.entries(raw)) {
    if (k === "name") continue;
    out[k] = typeof v === "number" ? v : asNum(v);
  }
  return out;
}

function mapForecastResult(raw: unknown): ForecastResult {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    available: r.available === true,
    reason: asOptStr(r.reason) ?? undefined,
    model: asOptStr(r.model) ?? undefined,
    trainPoints: asNum(r.train_points),
    history: asRecordArray(r.history).map((h) => ({ date: asStr(h.date), actual: asNum(h.actual) })),
    forecast: asRecordArray(r.forecast).map((f) => ({
      date: asStr(f.date),
      p10: asNum(f.p10),
      p50: asNum(f.p50),
      p90: asNum(f.p90),
    })),
  };
}

function mapFlujoSection(raw: unknown): FlujoSection {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    monthlySeries: asRecordArray(r.monthly_series).map((m) => ({
      name: asStr(m.name),
      ingresos: asNum(m.ingresos),
      egresos: asNum(m.egresos),
      neto: asNum(m.neto),
    })),
    cumulativeNetCurve: asRecordArray(r.cumulative_net_curve).map(mapTrendPoint),
    bridgeMom: asRecordArray(r.bridge_mom).map(mapNamedValue),
    varianceHeatmap: asRecordArray(r.variance_heatmap).map((c) => ({ x: asStr(c.x), y: asStr(c.y), value: asNum(c.value) })),
  };
}

function mapProyeccionSection(raw: unknown): ProyeccionSection {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    weeks: asRecordArray(r.weeks).map((w) => ({
      week: asNum(w.week),
      inflowNominalUsd: asNum(w.inflow_nominal_usd),
      inflowRiskWeightedUsd: asNum(w.inflow_risk_weighted_usd),
      outflowUsd: asNum(w.outflow_usd),
      cumulativeP50Usd: asNum(w.cumulative_p50_usd),
      cumulativeP10Usd: asNum(w.cumulative_p10_usd),
    })),
    runwayWeeksP10: asOptNum(r.runway_weeks_p10),
    startingCashUsd: asNum(r.starting_cash_usd),
    avgWeeklyOutflowUsd: asNum(r.avg_weekly_outflow_usd),
    forecast6m: mapForecastResult(r.forecast_6m),
  };
}

function mapCollectionPriorityRow(raw: Record<string, unknown>): CollectionPriorityRow {
  return {
    pagoRid: asStr(raw.pago_rid),
    negociacionRid: asStr(raw.negociacion_rid),
    cliente: asStr(raw.cliente),
    project: asStr(raw.project),
    unidad: asStr(raw.unidad),
    tipoPago: asStr(raw.tipo_pago),
    saldoUsd: asNum(raw.saldo_usd),
    fechaEstimada: asOptStr(raw.fecha_estimada),
    diasAtraso: asOptNum(raw.dias_atraso),
    agingBucket: asStr(raw.aging_bucket),
    riskWeight: asNum(raw.risk_weight),
    riskWeightedSaldoUsd: asNum(raw.risk_weighted_saldo_usd),
    priorityScore: asNum(raw.priority_score),
  };
}

function mapCxcSection(raw: unknown): CxcSection {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const kpis = (r.kpis && typeof r.kpis === "object" ? r.kpis : {}) as Record<string, unknown>;
  return {
    kpis: {
      arTotalUsd: asNum(kpis.ar_total_usd),
      arVencidoUsd: asNum(kpis.ar_vencido_usd),
      arVencidoPct: asOptNum(kpis.ar_vencido_pct),
      arVencido90Usd: asNum(kpis.ar_vencido_90_usd),
      hhi: asOptNum(kpis.hhi),
      openLines: asNum(kpis.open_lines),
    },
    agingByProject: asRecordArray(r.aging_by_project).map(mapBucketRow),
    agingByTipoPago: asRecordArray(r.aging_by_tipo_pago).map(mapBucketRow),
    paretoClientes: asRecordArray(r.pareto_clientes).map(mapParetoRow),
    concentracionTop5: asRecordArray(r.concentracion_top5).map(mapNamedValue),
    recuperacion: asRecordArray(r.recuperacion).map((v) => ({
      name: asStr(v.name),
      plan: asNum(v.plan),
      recibos: asNum(v.recibos),
      recuperacionPct: asOptNum(v.recuperacion_pct),
    })),
    dsoDays: asOptNum(r.dso_days),
    priorityList: asRecordArray(r.priority_list).map(mapCollectionPriorityRow),
    notes: Array.isArray(r.notes) ? (r.notes as unknown[]).map((n) => String(n)) : [],
  };
}

function mapCxpSection(raw: unknown): CxpSection {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const kpis = (r.kpis && typeof r.kpis === "object" ? r.kpis : {}) as Record<string, unknown>;
  return {
    kpis: {
      gastoMesActualUsd: asNum(kpis.gasto_mes_actual_usd),
      pctTopProveedor: asOptNum(kpis.pct_top_proveedor),
      proveedoresActivos: asNum(kpis.proveedores_activos),
      presupuestoRestanteUsd: asOptNum(kpis.presupuesto_restante_usd),
    },
    paretoProveedores: asRecordArray(r.pareto_proveedores).map(mapParetoRow),
    concentracionHhi: asOptNum(r.concentracion_hhi),
    gastoPorPartidaMes: asRecordArray(r.gasto_por_partida_mes).map(mapBucketRow),
    topPartidas: Array.isArray(r.top_partidas) ? (r.top_partidas as unknown[]).map((p) => String(p)) : [],
    presupuestoVsEjecutado: asRecordArray(r.presupuesto_vs_ejecutado).map((v) => ({
      name: asStr(v.name),
      plan: asNum(v.plan),
      actual: asNum(v.actual),
    })),
    histogramaPagos: asRecordArray(r.histograma_pagos).map((h) => ({ label: asStr(h.label), count: asNum(h.count) })),
    notes: Array.isArray(r.notes) ? (r.notes as unknown[]).map((n) => String(n)) : [],
  };
}

function mapFideicomiso(raw: Record<string, unknown>): Fideicomiso {
  return {
    fideicomisoRid: asStr(raw.fideicomiso_rid),
    nombre: asStr(raw.nombre),
    project: asStr(raw.project),
    banco: asStr(raw.banco),
    montoInicialUsd: asOptNum(raw.monto_inicial_usd),
    montoLiberacionesUsd: asOptNum(raw.monto_liberaciones_usd),
    saldoTotalUsd: asOptNum(raw.saldo_total_usd),
    excedenteGarantiaUsd: asOptNum(raw.excedente_garantia_usd),
    pctDesembolsado: asOptNum(raw.pct_desembolsado),
  };
}

function mapDeudaSection(raw: unknown): DeudaSection {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const kpis = (r.kpis && typeof r.kpis === "object" ? r.kpis : {}) as Record<string, unknown>;
  return {
    kpis: {
      saldoTotalPrestamoUsd: asNum(kpis.saldo_total_prestamo_usd),
      excedenteGarantiaTotalUsd: asNum(kpis.excedente_garantia_total_usd),
      interesesYtdUsd: asNum(kpis.intereses_ytd_usd),
      fideicomisosActivos: asNum(kpis.fideicomisos_activos),
    },
    fideicomisos: asRecordArray(r.fideicomisos).map(mapFideicomiso),
    saldoPorFideicomiso: asRecordArray(r.saldo_por_fideicomiso).map(mapNamedValue),
    desembolsosAcumulados: asRecordArray(r.desembolsos_acumulados).map(mapTrendPoint),
    debtServiceMensual: asRecordArray(r.debt_service_mensual).map((v) => ({
      name: asStr(v.name),
      Cuota: asNum(v.Cuota),
      Intereses: asNum(v.Intereses),
    })),
    desembolsosRecientes: asRecordArray(r.desembolsos_recientes).map((v) => ({
      fecha: asStr(v.fecha),
      fideicomisoRid: asStr(v.fideicomiso_rid),
      montoUsd: asNum(v.monto_usd),
    })),
    notes: Array.isArray(r.notes) ? (r.notes as unknown[]).map((n) => String(n)) : [],
  };
}

function mapCuentasFxSection(raw: unknown): CuentasFxSection {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    flujoPorBanco: asRecordArray(r.flujo_por_banco).map(mapNamedValue),
    flujoPorMoneda: asRecordArray(r.flujo_por_moneda).map(mapNamedValue),
    flujoPorProyecto: asRecordArray(r.flujo_por_proyecto).map(mapNamedValue),
    flujoPorCuenta: asRecordArray(r.flujo_por_cuenta).map(mapNamedValue),
    tipoCambioDiario: asRecordArray(r.tipo_cambio_diario).map(mapTrendPoint),
    mezclaMonedaMensual: asRecordArray(r.mezcla_moneda_mensual).map(mapBucketRow),
    cuentas: asRecordArray(r.cuentas).map(mapAccount),
    notes: Array.isArray(r.notes) ? (r.notes as unknown[]).map((n) => String(n)) : [],
  };
}

function mapProyectoRollup(raw: Record<string, unknown>): ProyectoRollup {
  return {
    project: asStr(raw.project),
    netPositionUsd: asNum(raw.net_position_usd),
    arTotalUsd: asNum(raw.ar_total_usd),
    arVencidoUsd: asNum(raw.ar_vencido_usd),
    saldoPrestamoUsd: asNum(raw.saldo_prestamo_usd),
  };
}

function mapAnomaliesSection(raw: unknown): AnomaliesSection {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const severityOf = (v: unknown): "medium" | "high" => (v === "high" ? "high" : "medium");
  return {
    available: r.available === true,
    series: asRecordArray(r.series).map((s) => ({ date: asStr(s.date), value: asNum(s.value) })),
    trend: asRecordArray(r.trend).map((s) => ({ date: asStr(s.date), value: asNum(s.value) })),
    anomalies: asRecordArray(r.anomalies).map((a) => ({
      date: asStr(a.date),
      value: asNum(a.value),
      severity: severityOf(a.severity),
      metric: asStr(a.metric),
    })),
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
    varianceRows: asRecordArray(result.variance_rows).map(mapVarianceRow),
    topVariances: asRecordArray(result.top_variances).map(mapVarianceRow),
    accounts: asRecordArray(result.accounts).map(mapAccount),
    dryRun: result.dry_run !== false,
    flujo: mapFlujoSection(result.flujo),
    proyeccion: mapProyeccionSection(result.proyeccion),
    cxc: mapCxcSection(result.cxc),
    cxp: mapCxpSection(result.cxp),
    deuda: mapDeudaSection(result.deuda),
    cuentasFx: mapCuentasFxSection(result.cuentas_fx),
    proyectos: asRecordArray(result.proyectos).map(mapProyectoRollup),
    allProjects: Array.isArray(result.all_projects) ? result.all_projects.map(asStr).filter(Boolean) : [],
    anomalies: mapAnomaliesSection(result.anomalies),
  };
}

/** Union of the accounts-table project names (Cuentas Fideicomiso, always
 * loaded unfiltered) with `allProjects` (movements + AR, also unconditional).
 * The two tables use different labels for a few projects (e.g. accounts'
 * "Cosmo" vs movements/AR's "Cosmopolitan Tower") — without this union the
 * filter dropdown was missing 6 of 11 real projects, breaking their
 * `/proyectos` → "Ver detalle" drill-down links entirely. */
export function uniqueProjects(accounts: TrustAccount[], allProjects: string[] = []): string[] {
  return Array.from(new Set([...accounts.map((a) => a.project), ...allProjects].filter(Boolean))).sort();
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
