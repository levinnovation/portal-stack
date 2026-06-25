import assert from "node:assert/strict";
import { coreTenant } from "../../tenants/core/config";
import { finuTenant } from "../../tenants/finu/config";

assert.ok(
  (coreTenant.payloadCollections ?? []).length >= 9,
  "coreTenant.payloadCollections should include realestate vertical collections",
);
assert.ok(Array.isArray(finuTenant.payloadCollections), "finuTenant.payloadCollections should be wired");

console.log("tenant-collections.self-check ok");
