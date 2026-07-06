import type { DatasetHandler } from "./index";
import { resolveIntegrationToken } from "@/lib/integrations/credentials";

const cache = new Map<string, { at: number; value: unknown }>();
const TTL_MS = 60_000;

/** Fetch JSON from external REST API. query: { url, jsonPath?, tokenSource? } */
export const restJsonHandler: DatasetHandler = async (_payload, ctx, query) => {
  const url = String(query?.url || "");
  if (!url) return { error: "rest-json handler needs query.url" };

  const cacheKey = `${url}:${query?.jsonPath || ""}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as any;

  const headers: Record<string, string> = { Accept: "application/json" };
  const tokenSource = query?.tokenSource ? String(query.tokenSource) : undefined;
  if (tokenSource) {
    const token = resolveIntegrationToken(tokenSource);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const timeoutMs = Number(process.env.DATASET_HTTP_TIMEOUT_MS || 15000);
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) return { error: `HTTP ${res.status}` };

  let body: unknown = await res.json();
  const jsonPath = query?.jsonPath ? String(query.jsonPath) : "";
  if (jsonPath) {
    for (const part of jsonPath.split(".")) {
      if (body && typeof body === "object") body = (body as Record<string, unknown>)[part];
      else break;
    }
  }

  cache.set(cacheKey, { at: Date.now(), value: body });
  return body as any;
};
