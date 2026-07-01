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
import type { TenantConfig } from "../tenant-types";

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
  // openai (default) or vercel-gateway both use the openai() constructor.
  // Base URL comes from OPENAI_BASE_URL (e.g. a LiteLLM proxy); OPENAI_MODEL
  // overrides the tenant default so models can be swapped without a redeploy
  // (the proxy's available model groups change as credit/providers shift).
  if (!process.env.OPENAI_API_KEY && ai.provider === "openai") {
    throw new Error("OPENAI_API_KEY not set");
  }
  const modelId = process.env.OPENAI_MODEL || ai.model;
  // Use Chat Completions (not the default Responses API) — LiteLLM/proxies and
  // non-OpenAI models behind them support /chat/completions reliably, while
  // /v1/responses coverage is spotty.
  return { model: openai.chat(modelId), provider: "openai", modelId };
}

export async function resolveSystemPrompt(agentId: string, user: SessionUser): Promise<string> {
  const tenant = await getTenant();
  const tenantId = tenant.id === "_default" ? "_default" : tenant.id;
  // ponytail: static imports keyed off TENANT_ID at build time. No dynamic
  // import() — webpack can't statically analyse a runtime string, and the
  // dynamic import forced a `new Function` workaround that broke
  // server-rendered routes. Add new tenants to the map below.
  const prompts: Record<string, { systemPrompt?: string; toolsDescription?: string }> = {
    _default: await import("../../../tenants/_default/ai/prompts"),
    core: await import("../../../tenants/core/ai/prompts"),
    finu: await import("../../../tenants/finu/ai/prompts"),
  };
  const mod = prompts[tenantId] ?? prompts._default;
  const base = mod?.systemPrompt ?? prompts._default?.systemPrompt ?? "Eres un asistente del portal.";
  const toolsDesc = mod?.toolsDescription ? `\n\n${mod.toolsDescription}` : "";
  const userCtx = `\n\nEl usuario actual es: ${user.role} (id: ${user.id}, email: ${user.email}). Adapta tus respuestas.`;
  return base + toolsDesc + userCtx;
}

export async function resolveTools(user: SessionUser, tenant: TenantConfig) {
  const payload = await getPayloadClient();
  return buildTools(payload, user, tenant);
}
