/**
 * Seed named datasets for the active tenant (core defaults).
 * Usage: pnpm seed:datasets
 */
import { getPayload } from "payload";
import config from "@payload-config";

const CORE_DATASETS = [
  { name: "Project count", key: "count:projects", vertical: "realestate", query: { kind: "count", collection: "projects" } },
  { name: "Investor count", key: "count:investors", vertical: "realestate", query: { kind: "count", collection: "investors" } },
  { name: "Payment list", key: "list:payments", vertical: "realestate", query: { kind: "list", collection: "payments", limit: 20, sort: "-dueDate" } },

  // Inteligencia BI snapshots via external DB templates
  {
    name: "Inteligencia latest snapshot",
    key: "core.inteligencia.latest",
    vertical: "realestate",
    query: {
      kind: "custom",
      handler: "external-db",
      db: "bi",
      template: "inteligencia.latest",
      params: { runType: "weekly" },
    },
  },
  {
    name: "Inteligencia campaigns",
    key: "core.inteligencia.campaigns",
    vertical: "realestate",
    query: {
      kind: "custom",
      handler: "external-db",
      db: "bi",
      template: "inteligencia.campaigns",
      params: { runType: "weekly" },
    },
  },
  {
    name: "Inteligencia leads at risk",
    key: "core.inteligencia.leads_at_risk",
    vertical: "realestate",
    query: {
      kind: "custom",
      handler: "external-db",
      db: "bi",
      template: "inteligencia.leads_at_risk",
      params: { runType: "weekly", limit: 50 },
    },
  },

  // Leah / Qara bridge datasets (HTTP to existing BFF routes)
  {
    name: "Leah KPIs",
    key: "core.leah.kpis",
    vertical: "realestate",
    query: {
      kind: "http",
      url: "http://localhost:3000/api/agents/leah/kpis",
    },
  },
  {
    name: "Qara KPIs",
    key: "core.qara.kpis",
    vertical: "realestate",
    query: {
      kind: "http",
      url: "http://localhost:3000/api/agents/qara/kpis",
    },
  },
  {
    name: "Qara distribution",
    key: "core.qara.distribution",
    vertical: "realestate",
    query: {
      kind: "http",
      url: "http://localhost:3000/api/agents/qara/distribution",
    },
  },
];

async function run() {
  const payload = await getPayload({ config });
  for (const ds of CORE_DATASETS) {
    const existing = await payload.find({
      collection: "datasets",
      where: { key: { equals: ds.key } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs[0]) {
      await payload.update({ collection: "datasets", id: existing.docs[0].id as any, data: ds as any, overrideAccess: true });
    } else {
      await payload.create({ collection: "datasets", data: ds as any, overrideAccess: true });
    }
  }
  console.log(`[seed:datasets] upserted ${CORE_DATASETS.length} datasets`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
