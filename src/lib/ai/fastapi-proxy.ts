import "server-only";
import type { UIMessage } from "ai";
import type { Payload } from "payload";
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

export async function proxyFastAPIChat(args: FastAPIProxyArgs): Promise<Response> {
  const url = process.env.FASTAPI_AGENT_URL?.trim();
  const secret = process.env.FASTAPI_AGENT_SECRET?.trim();
  if (!url || !secret) {
    return Response.json(
      { error: "FastAPI agent not configured (FASTAPI_AGENT_URL / FASTAPI_AGENT_SECRET)" },
      { status: 503 },
    );
  }

  const upstream = await fetch(buildFastAPIChatUrl(url), {
    method: "POST",
    headers: buildFastAPIProxyHeaders(secret),
    body: JSON.stringify(buildFastAPIChatBody(args)),
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
