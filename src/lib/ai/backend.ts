export type AIBackend = "local" | "fastapi";

export interface AIBackendConfig {
  backend?: AIBackend;
}

/** Tenant ai.backend wins; else AI_BACKEND env; default "local". */
export function resolveAIBackend(ai: AIBackendConfig): AIBackend {
  if (ai.backend === "local" || ai.backend === "fastapi") return ai.backend;
  const env = process.env.AI_BACKEND?.trim();
  if (env === "fastapi" || env === "local") return env;
  return "local";
}
