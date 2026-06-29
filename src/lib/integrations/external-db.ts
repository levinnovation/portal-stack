import "server-only";

import { Pool } from "pg";
import { getTenant } from "@/lib/tenant";

type ExternalDbDriver = "postgres";

type ExternalDbArgs = {
  runType?: string;
  workspaceId?: string;
  limit?: number;
};

type ExternalDbTemplateQuery = {
  text: string;
  values?: unknown[];
};

type ExternalDbTemplateFn = (args: ExternalDbArgs) => ExternalDbTemplateQuery;

const poolByEnv = new Map<string, Pool>();

const DEFAULT_WORKSPACE = process.env.INTELIGENCIA_WORKSPACE_ID || process.env.NEXT_PUBLIC_WORKSPACE_ID || "core";

const TEMPLATE_REGISTRY: Record<string, ExternalDbTemplateFn> = {
  "inteligencia.latest": ({ runType = "weekly", workspaceId = DEFAULT_WORKSPACE }) => ({
    text: `
      select *
      from core_metric_snapshots
      where workspace_id = $1 and run_type = $2
      order by snapshot_at desc
      limit 1
    `,
    values: [workspaceId, runType],
  }),
  "inteligencia.campaigns": ({ runType = "weekly", workspaceId = DEFAULT_WORKSPACE }) => ({
    text: `
      select *
      from core_campaign_snapshots
      where workspace_id = $1 and run_type = $2
      order by reservations desc nulls last, spend desc nulls last
    `,
    values: [workspaceId, runType],
  }),
  "inteligencia.leads_at_risk": ({ runType = "weekly", workspaceId = DEFAULT_WORKSPACE, limit = 50 }) => ({
    text: `
      select *
      from core_lead_snapshots
      where workspace_id = $1 and run_type = $2
      order by coalesce(revenue_at_risk, 0) desc
      limit $3
    `,
    values: [workspaceId, runType, Math.max(1, Math.min(limit, 500))],
  }),
};

function requireTemplate(name: string): ExternalDbTemplateFn {
  const template = TEMPLATE_REGISTRY[name];
  if (!template) throw new Error(`Unknown external-db template: ${name}`);
  return template;
}

function getCachedPool(url: string): Pool {
  const cached = poolByEnv.get(url);
  if (cached) return cached;

  const pool = new Pool({
    connectionString: url,
    max: Number(process.env.EXTERNAL_DB_POOL_MAX || 3),
    idleTimeoutMillis: Number(process.env.EXTERNAL_DB_POOL_IDLE_MS || 20_000),
  });
  poolByEnv.set(url, pool);
  return pool;
}

async function resolveExternalDbConfig(dbId: string): Promise<{ id: string; driver: ExternalDbDriver; urlEnv: string }> {
  const tenant = await getTenant();
  const found = tenant.externalDatabases?.find((entry) => entry.id === dbId);
  if (!found) throw new Error(`Unknown external database: ${dbId}`);
  return found;
}

export async function runExternalDbTemplate(dbId: string, templateName: string, args: ExternalDbArgs = {}) {
  const db = await resolveExternalDbConfig(dbId);
  if (db.driver !== "postgres") throw new Error(`Unsupported external database driver: ${db.driver}`);

  const envValue = process.env[db.urlEnv];
  if (!envValue) throw new Error(`Missing env var for external database ${db.id}: ${db.urlEnv}`);

  const template = requireTemplate(templateName);
  const query = template(args);
  const pool = getCachedPool(envValue);

  const result = await pool.query(query.text, query.values);
  return result.rows as Record<string, unknown>[];
}

