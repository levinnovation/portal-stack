import type { UIMessage } from "ai";
import { getSession } from "@/lib/session";
import { getTenant, resolveAIBackend } from "@/lib/tenant";
import { getPayloadClient } from "@/lib/payload";
import { ensureChat, persistUserMessage } from "@/lib/ai/chat-persistence";
import { streamLocalChat } from "@/lib/ai/local-chat";
import { proxyFastAPIChat, isFastAPIUnavailable } from "@/lib/ai/fastapi-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { messages, agentId, chatId } = body as {
    messages: UIMessage[];
    agentId?: string;
    chatId?: string;
  };

  if (!messages || !Array.isArray(messages)) {
    return new Response("Bad request: messages required", { status: 400 });
  }

  const tenant = await getTenant();
  if (!tenant.features.aiAgent || !tenant.ai.enabled) {
    return new Response("AI agent disabled for this tenant", { status: 403 });
  }

  const payload = await getPayloadClient();
  const resolvedAgentId = agentId ?? "default";
  const aiChatId = await ensureChat(payload, chatId, user, resolvedAgentId, messages);
  await persistUserMessage(payload, aiChatId, messages);

  const chatArgs = {
    user,
    tenant,
    messages,
    agentId: resolvedAgentId,
    aiChatId,
    payload,
  };

  if (resolveAIBackend(tenant.ai) === "fastapi") {
    const res = await proxyFastAPIChat(chatArgs);
    // ponytail: opt-in only — set AI_BACKEND_FALLBACK=local to retry with in-process AI SDK
    if (isFastAPIUnavailable(res.status) && process.env.AI_BACKEND_FALLBACK?.trim() === "local") {
      console.warn("[ai] FastAPI unavailable, falling back to local (AI_BACKEND_FALLBACK=local)");
      return streamLocalChat(chatArgs);
    }
    return res;
  }

  return streamLocalChat(chatArgs);
}
