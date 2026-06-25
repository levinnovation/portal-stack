import assert from "node:assert/strict";
import { coreTenant } from "@tenants/core/config";
import { corePages } from "@tenants/core/pages";
import { navPathToSlugCandidates } from "@/lib/blocks/page-slug";

const slugs = new Set(corePages.map((p) => p.slug));

for (const role of coreTenant.roles) {
  for (const item of role.nav) {
    if (item.kind === "group" || !item.to) continue;
    if (item.end || item.kind === "custom") continue;
    const candidates = navPathToSlugCandidates(item.to, role.homePath);
    const hit = candidates.some((c) => c && slugs.has(c));
    assert.ok(hit, `nav ${item.to} has no matching page slug (tried ${candidates.join(", ")})`);
  }
}

console.log("nav-slugs.self-check ok");
