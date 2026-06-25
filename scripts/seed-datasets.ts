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
