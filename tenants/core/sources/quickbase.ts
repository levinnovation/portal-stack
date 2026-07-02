import "server-only";
import { env, requireEnv } from "@tenants/core/lib/env";

// ── Fuente de datos de Leah (Agent 8) — Quickbase REST v1 ───────────────────
// App CORE sandbox `bv52q2gq2` (Core Ventas — Agent 12 Sync). Dos tablas:
// Contratos `bv52rbufi` (ventas firmadas que Leah atribuye, columnas 12-23) y
// Conversión `bv6sb3uza` (tasa por fuente de primer toque). Solo LECTURA.
//
// La REST de Quickbase devuelve cada fila como { "<fid>": { value } }. Aquí mapeamos
// los FIDs (fijos al provisionar las tablas) a nombres TS. Si cambia el field-map del
// provision, actualizar estos números.

const QB_BASE = "https://api.quickbase.com/v1";

// FIDs de Contratos (ver scripts/provision_core_model.py / docs/DATA_SOURCES.md).
export const CONTRATO_FIDS = {
  recordId: 3,
  fullName: 12,
  dealOwner: 13,
  email: 7,
  phone: 6,
  fechaFirma: 8,
  monto: 10,
  firstTouchSource: 14,
  firstTouchCampaign: 15,
  firstTouchChannel: 16,
  firstContactDate: 17,
  leadSource: 18,
  daysToClose: 19,
  hubspotMatched: 20,
  leahAttributed: 21,
  hubspotDealId: 11,
  project: 24,
} as const;

// FIDs de Conversión.
const CONVERSION_FIDS = {
  recordId: 3,
  firstTouchSource: 6,
  leads: 7,
  buyers: 8,
  conversionRate: 9,
} as const;

export type Contrato = {
  recordId: number;
  fullName: string;
  dealOwner: string;
  email: string;
  phone: string;
  fechaFirma: string | null;
  monto: number;
  firstTouchSource: string;
  firstTouchCampaign: string;
  firstTouchChannel: string;
  firstContactDate: string | null;
  leadSource: string;
  daysToClose: number | null;
  hubspotMatched: boolean;
  leahAttributed: boolean;
  hubspotDealId: string;
  project: string;
};

export type ConversionFuente = {
  firstTouchSource: string;
  leads: number;
  buyers: number;
  conversionRate: number; // 0–1
};

type QbRow = Record<string, { value: unknown }>;
type QbResponse = { data?: QbRow[]; metadata?: { totalRecords?: number } };

function cell(row: QbRow, fid: number): unknown {
  return row[String(fid)]?.value;
}
const asStr = (v: unknown): string => (v === null || v === undefined ? "" : String(v));
const asNum = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return isFinite(n) ? n : 0;
};
const asBool = (v: unknown): boolean => v === true || v === "true" || v === 1;
const asDate = (v: unknown): string | null => {
  const s = asStr(v);
  return s ? s : null;
};

