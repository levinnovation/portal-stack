import "server-only";
import { env, requireEnv } from "@tenants/core/lib/env";

// ── Status en vivo del scan de Qara — Langfuse public API ───────────────────
// Cada paso del scan emite un span vía observability/langfuse.py. Sondeamos las
// observaciones del trace y las exponemos ordenadas para que el cliente las pinte
// como timeline. OJO: el trace_id se guarda en hex SIN guiones (tid.replace("-","")),
// así que normalizamos cualquier uuid antes de consultar.

export function toHexTraceId(traceId: string): string {
  return traceId.replace(/-/g, "");
}

export type Observation = {
  id: string;
  name: string;
  type: string;
  startTime: string;
  level?: string;
  statusMessage?: string;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
};

type ObsResponse = { data?: Observation[] };

function authHeader(): string {
  const pub = requireEnv("LANGFUSE_PUBLIC_KEY");
  const sec = requireEnv("LANGFUSE_SECRET_KEY");
  return "Basic " + Buffer.from(`${pub}:${sec}`).toString("base64");
}

/**
 * Observaciones del trace, ordenadas por startTime ascendente. Langfuse tiene un
 * pequeño lag de ingestión (segundos), por eso el copy dice "casi en tiempo real".
 */
export async function getObservations(traceId: string): Promise<Observation[]> {
  const hex = toHexTraceId(traceId);
  const url = `${env.LANGFUSE_BASE_URL.replace(/\/$/, "")}/api/public/observations?traceId=${encodeURIComponent(hex)}&limit=100`;
  const res = await fetch(url, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Langfuse ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as ObsResponse;
  return (json.data ?? []).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

// ── Timeline tipado para "Progreso en vivo" de Qara ─────────────────────────
// El flow emite spans flow.core_ventas.{scan,outreach,scored} con input_data. Los
// parseamos a eventos tipados para que el panel muestre texto específico (nombre,
// canal, score, outcome). Detalle clave de correlación: el score de una llamada/mensaje
// individual corre en OTRA traza (el worker de voz re-dispara mode=score), así que el
// evento `scored` se busca por contact_id + tiempo, NO por trace_id.
const NS = "flow.core_ventas.";

export type QaraEvent =
  | { kind: "scan"; total: number | null; at: number }
  | { kind: "outreach"; contactId: string; leadName: string; channel: string; index: number | null; total: number | null; at: number };

export type ScoredEvent = {
  contactId: string;
  leadName: string;
  score: number | null;
  nextAction: string;
  outcome: string; // scored | handoff_whatsapp | ...
  at: number;
};

const _num = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isFinite(n) ? n : null;
};
const _str = (v: unknown): string => (v == null ? "" : String(v));
const _input = (o: Observation): Record<string, unknown> =>
  o.input && typeof o.input === "object" ? (o.input as Record<string, unknown>) : {};
const _at = (o: Observation): number => {
  const t = o.startTime ? Date.parse(o.startTime) : NaN;
  return isFinite(t) ? t : 0;
};

function parseScored(o: Observation): ScoredEvent | null {
  if ((o.name ?? "") !== `${NS}scored`) return null;
  const i = _input(o);
  return {
    contactId: _str(i.contact_id),
    leadName: _str(i.lead_name),
    score: _num(i.score),
    nextAction: _str(i.next_action),
    outcome: _str(i.outcome) || "scored",
    at: _at(o),
  };
}

/** Eventos scan/outreach de la traza del run (progreso en vuelo). */
export async function getRunEvents(traceId: string): Promise<QaraEvent[]> {
  if (!env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY) return [];
  const obs = await getObservations(traceId);
  const events: QaraEvent[] = [];
  for (const o of obs) {
    const name = o.name ?? "";
    const i = _input(o);
    if (name === `${NS}scan`) {
      events.push({ kind: "scan", total: _num(i.total), at: _at(o) });
    } else if (name === `${NS}outreach`) {
      events.push({
        kind: "outreach",
        contactId: _str(i.contact_id),
        leadName: _str(i.lead_name),
        channel: _str(i.channel).toUpperCase(),
        index: _num(i.index),
        total: _num(i.total),
        at: _at(o),
      });
    }
  }
  return events;
}

/** Evento `scored` de un lead, posterior a `sinceMs` (corre en otra traza → por contacto). */
export async function getScoredForContact(contactId: string, sinceMs: number): Promise<ScoredEvent | null> {
  const id = contactId.trim();
  if (!id || !env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY) return null;
  const base = env.LANGFUSE_BASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/api/public/observations?name=${encodeURIComponent(`${NS}scored`)}&limit=50`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Langfuse ${res.status}`);
  const json = (await res.json()) as ObsResponse;
  const matches = (json.data ?? [])
    .map(parseScored)
    .filter((e): e is ScoredEvent => e !== null && e.contactId === id && e.at > sinceMs)
    .sort((a, b) => b.at - a.at);
  return matches[0] ?? null;
}
