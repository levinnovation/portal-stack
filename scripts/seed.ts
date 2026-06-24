/**
 * Seed script — runs after first boot to create demo Pages for the Core tenant.
 *
 * Usage:  pnpm seed
 *
 * Reads tenants/core/pages.ts and inserts (or upserts) the layout-builder
 * pages into Payload. Idempotent: re-running updates existing pages.
 */
import { getPayload } from "payload";
import config from "@payload-config";
import { corePages } from "../tenants/core/pages";

async function run() {
  const payload = await getPayload({ config });
  console.log(`[seed] Seeding ${corePages.length} pages for tenant=core…`);

  for (const page of corePages) {
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