/** POST /records/query. Lanza con mensaje claro si falta config o la API falla. */
async function qbQuery(tableId: string, select: number[], opts?: {
  where?: string;
  sortBy?: { fieldId: number; order: "ASC" | "DESC" }[];
}): Promise<QbResponse> {
  const token = requireEnv("QUICKBASE_USER_TOKEN");
  if (!tableId) throw new Error("Falta el table_id de Quickbase (CORE_QB_*_TABLE_ID).");

  const body: Record<string, unknown> = { from: tableId, select };
  if (opts?.where) body.where = opts.where;
  if (opts?.sortBy) body.sortBy = opts.sortBy;

  const res = await fetch(`${QB_BASE}/records/query`, {
    method: "POST",
    headers: {
      "QB-Realm-Hostname": env.QUICKBASE_REALM,
      Authorization: `QB-USER-TOKEN ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    // Absorbe el spam del botón "Actualizar" y respeta rate-limits de QB.
    next: { revalidate: 120 },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Quickbase ${res.status}: ${txt.slice(0, 200)}`);
  }
  return (await res.json()) as QbResponse;
}

export async function getContratos(): Promise<Contrato[]> {
  const f = CONTRATO_FIDS;
  const select = Object.values(f) as number[];
  const json = await qbQuery(env.CORE_QB_CONTRATOS_TABLE_ID, select, {
    sortBy: [{ fieldId: f.fechaFirma, order: "DESC" }],
  });
  return (json.data ?? []).map((row) => ({
    recordId: asNum(cell(row, f.recordId)),
    fullName: asStr(cell(row, f.fullName)),
    dealOwner: asStr(cell(row, f.dealOwner)),
    email: asStr(cell(row, f.email)),
    phone: asStr(cell(row, f.phone)),
    fechaFirma: asDate(cell(row, f.fechaFirma)),
    monto: asNum(cell(row, f.monto)),
    firstTouchSource: asStr(cell(row, f.firstTouchSource)),
    firstTouchCampaign: asStr(cell(row, f.firstTouchCampaign)),
    firstTouchChannel: asStr(cell(row, f.firstTouchChannel)),
    firstContactDate: asDate(cell(row, f.firstContactDate)),
    leadSource: asStr(cell(row, f.leadSource)),
    daysToClose: cell(row, f.daysToClose) == null ? null : asNum(cell(row, f.daysToClose)),
    hubspotMatched: asBool(cell(row, f.hubspotMatched)),
    leahAttributed: asBool(cell(row, f.leahAttributed)),
    hubspotDealId: asStr(cell(row, f.hubspotDealId)),
    project: asStr(cell(row, f.project)),
  }));
}

export async function getConversionPorFuente(): Promise<ConversionFuente[]> {
  const f = CONVERSION_FIDS;
  const select = Object.values(f) as number[];
  const json = await qbQuery(env.CORE_QB_CONVERSION_TABLE_ID, select, {
    sortBy: [{ fieldId: f.conversionRate, order: "DESC" }],
  });
  return (json.data ?? []).map((row) => {
    // conversion_rate puede venir como 0–1 o 0–100 según cómo lo escriba Leah; normalizamos.
    const raw = asNum(cell(row, f.conversionRate));
    const rate = raw > 1 ? raw / 100 : raw;
    return {
      firstTouchSource: asStr(cell(row, f.firstTouchSource)) || "Sin fuente",
      leads: asNum(cell(row, f.leads)),
      buyers: asNum(cell(row, f.buyers)),
      conversionRate: rate,
    };
  });
}

export type LeahKpis = {
  montoTotal: number;
  montoMes: number;
  contratosMes: number;
  contratosTotal: number;
  avgDiasACierre: number | null;
  pctAtribuido: number; // 0–1
  pctMatch: number; // 0–1
};

export type AtribAgg = { name: string; value: number };

/** Deriva KPIs y agregaciones de atribución desde la lista de contratos. */
export async function getLeahData(): Promise<{
  contratos: Contrato[];
  conversion: ConversionFuente[];
  kpis: LeahKpis;
  porCanal: AtribAgg[];
  porCampaign: AtribAgg[];
  porFuenteMonto: AtribAgg[];
  porAsesor: AtribAgg[];
  porProyecto: AtribAgg[];
  diasACierre: { label: string; count: number }[];
  tendenciaMonto: { dia: string; valor: number }[];
}> {
  const [contratos, conversion] = await Promise.all([
    getContratos(),
    getConversionPorFuente().catch(() => [] as ConversionFuente[]),
  ]);

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const delMes = contratos.filter((c) => c.fechaFirma && new Date(c.fechaFirma) >= inicioMes);

  const montoTotal = sum(contratos.map((c) => c.monto));
  const dias = contratos.map((c) => c.daysToClose).filter((d): d is number => d != null);
  const atribuidos = contratos.filter((c) => c.leahAttributed).length;
  const matched = contratos.filter((c) => c.hubspotMatched).length;

  const kpis: LeahKpis = {
    montoTotal,
    montoMes: sum(delMes.map((c) => c.monto)),
    contratosMes: delMes.length,
    contratosTotal: contratos.length,
    avgDiasACierre: dias.length ? sum(dias) / dias.length : null,
    pctAtribuido: contratos.length ? atribuidos / contratos.length : 0,
    pctMatch: contratos.length ? matched / contratos.length : 0,
  };

  return {
    contratos,
    conversion,
    kpis,
    porCanal: aggBy(contratos, (c) => c.firstTouchChannel || "Sin canal", () => 1),
    porCampaign: topN(aggBy(contratos, (c) => c.firstTouchCampaign || "Sin campaña", () => 1), 8),
    porFuenteMonto: aggBy(contratos, (c) => c.firstTouchSource || "Sin fuente", (c) => c.monto),
    porAsesor: aggBy(contratos, (c) => c.dealOwner || "Sin asesor", () => 1),
    porProyecto: aggBy(contratos, (c) => c.project || "Sin proyecto", () => 1),
    diasACierre: histogramaDias(dias),
    tendenciaMonto: tendenciaPorFecha(contratos),
  };
}

// ── helpers de agregación ──
function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}
function aggBy(rows: Contrato[], key: (c: Contrato) => string, val: (c: Contrato) => number): AtribAgg[] {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + val(r));
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
function topN(arr: AtribAgg[], n: number): AtribAgg[] {
  return arr.slice(0, n);
}
function histogramaDias(dias: number[]): { label: string; count: number }[] {
  if (!dias.length) return [];
  const max = Math.max(...dias);
  // Si todo cae en un ciclo de venta "normal" (≤90 días), usamos tramos fijos legibles.
  if (max <= 90) {
    const bins = [
      { label: "0–7", min: 0, max: 7 },
      { label: "8–14", min: 8, max: 14 },
      { label: "15–30", min: 15, max: 30 },
      { label: "31–60", min: 31, max: 60 },
      { label: "61–90", min: 61, max: 90 },
    ];
    return bins.map((b) => ({
      label: b.label,
      count: dias.filter((d) => d >= b.min && d <= b.max).length,
    }));
  }
  // Datos con rango amplio (ej. fecha_firma = hoy en el backfill → ~años): tramos
  // adaptativos sobre min..max para que se vea la distribución real, no una sola barra.
  const min = Math.min(...dias);
  const N = 6;
  const span = Math.max(1, max - min);
  const step = Math.ceil(span / N / 5) * 5; // redondea el ancho a múltiplos de 5
  const start = Math.floor(min / step) * step;
  const bins: { label: string; min: number; max: number }[] = [];
  for (let i = 0; i < N; i++) {
    const lo = start + i * step;
    const hi = lo + step - 1;
    bins.push({ label: `${lo}–${hi}`, min: lo, max: hi });
  }
  // El último bin absorbe cualquier cosa por encima.
  bins[bins.length - 1].max = Infinity;
  bins[bins.length - 1].label = `${bins[bins.length - 1].min}+`;
  return bins.map((b) => ({
    label: b.label,
    count: dias.filter((d) => d >= b.min && d <= b.max).length,
  }));
}
function tendenciaPorFecha(contratos: Contrato[]): { dia: string; valor: number }[] {
  const m = new Map<string, number>();
  for (const c of contratos) {
    if (!c.fechaFirma) continue;
    const dia = c.fechaFirma.slice(0, 10);
    m.set(dia, (m.get(dia) ?? 0) + c.monto);
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dia, valor]) => ({ dia, valor }));
}
