import "server-only";
import { resolveIntegrationToken } from "@/lib/integrations/credentials";

/** Server-only env for CORE agent dashboards — maps portal-stack + core-dashboard names. */
export const env = {
  NEXT_PUBLIC_WORKSPACE_ID: process.env.NEXT_PUBLIC_TENANT_ID || process.env.TENANT_ID || "core",
  QUICKBASE_REALM: process.env.QUICKBASE_REALM || "levinnovation.quickbase.com",
  QUICKBASE_USER_TOKEN:
    resolveIntegrationToken("quickbase") ||
    process.env.QUICKBASE_USER_TOKEN ||
    "",
  CORE_QB_APP_ID: process.env.CORE_QB_APP_ID || "bv52fj77v",
  CORE_QB_CONTRATOS_TABLE_ID:
    process.env.CORE_QB_CONTRATOS_TABLE_ID || process.env.QUICKBASE_CONTRACTS_TABLE || "",
  CORE_QB_CONVERSION_TABLE_ID:
    process.env.CORE_QB_CONVERSION_TABLE_ID || process.env.QUICKBASE_CONVERSION_TABLE || "",
  QARA_API_URL: process.env.QARA_API_URL || "",
  QARA_API_KEY: process.env.QARA_API_KEY || process.env.QARA_API_SECRET || "",
  HUBSPOT_TOKEN:
    resolveIntegrationToken("hubspot") ||
    process.env.HUBSPOT_ACCESS_TOKEN ||
    process.env.HUBSPOT_TOKEN ||
    "",
  HUBSPOT_PORTAL_ID: process.env.HUBSPOT_PORTAL_ID || "",
  LANGFUSE_BASE_URL: process.env.LANGFUSE_BASE_URL || process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
  LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY || "",
  LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY || "",
};

export function requireEnv(key: keyof typeof env): string {
  const v = env[key];
  if (!v) throw new Error(`Falta la variable de entorno ${String(key)} (configúrala en Railway).`);
  return String(v);
}
