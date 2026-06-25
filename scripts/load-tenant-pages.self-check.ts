import assert from "node:assert/strict";
import { loadTenantPages, tenantPagesExportName } from "./load-tenant-pages";

assert.equal(tenantPagesExportName("core"), "corePages");
assert.equal(tenantPagesExportName("finu"), "finuPages");

const corePages = await loadTenantPages("core");
assert.ok(corePages.length > 0);
assert.equal(corePages[0].slug, "admin-overview");

const finuPages = await loadTenantPages("finu");
assert.ok(finuPages.length > 0);
assert.equal(finuPages[0].slug, "finu-admin-overview");

await assert.rejects(() => loadTenantPages("nonexistent-tenant-xyz"), /Missing tenants/);

console.log("load-tenant-pages.self-check ok");
