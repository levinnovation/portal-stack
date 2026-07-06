import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const tenantsRoot = path.resolve("tenants");
const registryPath = path.resolve("tenants/registry.ts");
const registrySrc = fs.readFileSync(registryPath, "utf8");

const onDisk = fs
  .readdirSync(tenantsRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => d.name)
  .sort();

assert.ok(onDisk.length > 0, "expected at least one tenant directory under tenants/");

for (const id of onDisk) {
  assert.match(
    registrySrc,
    new RegExp(`from ["']\\./${id}/config["']`),
    `tenants/registry.ts must import tenants/${id}/config`,
  );
  assert.match(
    registrySrc,
    new RegExp(`\\b${id}:\\s*\\w+Tenant\\b`),
    `tenants/registry.ts TENANT_REGISTRY must include ${id}`,
  );
}

console.log(`tenant-registry.self-check ok (${onDisk.join(", ")})`);
