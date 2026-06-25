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
