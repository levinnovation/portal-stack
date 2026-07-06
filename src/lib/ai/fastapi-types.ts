import type { UIMessage } from "ai";

/** Request body for POST {FASTAPI_AGENT_URL}/v1/chat */
export interface FastAPIChatRequest {
  tenantId: string;
  userId: string;
  role: string;
  agentId: string;
  chatId: string;
  messages: UIMessage[];
  /** payload-token cookie value — forwarded so FastAPI can validate the user session */
  sessionToken?: string;
}

/** Response is text/event-stream (AI SDK UIMessage stream); passthrough to client. */
