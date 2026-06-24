import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { getSession } from "@/lib/session";
import { getTenant } from "@/lib/tenant";
import { getPayloadClient } from "@/lib/payload";
import { resolveLanguageModel, resolveSystemPrompt, resolveTools } from "@/lib/ai/agent";

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
  const { model } = await resolveLanguageModel();
  const systemPrompt = await resolveSystemPrompt(agentId ?? "default", user);
  const tools = await resolveTools(user);

  // Persist chat + user message
  const aiChatId = await ensureChat(payload, chatId, user, agentId ?? "default", messages);

  const lastUserText = extractLastUserText(messages);
  if (lastUserText) {
    await payload.create({
      collection: "ai-messages",
      data: {
        chat: aiChatId,
        role: "user",
        content: lastUserText,
      },
      overrideAccess: true,
    });
  }

  const result = streamText({
    model,
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    tools,
    temperature: tenant.ai.temperature,
    stopWhen: ({ steps }) => steps.length >= (tenant.ai.maxStepsPerTurn ?? 5),
    onFinish: async ({ text, toolCalls, toolResults, usage }) => {
      // Persist assistant final answer
      await payload.create({
        collection: "ai-messages",
        data: {
          chat: aiChatId,
          role: "assistant",
          content: text,
          tokens: usage?.totalTokens ?? null,
        },
        overrideAccess: true,
      });
      // Optionally persist each tool call (best-effort, non-blocking)
      for (let i = 0; i < (toolCalls?.length ?? 0); i++) {
        const call: any = toolCalls![i];
        const out = toolResults?.[i];
        await payload.create({
          collection: "ai-messages",
          data: {
            chat: aiChatId,
            role: "tool",
            content: typeof out === "string" ? out : JSON.stringify(out ?? {}),
            toolName: call?.toolName ?? "unknown",
            toolInput: call?.input ?? null,
            toolOutput: out ?? null,
          },
          overrideAccess: true,
        });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}

async function ensureChat(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  chatId: string | undefined,
  user: { id: string },
  agentId: string,
  messages: UIMessage[],
): Promise<string> {
  if (chatId) return chatId;
  const firstUser = messages.find((m) => m.role === "user");
  const title = extractText(firstUser)?.slice(0, 80) || "Nueva conversación";
  const created = await payload.create({
    collection: "ai-chats",
    data: { user: user.id, agentId, title },
    overrideAccess: true,
  });
  return String((created as any).id);
}

function extractLastUserText(messages: UIMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return extractText(messages[i]);
  }
  return null;
}

function extractText(m: UIMessage | undefined): string | null {
  if (!m) return null;
  return (
    m.parts
      ?.filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("") ?? null
  );
}
