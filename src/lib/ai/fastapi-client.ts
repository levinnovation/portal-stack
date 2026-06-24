import type { UIMessage } from "ai";
import type { FastAPIChatRequest } from "./fastapi-types";

export function buildFastAPIChatUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/v1/chat`;
}

export function buildFastAPIProxyHeaders(secret: string): Record<string, string> {
  return {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
}

export function buildFastAPIChatBody(input: {
  tenantId: string;
  userId: string;
  role: string;
  agentId: string;
  chatId: string;
  messages: UIMessage[];
  sessionToken?: string | null;
}): FastAPIChatRequest {
  const { tenantId, userId, role, agentId, chatId, messages, sessionToken } = input;
  return {
    tenantId,
    userId,
    role,
    agentId,
    chatId,
    messages,
    ...(sessionToken ? { sessionToken } : {}),
  };
}

export function validateFastAPIConfig():
  | { ok: true; url: string; secret: string }
  | { ok: false; error: string } {
  const url = process.env.FASTAPI_AGENT_URL?.trim();
  const secret = process.env.FASTAPI_AGENT_SECRET?.trim();
  if (!url) return { ok: false, error: "FASTAPI_AGENT_URL is not set" };
  if (!secret) return { ok: false, error: "FASTAPI_AGENT_SECRET is not set" };
  return { ok: true, url, secret };
}

export function getFastAPITimeoutMs(): number {
  const raw = process.env.FASTAPI_AGENT_TIMEOUT_MS?.trim();
  const n = raw ? Number(raw) : 30_000;
  return Number.isFinite(n) && n > 0 ? n : 30_000;
}

export function logFastAPIProxy(tenantId: string, latencyMs: number, status: number | string): void {
  console.info(`[ai] backend=fastapi tenant=${tenantId} latency=${latencyMs}ms status=${status}`);
}

/** True when proxy failed due to config, network, or timeout (eligible for AI_BACKEND_FALLBACK). */
export function isFastAPIUnavailable(status: number): boolean {
  return status === 503;
}
