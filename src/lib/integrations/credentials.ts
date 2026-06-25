import { getTenantId } from "@/lib/tenant-registry";

/**
 * Resolve integration tokens from env.
 * Convention: INTEGRATION_<TENANT>_<SOURCE>_TOKEN e.g. INTEGRATION_CORE_QUICKBASE_TOKEN
 * Also accepts plain INTEGRATION_<SOURCE>_TOKEN for single-tenant deploys.
 */
export function resolveIntegrationToken(source: string): string | undefined {
  const tenant = (process.env.TENANT_ID || process.env.NEXT_PUBLIC_TENANT_ID || "core").toUpperCase();
  const src = source.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  return (
    process.env[`INTEGRATION_${tenant}_${src}_TOKEN`] ||
    process.env[`INTEGRATION_${src}_TOKEN`] ||
    undefined
  );
}
