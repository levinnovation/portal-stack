import type { UIMessage } from "ai";
import type { Payload } from "payload";

export async function ensureChat(
  payload: Payload,
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
  return String((created as { id: string | number }).id);
}

export async function persistUserMessage(
  payload: Payload,
  aiChatId: string,
  messages: UIMessage[],
): Promise<void> {
  const lastUserText = extractLastUserText(messages);
  if (!lastUserText) return;
  await payload.create({
    collection: "ai-messages",
    data: { chat: aiChatId, role: "user", content: lastUserText },
    overrideAccess: true,
  });
}

export async function persistAssistantMessage(
  payload: Payload,
  aiChatId: string,
  text: string,
  tokens?: number | null,
): Promise<void> {
  if (!text) return;
  await payload.create({
    collection: "ai-messages",
    data: {
      chat: aiChatId,
      role: "assistant",
      content: text,
      tokens: tokens ?? null,
    },
    overrideAccess: true,
  });
}

export function extractLastUserText(messages: UIMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return extractText(messages[i]);
  }
  return null;
}

export function extractText(m: UIMessage | undefined): string | null {
  if (!m) return null;
  return (
    m.parts
      ?.filter((p) => p.type === "text")
      .map((p) => (p as { text: string }).text)
      .join("") ?? null
  );
}

/** ponytail: naive SSE scan for text-delta chunks; upgrade to structured parser if format changes */
export function extractTextFromUIMessageStream(sse: string): string {
  let text = "";
  for (const line of sse.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const raw = line.slice(6).trim();
    if (!raw || raw === "[DONE]") continue;
    try {
      const evt = JSON.parse(raw) as { type?: string; delta?: string };
      if (evt.type === "text-delta" && evt.delta) text += evt.delta;
    } catch {
      // ignore non-JSON lines
    }
  }
  return text;
}

export function teeStreamForPersistence(
  body: ReadableStream<Uint8Array>,
  onComplete: (accumulated: string) => void | Promise<void>,
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        await onComplete(accumulated);
        controller.close();
        return;
      }
      accumulated += decoder.decode(value, { stream: true });
      controller.enqueue(value);
    },
    cancel() {
      reader.cancel();
    },
  });
}
