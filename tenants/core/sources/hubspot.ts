import "server-only";
import { requireEnv } from "@tenants/core/lib/env";

// ── Fuente de analítica de Qara (Agent 10) — HubSpot CRM Search API ─────────
// Token READ-ONLY de CORE prod. Agregamos sobre las propiedades que Qara escribe/lee
// en cada contacto. Paginamos con tope para no quemar rate-limits; agregamos en memoria.

const HS_BASE = "https://api.hubapi.com";
const PAGE_SIZE = 100;
const MAX_PAGES = 25; // tope: 2500 contactos. Suficiente para CORE; evita runaway.

// Propiedades que pedimos a HubSpot (las que Qara usa).
const PROPS = [
  "firstname",
  "lastname",
  "ai_score",
  "proyecto_de_interes",
  "ingreso_de_lead",
  "llamar_por_telefono",
  "hs_lead_status",
  "ai_engagement",
  "ai_use_type",
  "ai_budget",
  "ai_timeline",
  "createdate",
] as const;

type HsContact = {
  id: string;
  properties: Record<string, string | null>;
};

type SearchResp = {
  results?: HsContact[];
  paging?: { next?: { after?: string } };
  total?: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// POST genérico al Search API con backoff ante 429.
async function postSearch(body: Record<string, unknown>): Promise<SearchResp> {
  const token = requireEnv("HUBSPOT_TOKEN");
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${HS_BASE}/crm/v3/objects/contacts/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      next: { revalidate: 60 },
    });
    if (res.status === 429) {
      await sleep(500 * (attempt + 1));
      continue;
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HubSpot ${res.status}: ${txt.slice(0, 200)}`);
    }
    return (await res.json()) as SearchResp;
  }
  throw new Error("HubSpot 429: rate-limit excedido tras reintentos");
}

/** Total EXACTO que cumple un filtro, sin traer los contactos (el portal tiene 70k+). */
async function searchTotal(filterGroups: unknown[]): Promise<number> {
  const json = await postSearch({ filterGroups, limit: 1 });
  return json.total ?? 0;
}

/** Trae TODOS los contactos que cumplen un filtro (para sets chicos de Qara). */
async function fetchMatching(filterGroups: unknown[], maxPages = MAX_PAGES): Promise<HsContact[]> {
  const all: HsContact[] = [];
  let after: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const body: Record<string, unknown> = {
      filterGroups,
      properties: PROPS,
      limit: PAGE_SIZE,
      sorts: [{ propertyName: "lastmodifieddate", direction: "DESCENDING" }],
    };
    if (after) body.after = after;
    const page = await postSearch(body);
    all.push(...(page.results ?? []));
    after = page.paging?.next?.after;
    if (!after) break;
  }
  return all;
}

// Inicio de HOY en Costa Rica (UTC-6, sin DST) en epoch-ms → filtro createdate.
function startOfTodayCRms(): number {
  const cr = new Date(Date.now() - 6 * 3600 * 1000);
  return Date.UTC(cr.getUTCFullYear(), cr.getUTCMonth(), cr.getUTCDate(), 6, 0, 0, 0);
}

const prop = (c: HsContact, k: string): string => c.properties[k] ?? "";
const numProp = (c: HsContact, k: string): number | null => {
  const v = c.properties[k];
  if (v == null || v === "") return null;
  const n = parseFloat(v);
  return isFinite(n) ? n : null;
};

export type QaraKpis = {
  totalLeads: number;
  nuevosNew: number; // hs_lead_status = NEW (esperando ser escaneados por Qara)
  nuevosHoy: number; // createdate = hoy (Costa Rica)
  contactados: number; // Qara realmente los contactó (ai_outreach_message presente)
  scoreados: number; // ai_score presente
  scorePromedio: number | null;
  altaIntencion: number; // score >= 8
};

export type Agg = { name: string; value: number };
export type Bin = { label: string; count: number };

export type QaraData = {
  kpis: QaraKpis;
  scoreHistograma: Bin[];
  porProyecto: Agg[];
  llamadaVsMensaje: Agg[];
  funnel: Agg[];
  engagement: Agg[];
  useType: Agg[];
  budget: Agg[];
  timeline: Agg[];
};

const FUNNEL_ORDER = ["NEW", "IN_PROGRESS", "OPEN_DEAL", "CONNECTED", "UNQUALIFIED"];
const FUNNEL_LABEL: Record<string, string> = {
  NEW: "Nuevo",
  IN_PROGRESS: "En proceso",
  OPEN_DEAL: "Negociación",
  CONNECTED: "Contactado",
  UNQUALIFIED: "Descartado",
};

// CLAVE: el portal de CORE tiene 70k+ contactos con un funnel inmobiliario legacy propio
// (UNQUALIFIED, COMPRADOR, CITA, RE-CONVERSION…) que Qara NUNCA tocó — así que "estado != NEW"
// NO significa "contactado por Qara". Definimos la población de Qara por las props que Qara
// escribe: `ai_outreach_message` (contactó) y `ai_score` (puntuó). Los CONTEOS salen de
// búsquedas con filtro (searchTotal, exactos sobre los 70k); las DISTRIBUCIONES se agregan
// sobre los sets chicos de Qara (decenas de filas).
export async function getQaraData(): Promise<QaraData> {
  const has = (p: string) => [{ filters: [{ propertyName: p, operator: "HAS_PROPERTY" }] }];
  const [totalLeads, nuevosNew, nuevosHoy, contactados, scoreados, scoredContacts, contactedContacts] =
    await Promise.all([
      searchTotal([]),
      searchTotal([{ filters: [{ propertyName: "hs_lead_status", operator: "EQ", value: "NEW" }] }]),
      searchTotal([{ filters: [{ propertyName: "createdate", operator: "GTE", value: String(startOfTodayCRms()) }] }]),
      searchTotal(has("ai_outreach_message")),
      searchTotal(has("ai_score")),
      fetchMatching(has("ai_score")),
      fetchMatching(has("ai_outreach_message")),
    ]);

  const scores = scoredContacts.map((c) => numProp(c, "ai_score")).filter((s): s is number => s != null);

  const kpis: QaraKpis = {
    totalLeads,
    nuevosNew,
    nuevosHoy,
    contactados,
    scoreados,
    scorePromedio: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    altaIntencion: scores.filter((s) => s >= 8).length,
  };

  return {
    kpis,
    scoreHistograma: scoreHistograma(scores),
    porProyecto: topN(aggCount(contactedContacts, (c) => prop(c, "proyecto_de_interes") || "Sin proyecto"), 8),
    llamadaVsMensaje: callVsMessage(contactedContacts),
    funnel: funnelAgg(contactedContacts), // solo el pipeline de Qara, no el legacy de 54k
    engagement: aggCount(scoredContacts, (c) => prop(c, "ai_engagement") || "Sin dato"),
    useType: topN(aggCount(scoredContacts, (c) => prop(c, "ai_use_type") || "Sin dato"), 8),
    budget: aggCount(scoredContacts, (c) => prop(c, "ai_budget") || "Sin dato"),
    timeline: aggCount(scoredContacts, (c) => prop(c, "ai_timeline") || "Sin dato"),
  };
}

// ── helpers ──
function aggCount(rows: HsContact[], key: (c: HsContact) => string): Agg[] {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
function topN(arr: Agg[], n: number): Agg[] {
  return arr.slice(0, n);
}
function scoreHistograma(scores: number[]): Bin[] {
  // Buckets de score 1–10 (Qara puntúa 1–10).
  return Array.from({ length: 10 }, (_, i) => {
    const s = i + 1;
    return { label: String(s), count: scores.filter((x) => Math.round(x) === s).length };
  });
}
function callVsMessage(rows: HsContact[]): Agg[] {
  let call = 0;
  let msg = 0;
  for (const c of rows) {
    const v = prop(c, "llamar_por_telefono").toLowerCase();
    if (v === "true" || v === "yes" || v === "sí" || v === "si") call++;
    else msg++;
  }
  return [
    { name: "Llamada", value: call },
    { name: "Mensaje", value: msg },
  ];
}
function funnelAgg(rows: HsContact[]): Agg[] {
  const m = new Map<string, number>();
  for (const c of rows) {
    const st = prop(c, "hs_lead_status").toUpperCase();
    if (!st) continue;
    m.set(st, (m.get(st) ?? 0) + 1);
  }
  // Ordena por la secuencia del funnel; estados desconocidos al final.
  const known = FUNNEL_ORDER.filter((k) => m.has(k)).map((k) => ({
    name: FUNNEL_LABEL[k] ?? k,
    value: m.get(k)!,
  }));
  const otros = [...m.entries()]
    .filter(([k]) => !FUNNEL_ORDER.includes(k))
    .map(([k, v]) => ({ name: k, value: v }));
  return [...known, ...otros];
}
