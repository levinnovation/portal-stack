import "server-only";

import { z } from "zod";
import { resolveIntegrationToken } from "@/lib/integrations/credentials";

const GraphErrorSchema = z.object({
  error: z
    .object({
      message: z.string().optional(),
      type: z.string().optional(),
      code: z.number().optional(),
      error_subcode: z.number().optional(),
      fbtrace_id: z.string().optional(),
    })
    .optional(),
});

type GraphMethod = "GET" | "POST" | "DELETE";
type MetaParamValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Record<string, unknown>
  | null
  | undefined;
type MetaParams = Record<string, MetaParamValue>;

function metaApiVersion(): string {
  return process.env.META_API_VERSION?.trim() || "v21.0";
}

function metaAccessToken(): string {
  const token = resolveIntegrationToken("meta") || process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("Meta integration is not configured (token missing)");
  return token;
}

function metaAccountId(): string {
  const account = process.env.META_AD_ACCOUNT_ID?.trim();
  if (!account) throw new Error("Meta integration is not configured (META_AD_ACCOUNT_ID missing)");
  return account;
}

function accountToComparable(value: string): string {
  return value.replace(/^act_/, "");
}

function asQuery(params: MetaParams): URLSearchParams {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      qp.set(key, JSON.stringify(value));
      return;
    }
    if (typeof value === "object") {
      qp.set(key, JSON.stringify(value));
      return;
    }
    qp.set(key, String(value));
  });
  return qp;
}

function normalizePath(path: string): string {
  if (!path.trim()) throw new Error("Meta path is required");
  return path.startsWith("/") ? path : `/${path}`;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function mapGraphError(status: number, body: unknown): Error {
  const parsed = GraphErrorSchema.safeParse(body);
  if (parsed.success && parsed.data.error?.message) {
    const msg = parsed.data.error.message;
    return new Error(`Meta Graph ${status}: ${msg}`);
  }
  return new Error(`Meta Graph ${status}`);
}

export function majorToMinorCurrency(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Invalid currency amount");
  return Math.round(value * 100);
}

export async function metaGraph<T = unknown>(
  method: GraphMethod,
  path: string,
  params: MetaParams = {},
): Promise<T> {
  const normalizedPath = normalizePath(path);
  const base = `https://graph.facebook.com/${metaApiVersion()}${normalizedPath}`;
  const payload = { ...params, access_token: metaAccessToken() };

  let res: Response;
  if (method === "GET") {
    const qp = asQuery(payload);
    res = await fetch(`${base}?${qp.toString()}`, { method, cache: "no-store" });
  } else {
    const body = asQuery(payload);
    res = await fetch(base, { method, body, cache: "no-store" });
  }

  const parsed = await parseBody(res);
  if (!res.ok) throw mapGraphError(res.status, parsed);
  return parsed as T;
}

type AccountInfo = { account_id?: string; id?: string };

export async function assertInAccount(objectId: string): Promise<void> {
  const id = String(objectId || "").trim();
  if (!id) throw new Error("Meta object id is required");
  const raw = await metaGraph<AccountInfo>("GET", `/${encodeURIComponent(id)}`, { fields: "account_id,id" });
  const objectAccount = raw.account_id ? accountToComparable(raw.account_id) : "";
  const expected = accountToComparable(metaAccountId());
  if (!objectAccount) throw new Error("Meta object has no account_id");
  if (objectAccount !== expected) throw new Error("Meta object does not belong to configured ad account");
}

export async function listAccountEdge<T = unknown>(
  edge: string,
  params: MetaParams = {},
): Promise<T> {
  const account = metaAccountId();
  return metaGraph<T>("GET", `/${encodeURIComponent(account)}/${edge}`, params);
}

/** POST to an account-scoped edge (create campaign/ad set/ad/creative/audience). */
export async function createAccountEdge<T = unknown>(
  edge: string,
  params: MetaParams = {},
): Promise<T> {
  const account = metaAccountId();
  return metaGraph<T>("POST", `/${encodeURIComponent(account)}/${edge}`, params);
}

