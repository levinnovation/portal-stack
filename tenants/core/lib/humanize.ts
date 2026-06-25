// Traduce una observación de Langfuse (técnica) a una línea amigable en español
// para un usuario NO técnico de CORE. Es pura (sin secrets / sin server-only) para
// poder probarla en unit/E2E. Degrada con elegancia si la traza aún no trae los
// campos enriquecidos de Track B (lead_name/index/total/score): muestra menos
// detalle pero nunca rompe.

import type { Observation } from "@tenants/core/sources/langfuse";

export type Step = {
  id: string;
  text: string;
  kind: "info" | "ok" | "error";
  channel?: "whatsapp" | "call";
  progress?: { index: number; total: number };
  at: string;
};

function md(obs: Observation): Record<string, unknown> {
  const m = obs.metadata ?? {};
  // input_data del trace_event suele venir como objeto plano.
  const input = (obs.input ?? {}) as Record<string, unknown>;
  return { ...input, ...m };
}

function pickStr(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}
function pickNum(o: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && isFinite(Number(v))) return Number(v);
  }
  return null;
}

function channelOf(raw: string): Step["channel"] | undefined {
  const c = raw.toUpperCase();
  if (c.includes("WHATSAPP") || c.includes("KAPSO")) return "whatsapp";
  if (c.includes("CALL") || c.includes("VOICE") || c.includes("LIVEKIT")) return "call";
  return undefined;
}
const CHANNEL_ES: Record<NonNullable<Step["channel"]>, string> = {
  whatsapp: "WhatsApp",
  call: "una llamada",
};

/** Convierte una observación en un paso humano. Devuelve null si no aporta señal. */
export function mapSpan(obs: Observation): Step | null {
  const o = md(obs);
  const name = (obs.name ?? "").toLowerCase();
  const lead = pickStr(o, "lead_name", "name", "full_name") || pickStr(o, "contact_id", "hubspot_contact_id");
  const index = pickNum(o, "index", "i");
  const total = pickNum(o, "total", "count");
  const progress = index != null && total != null ? { index, total } : undefined;
  const channel = channelOf(pickStr(o, "channel") || name);

  const isError = (obs.level ?? "").toUpperCase() === "ERROR" || name.includes("error") || name.includes("fail");
  if (isError) {
    return {
      id: obs.id,
      kind: "error",
      text: lead
        ? `Problema con ${lead}: ${obs.statusMessage || "no se pudo contactar"}`
        : `Hubo un problema: ${obs.statusMessage || obs.name}`,
      channel,
      progress,
      at: obs.startTime,
    };
  }

  // Calificación / score.
  if (name.includes("score") || name.includes("califica") || pickNum(o, "score") != null) {
    const score = pickNum(o, "score");
    return {
      id: obs.id,
      kind: "ok",
      text: lead
        ? `Calificó a ${lead}${score != null ? `: ${score}/10` : ""}`
        : `Calificación completada${score != null ? `: ${score}/10` : ""}`,
      progress,
      at: obs.startTime,
    };
  }

  // Outreach (contacto).
  if (name.includes("outreach") || name.includes("contact") || channel) {
    const via = channel ? ` por ${CHANNEL_ES[channel]}` : "";
    return {
      id: obs.id,
      kind: "info",
      text: lead ? `Contactando a ${lead}${via}` : `Contactando un lead${via}`,
      channel,
      progress,
      at: obs.startTime,
    };
  }

  // Inicio/scan.
  if (name.includes("scan") || name.includes("start") || name.includes("kickoff")) {
    return {
      id: obs.id,
      kind: "info",
      text: total != null ? `Encontró ${total} leads para contactar` : "Iniciando el escaneo de leads",
      progress,
      at: obs.startTime,
    };
  }

  // Paso genérico con nombre legible (fallback): solo si trae lead o progreso.
  if (lead || progress) {
    return {
      id: obs.id,
      kind: "info",
      text: lead ? `Procesando a ${lead}` : "Procesando leads",
      progress,
      at: obs.startTime,
    };
  }

  return null;
}

/** Mapea una lista de observaciones a pasos, descartando las sin señal. */
export function mapSpans(observations: Observation[]): Step[] {
  return observations.map(mapSpan).filter((s): s is Step => s !== null);
}

/** Resumen terminal a partir de los pasos (para la tarjeta final). */
export function summarize(steps: Step[]): string {
  const contactos = steps.filter((s) => s.channel);
  const wa = contactos.filter((s) => s.channel === "whatsapp").length;
  const call = contactos.filter((s) => s.channel === "call").length;
  const errores = steps.filter((s) => s.kind === "error").length;
  const partes: string[] = [];
  if (wa) partes.push(`${wa} WhatsApp`);
  if (call) partes.push(`${call} llamada${call === 1 ? "" : "s"}`);
  const base = contactos.length
    ? `${contactos.length} leads contactados${partes.length ? ` (${partes.join(", ")})` : ""}`
    : "Sin contactos registrados";
  return errores ? `${base} · ${errores} con problema` : base;
}
