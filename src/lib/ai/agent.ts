/**
 * AI agent setup.
 *
 * The agent runs server-side in the /api/ai/chat route. It:
 *  1. Loads the tenant's AI config (provider, model, system prompt, maxSteps, temp).
 *  2. Loads the system prompt from tenants/<id>/ai/prompts.ts.
 *  3. Builds a list of tools scoped to the current user's role.
 *  4. Streams a response using AI SDK's streamText().
 *
 * Tools live in ./tools and are generic — they call Payload directly. Add
 * per-tenant tools by extending the core toolset inside the tenant's
 * config (see tenants/core/ai/prompts.ts for the persona hook).
 */

import "server-only";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import { getTenant } from "../tenant";
import { getPayloadClient } from "../payload";
import { buildTools } from "./tools";
import type { SessionUser } from "../auth/provider";

export interface AgentRunArgs {
  user: SessionUser;
  agentId?: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  chatId?: string;
}

export async function resolveLanguageModel(): Promise<{ model: LanguageModel; provider: string; modelId: string }> {
  const tenant = await getTenant();
  const ai = tenant.ai;
  if (!ai.enabled) throw new Error("AI agent is disabled for this tenant");
  if (ai.provider === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
    return { model: anthropic(ai.model), provider: "anthropic", modelId: ai.model };
  }
  // openai (default) or vercel-gateway both use the openai() constructor
  if (!process.env.OPENAI_API_KEY && ai.provider === "openai") {
    throw new Error("OPENAI_API_KEY not set");
  }
  return { model: openai(ai.model), provider: "openai", modelId: ai.model };
}

export async function resolveSystemPrompt(agentId: string, user: SessionUser): Promise<string> {
  const tenant = await getTenant();
  const tenantId = tenant.id === "_default" ? "_default" : tenant.id;
  let base: string;
  try {
    const path = `../../../tenants/${tenantId}/ai/prompts`;
    const mod = await import(/* @vite-ignore */ path);
    base = (mod as any).systemPrompt || "Eres un asistente del portal.";
  } catch {
    const fallback = await import("../../../tenants/_default/ai/prompts");
    base = (fallback as any).systemPrompt || "Eres un asistente del portal.";
  }
  const userCtx = `\n\nEl usuario actual es: ${user.role} (id: ${user.id}, email: ${user.email}). Adapta tus respuestas.`;
  return base + userCtx;
}

export async function resolveTools(user: SessionUser) {
  const payload = await getPayloadClient();
  return buildTools(payload, user);
}
