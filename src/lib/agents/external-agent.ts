import "server-only";

import { getTenant } from "@/lib/tenant";

type AnyObject = Record<string, unknown>;

export type ExternalAgentAction = {
  name: string;
  label?: string;
  path?: string;
  method?: "GET" | "POST";
  inputs?: string[];
};

export type ExternalAgentResolved = {
  id: string;
  label: string;
  baseUrl: string;
  apiKey?: string;
  runPath?: string;
  statusPath?: string;
  schedulePath?: string;
  statusAdapter?: string;
  actions: ExternalAgentAction[];
};

function normalizeAction(raw: AnyObject): ExternalAgentAction {
  const inputRows = Array.isArray(raw.inputs) ? raw.inputs : [];
  const inputs = inputRows
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object" && "name" in entry) return String((entry as AnyObject).name || "");
      return "";
    })
    .filter(Boolean);
  return {
    name: String(raw.name || ""),
    label: raw.label ? String(raw.label) : undefined,
    path: raw.path ? String(raw.path) : undefined,
    method: raw.method === "GET" ? "GET" : raw.method === "POST" ? "POST" : undefined,
    inputs,
  };
}

function resolveAction(agent: ExternalAgentResolved, actionName?: string): ExternalAgentAction | undefined {
  if (!actionName) return undefined;
  return agent.actions.find((entry) => entry.name === actionName);
}

export async function getExternalAgent(agentId: string): Promise<ExternalAgentResolved> {
  const tenant = await getTenant();
  const raw = tenant.externalAgents?.find((entry) => entry.id === agentId) as AnyObject | undefined;
  if (!raw) throw new Error(`Unknown external agent: ${agentId}`);

  const baseUrlEnv = String(raw.baseUrlEnv || "");
  if (!baseUrlEnv) throw new Error(`Agent ${agentId} has no baseUrlEnv`);
  const baseUrl = process.env[baseUrlEnv];
  if (!baseUrl) throw new Error(`Missing env var for agent ${agentId}: ${baseUrlEnv}`);

  const apiKeyEnv = raw.apiKeyEnv ? String(raw.apiKeyEnv) : "";
  const apiKey = apiKeyEnv ? process.env[apiKeyEnv] : undefined;

  const actionsRaw = Array.isArray(raw.actions) ? (raw.actions as AnyObject[]) : [];
  const actions = actionsRaw.map(normalizeAction).filter((entry) => entry.name);

  return {
    id: String(raw.id || agentId),
    label: String(raw.label || agentId),
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey,
    runPath: raw.runPath ? String(raw.runPath) : undefined,
    statusPath: raw.statusPath ? String(raw.statusPath) : undefined,
    schedulePath: raw.schedulePath ? String(raw.schedulePath) : undefined,
    statusAdapter: raw.statusAdapter ? String(raw.statusAdapter) : undefined,
    actions,
  };
}

function buildHeaders(apiKey?: string): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;
  return headers;
}

export async function runExternalAgentAction(agent: ExternalAgentResolved, body: AnyObject) {
  const actionName = body.action ? String(body.action) : undefined;
  const action = resolveAction(agent, actionName);
  const path = action?.path || agent.runPath;
  if (!path) throw new Error(`Agent ${agent.id} has no run path configured`);

  const endpoint = `${agent.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const method = action?.method || "POST";

  const payload = body.payload && typeof body.payload === "object" ? (body.payload as AnyObject) : body;
  const res = await fetch(endpoint, {
    method,
    headers: buildHeaders(agent.apiKey),
    body: method === "GET" ? undefined : JSON.stringify(payload),
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // keep raw text
  }
  if (!res.ok) {
    throw new Error(`Agent ${agent.id} run failed ${res.status}: ${typeof data === "string" ? data.slice(0, 240) : JSON.stringify(data).slice(0, 240)}`);
  }
  return data;
}

export async function getExternalAgentStatus(agent: ExternalAgentResolved, traceId: string) {
  if (!agent.statusPath) throw new Error(`Agent ${agent.id} has no status path configured`);
  const statusPath = agent.statusPath.endsWith("/")
    ? `${agent.statusPath}${encodeURIComponent(traceId)}`
    : `${agent.statusPath}/${encodeURIComponent(traceId)}`;
  const endpoint = `${agent.baseUrl}${statusPath.startsWith("/") ? statusPath : `/${statusPath}`}`;
  const res = await fetch(endpoint, { headers: buildHeaders(agent.apiKey), cache: "no-store" });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // keep raw text
  }
  if (!res.ok) {
    throw new Error(`Agent ${agent.id} status failed ${res.status}: ${typeof data === "string" ? data.slice(0, 240) : JSON.stringify(data).slice(0, 240)}`);
  }
  return data;
}

export async function getExternalAgentSchedule(agent: ExternalAgentResolved) {
  if (!agent.schedulePath) return { available: false, reason: "Agent schedule path not configured" };
  const endpoint = `${agent.baseUrl}${agent.schedulePath.startsWith("/") ? agent.schedulePath : `/${agent.schedulePath}`}`;
  const res = await fetch(endpoint, { headers: buildHeaders(agent.apiKey), cache: "no-store" });
  if (res.status === 404) {
    return { available: false, reason: "Schedule endpoint not available" };
  }
  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // keep raw text
  }
  if (!res.ok) {
    throw new Error(`Agent ${agent.id} schedule failed ${res.status}`);
  }
  return data;
}

export async function setExternalAgentSchedule(agent: ExternalAgentResolved, payload: AnyObject) {
  if (!agent.schedulePath) throw new Error(`Agent ${agent.id} has no schedule path configured`);
  const endpoint = `${agent.baseUrl}${agent.schedulePath.startsWith("/") ? agent.schedulePath : `/${agent.schedulePath}`}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: buildHeaders(agent.apiKey),
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // keep raw text
  }
  if (!res.ok) {
    throw new Error(`Agent ${agent.id} schedule save failed ${res.status}: ${typeof data === "string" ? data.slice(0, 240) : JSON.stringify(data).slice(0, 240)}`);
  }
  return data;
}

