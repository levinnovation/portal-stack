import "server-only";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import type { Payload } from "payload";
import type { SessionUser } from "../auth/provider";
import type { TenantConfig } from "../tenant";
import { resolveLanguageModel, resolveSystemPrompt, resolveTools } from "./agent";

export interface LocalChatArgs {
  user: SessionUser;
  tenant: TenantConfig;
  messages: UIMessage[];
  agentId: string;
  aiChatId: string;
  payload: Payload;
}

export async function streamLocalChat(args: LocalChatArgs): Promise<Response> {
  const { user, tenant, messages, agentId, aiChatId, payload } = args;
  const { model } = await resolveLanguageModel();
  const systemPrompt = await resolveSystemPrompt(agentId, user);
  const tools = await resolveTools(user);

  const result = streamText({
    model,
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    tools,
    temperature: tenant.ai.temperature,
    stopWhen: ({ steps }) => steps.length >= (tenant.ai.maxStepsPerTurn ?? 5),
    onFinish: async ({ text, toolCalls, toolResults, usage }) => {
      await payload.create({
        collection: "ai-messages",
        data: {
          chat: Number(aiChatId),
          role: "assistant",
          content: text,
          tokens: usage?.totalTokens ?? null,
        },
        overrideAccess: true,
      });
      for (let i = 0; i < (toolCalls?.length ?? 0); i++) {
        const call = toolCalls![i] as { toolName?: string; input?: unknown };
        const out = toolResults?.[i];
        await payload.create({
          collection: "ai-messages",
          data: {
            chat: Number(aiChatId),
            role: "tool",
            content: typeof out === "string" ? out : JSON.stringify(out ?? {}),
            toolName: call?.toolName ?? "unknown",
            toolInput: (call?.input ?? null) as Record<string, unknown> | null,
            toolOutput: out ?? null,
          },
          overrideAccess: true,
        });
      }
    },
  });

  return result.toUIMessageStreamResponse({
    headers: { "X-Chat-Id": aiChatId },
  });
}
