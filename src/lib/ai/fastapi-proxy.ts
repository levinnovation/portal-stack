import "server-only";
import { cookies } from "next/headers";
import type { Payload } from "payload";
import type { UIMessage } from "ai";
import { getAuthCookieName } from "../auth/cookie-name";
import type { SessionUser } from "../auth/provider";
import type { TenantConfig } from "../tenant";
import {
  buildFastAPIChatBody,
  buildFastAPIChatUrl,
  buildFastAPIProxyHeaders,
  getFastAPITimeoutMs,
  logFastAPIProxy,
  validateFastAPIConfig,
} from "./fastapi-client";
import {
  extractTextFromUIMessageStream,
  persistAssistantMessage,
  teeStreamForPersistence,
} from "./chat-persistence";

export {
  buildFastAPIChatBody,
  buildFastAPIChatUrl,
  buildFastAPIProxyHeaders,
  getFastAPITimeoutMs,
  isFastAPIUnavailable,
  validateFastAPIConfig,
} from "./fastapi-client";

export interface FastAPIProxyArgs {
  user: SessionUser;
  tenant: TenantConfig;
  messages: UIMessage[];
  agentId: string;
  aiChatId: string;
  payload: Payload;
}

/** payload-token cookie value for FastAPI session validation */
export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(getAuthCookieName())?.value ?? null;
}

export async function proxyFastAPIChat(args: FastAPIProxyArgs): Promise<Response> {
  const { tenant } = args;
  const start = Date.now();
  const config = validateFastAPIConfig();
  if (!config.ok) {
    logFastAPIProxy(tenant.id, Date.now() - start, 503);
    return Response.json({ error: config.error }, { status: 503 });
  }

  const sessionToken = await getSessionToken();
  let upstream: Response;
  try {
    upstream = await fetch(buildFastAPIChatUrl(config.url), {
      method: "POST",
      headers: buildFastAPIProxyHeaders(config.secret),
      body: JSON.stringify(
        buildFastAPIChatBody({
          tenantId: tenant.id,
          userId: args.user.id,
          role: args.user.role,
          agentId: args.agentId,
          chatId: args.aiChatId,
          messages: args.messages,
          sessionToken,
        }),
      ),
      signal: AbortSignal.timeout(getFastAPITimeoutMs()),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "FastAPI agent unreachable";
    logFastAPIProxy(tenant.id, Date.now() - start, 503);
    return Response.json({ error: "FastAPI agent unreachable", detail: message }, { status: 503 });
  }

  logFastAPIProxy(tenant.id, Date.now() - start, upstream.status);

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
      "X-Chat-Id": aiChatId,
    },
  });
}
