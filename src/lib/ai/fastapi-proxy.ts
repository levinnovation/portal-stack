import "server-only";
import { cookies } from "next/headers";
import type { UIMessage } from "ai";
import type { Payload } from "payload";
import { getAuthCookieName } from "../auth/cookie-name";
import type { SessionUser } from "../auth/provider";
import type { TenantConfig } from "../tenant";
import type { FastAPIChatRequest } from "./fastapi-types";
import {
  extractTextFromUIMessageStream,
  persistAssistantMessage,
  teeStreamForPersistence,
} from "./chat-persistence";

export interface FastAPIProxyArgs {
  user: SessionUser;
  tenant: TenantConfig;
  messages: UIMessage[];
  agentId: string;
  aiChatId: string;
  payload: Payload;
}

export function buildFastAPIChatUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/v1/chat`;
}

export function buildFastAPIProxyHeaders(secret: string): Record<string, string> {
  return {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
}

export function buildFastAPIChatBody(args: FastAPIProxyArgs & { sessionToken?: string | null }): FastAPIChatRequest {
  const { user, tenant, messages, agentId, aiChatId, sessionToken } = args;
  return {
    tenantId: tenant.id,
    userId: user.id,
    role: user.role,
    agentId,
    chatId: aiChatId,
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

/** payload-token cookie value for FastAPI session validation */
export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(getAuthCookieName())?.value ?? null;
}

export async function proxyFastAPIChat(args: FastAPIProxyArgs): Promise<Response> {
  const config = validateFastAPIConfig();
  if (!config.ok) {
    return Response.json({ error: config.error }, { status: 503 });
  }

  const sessionToken = await getSessionToken();
  const upstream = await fetch(buildFastAPIChatUrl(config.url), {
    method: "POST",
    headers: buildFastAPIProxyHeaders(config.secret),
    body: JSON.stringify(buildFastAPIChatBody({ ...args, sessionToken })),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return Response.json(
      { error: "FastAPI agent request failed", status: upstream.status, detail: detail.slice(0, 500) },
      { status: upstream.status >= 400 ? upstream.status : 502 },
    );
  }

  const { payload, aiChatId } = args;
  const stream = teeStreamForPersistence(upstream.body, async (accumulated) => {
    const text = extractTextFromUIMessageStream(accumulated);
    await persistAssistantMessage(payload, aiChatId, text);
  });

  return new Response(stream, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
