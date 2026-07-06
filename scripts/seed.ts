/**
 * Seed script — inserts layout-builder Pages for the active tenant.
 *
 * Usage:  TENANT_ID=core pnpm seed   (defaults to core)
 *
 * Reads tenants/<id>/pages.ts (${id}Pages export) and upserts into Payload.
 * Idempotent: re-running updates existing pages.
 */
import { getPayload } from "payload";
import config from "@payload-config";
import { loadTenantPages } from "./load-tenant-pages";

async function run() {
  const tenantId = process.env.TENANT_ID || "core";
  const pages = await loadTenantPages(tenantId);
  const payload = await getPayload({ config });
  console.log(`[seed] Seeding ${pages.length} pages for tenant=${tenantId}…`);

  for (const page of pages) {
    const existing = await payload.find({
      collection: "pages",
      where: { slug: { equals: page.slug } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs[0]) {
      await payload.update({
        collection: "pages",
        id: existing.docs[0].id as any,
        data: page as any,
        overrideAccess: true,
      });
      console.log(`  ↻ updated "${page.slug}"`);
    } else {
      await payload.create({ collection: "pages", data: page as any, overrideAccess: true });
      console.log(`  + created "${page.slug}"`);
    }
  }

  console.log("[seed] Done.");
  process.exit(0);
}

run().catch((e) => {
  console.error("[seed] failed:", e);
  process.exit(1);
});
