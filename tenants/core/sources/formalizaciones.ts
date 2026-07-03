import "server-only";

import { env, requireEnv } from "@tenants/core/lib/env";
import { STAGE_LABELS, STATUS_LABELS } from "@tenants/core/lib/formalizaciones-labels";

// ── Fuente de datos de Formalizaciones (Agent 5) ─────────────────────────────
// Llama al worker `agent-5-core-formalizaciones` (POST /api/v1/run) con el
// evento read-only `report_snapshot`: el flow devuelve el mismo summary +
// case_rows que renderiza el reporte diario HTML/PDF, como JSON y sin ningún
// envío saliente. El worker cachea el snapshot en Redis
// (CORE_REPORT_SNAPSHOT_TTL_SECONDS, default 300s), así que refrescar esta
// página cada minuto no golpea Quickbase.
//
// Env requerido (Railway → portal-stack):
//   FORMALIZACIONES_API_URL  — ej. https://agent-5-core-formalizaciones-production.up.railway.app
//   FORMALIZACIONES_API_KEY  — el API_KEY del worker agent-5

/** Estado agregado de la corrida (mismo shape que el reporte diario). */
export type FormalizacionesSummary = {
  scanned_cases: number;
  contacted_or_resumed: number;
  docs_received_today: number;
  ready_for_bank: number;
  escalated: number;
  still_pending: number;
  pending_review_count: number;
  capped: boolean;
};

export type CaseStatus =
  | "ready_for_bank"
  | "contacted"
  | "escalated"
  | "throttled"
  | "pending"
  | "send_failed";

/** Etapa kanban S1..S5 derivada por el agente (S5 = escalado). */
export type CaseStage = "S1" | "S2" | "S3" | "S4" | "S5";

export type CaseRow = {
  clientName: string;
  unitId: string;
  projectName: string;
  bankName: string;
  status: CaseStatus;
  stage: CaseStage;
  missingDocs: string[];
  completenessPct: number;
  channel: "whatsapp" | "email" | "none";
  silentDays: number;
  daysInProcess: number;
  firstContacted: boolean;
  formalizacionEstatus: string;
  /** Link seguro /f/{token} del formulario de carga de documentos del cliente. */
  uploadUrl: string;
};

export type FormalizacionesReport = {
  runDate: string;
  generatedAt: string;
  cached: boolean;
  summary: FormalizacionesSummary;
  previousSummary: FormalizacionesSummary | null;
  caseRows: CaseRow[];
};

const asNum = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return isFinite(n) ? n : 0;
};
const asStr = (v: unknown): string => (v === null || v === undefined ? "" : String(v));

function mapSummary(raw: unknown): FormalizacionesSummary {
  const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    scanned_cases: asNum(s.scanned_cases),
    contacted_or_resumed: asNum(s.contacted_or_resumed),
    docs_received_today: asNum(s.docs_received_today),
    ready_for_bank: asNum(s.ready_for_bank),
    escalated: asNum(s.escalated),
    still_pending: asNum(s.still_pending),
    pending_review_count: asNum(s.pending_review_count),
    capped: s.capped === true,
  };
}

function mapCaseRow(raw: Record<string, unknown>): CaseRow {
  const status = asStr(raw.status) as CaseStatus;
  const stage = (asStr(raw.stage) || "S1") as CaseStage;
  return {
    clientName: asStr(raw.client_name),
    unitId: asStr(raw.unit_id),
    projectName: asStr(raw.project_name),
    bankName: asStr(raw.bank_name),
    status: STATUS_LABELS[status] ? status : "pending",
    stage: STAGE_LABELS[stage] ? stage : "S1",
    missingDocs: Array.isArray(raw.missing_docs) ? raw.missing_docs.map(asStr) : [],
    completenessPct: Math.max(0, Math.min(100, asNum(raw.completeness_pct))),
    channel: (["whatsapp", "email"].includes(asStr(raw.channel)) ? asStr(raw.channel) : "none") as CaseRow["channel"],
    silentDays: asNum(raw.silent_days),
    daysInProcess: asNum(raw.days_in_process),
    firstContacted: raw.first_contacted === true,
    formalizacionEstatus: asStr(raw.formalizacion_estatus),
    uploadUrl: asStr(raw.upload_url),
  };
}

/**
 * Snapshot en vivo del pipeline de formalizaciones (summary + casos con su
 * link seguro de carga). El agente lo sirve desde su caché Redis; usamos
 * cache: "no-store" aquí para que cada refresh del portal vea el snapshot
 * más reciente que el worker tenga.
 */
export async function getFormalizacionesReport(): Promise<FormalizacionesReport> {
  const baseUrl = requireEnv("FORMALIZACIONES_API_URL").replace(/\/$/, "");
  const apiKey = requireEnv("FORMALIZACIONES_API_KEY");

  const res = await fetch(`${baseUrl}/api/v1/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify({ inputs: { event_type: "report_snapshot" }, workspace_id: env.NEXT_PUBLIC_WORKSPACE_ID }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Formalizaciones API error ${res.status}: ${await res.text()}`);

  const payload = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  const result = (payload?.result ?? {}) as Record<string, unknown>;
  const report = (result.report ?? {}) as Record<string, unknown>;
  if (result.status !== "success" || !report || typeof report !== "object" || !Array.isArray(report.case_rows)) {
    throw new Error(`Formalizaciones API devolvió un payload inválido: ${JSON.stringify(result).slice(0, 300)}`);
  }

  return {
    runDate: asStr(report.run_date),
    generatedAt: asStr(report.generated_at),
    cached: result.cached === true,
    summary: mapSummary(report.summary),
    previousSummary: report.previous_summary ? mapSummary(report.previous_summary) : null,
    caseRows: (report.case_rows as Record<string, unknown>[]).map(mapCaseRow),
  };
}
