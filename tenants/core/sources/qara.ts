import "server-only";
import { env, requireEnv } from "@tenants/core/lib/env";

// ── Cliente del servicio Qara (Agent 10) ────────────────────────────────────
// Habla con el agente desplegado en Railway. Auth: header X-API-Key. El run async
// devuelve un trace_id que luego se sondea en /jobs/{trace} (estado terminal) y en
// Langfuse (pasos en vivo). El endpoint /config/schedule lo agrega Track B; hasta
// entonces getSchedule() devuelve `available:false` en vez de romper.

function base(): string {
  return requireEnv("QARA_API_URL").replace(/\/$/, "");
}
function headers(): Record<string, string> {
  return { "X-API-Key": requireEnv("QARA_API_KEY"), "Content-Type": "application/json" };
}

export type RunMode =
  | { mode: "scan" }
  | { mode: "single"; hubspot_contact_id: string; channel: "CALL" | "WHATSAPP" };

export type RunAccepted = { traceId: string; status: string };

/** Dispara un run async en Qara. Devuelve el trace_id para seguir el progreso. */
export async function triggerRun(spec: RunMode): Promise<RunAccepted> {
  const inputs: Record<string, unknown> = { mode: spec.mode };
  if (spec.mode === "single") {
    inputs.hubspot_contact_id = spec.hubspot_contact_id;
    inputs.channel = spec.channel;
  }
  const res = await fetch(`${base()}/api/v1/run`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      inputs,
      source_channel: "dashboard",
      async_execution: true,
      workspace_id: env.NEXT_PUBLIC_WORKSPACE_ID,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Qara run ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as { trace_id?: string; task_id?: string; status?: string };
  const traceId = json.trace_id || json.task_id || "";
  if (!traceId) throw new Error("Qara no devolvió trace_id");
  return { traceId, status: json.status || "accepted" };
}

export type JobStatus = {
  status: "running" | "success" | "failed" | "unknown";
  result?: unknown;
  error?: string;
};

/** Estado terminal del job (GET /jobs/{trace}). */
export async function getJob(traceId: string): Promise<JobStatus> {
  const res = await fetch(`${base()}/api/v1/jobs/${encodeURIComponent(traceId)}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Qara jobs ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as { status?: string; result?: unknown };
  const result = json.result as { error?: string } | undefined;
  return {
    status: (json.status as JobStatus["status"]) || "unknown",
    result: json.result,
    error: result?.error,
  };
}

export type Schedule = {
  scan_hours: number[];
  cleanup_hours: number[];
  tz: string;
};
export type ScheduleResult =
  | { available: true; schedule: Schedule }
  | { available: false; reason: string };

/** Lee el horario del cron de Qara. Si el endpoint aún no existe (Track B), devuelve available:false. */
export async function getSchedule(): Promise<ScheduleResult> {
  try {
    const res = await fetch(`${base()}/api/v1/config/schedule`, {
      headers: headers(),
      cache: "no-store",
    });
    if (res.status === 404) {
      return { available: false, reason: "El endpoint de horario aún no está desplegado en Qara (Track B)." };
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { available: false, reason: `Qara schedule ${res.status}: ${txt.slice(0, 120)}` };
    }
    const json = (await res.json()) as Partial<Schedule>;
    return {
      available: true,
      schedule: {
        scan_hours: json.scan_hours ?? [9, 10],
        cleanup_hours: json.cleanup_hours ?? [11],
        tz: json.tz ?? "America/Costa_Rica",
      },
    };
  } catch (e) {
    return { available: false, reason: e instanceof Error ? e.message : "Error al consultar el horario" };
  }
}

/** Guarda el horario (POST /config/schedule). Lanza si falla, para que el BFF lo reporte. */
export async function setSchedule(schedule: Schedule): Promise<Schedule> {
  const res = await fetch(`${base()}/api/v1/config/schedule`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(schedule),
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Qara schedule ${res.status}: ${txt.slice(0, 200)}`);
  }
  return (await res.json()) as Schedule;
}
