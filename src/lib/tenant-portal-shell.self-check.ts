import assert from "node:assert/strict";
import { coreTenant } from "@tenants/core/config";
import { toPortalShellTenant } from "./tenant-portal-shell";

const shell = toPortalShellTenant(coreTenant);
assert.equal(shell.theme.brand, "CORE");
assert.ok(!("payloadCollections" in shell));
assert.ok(JSON.stringify(shell).includes("CORE"));
console.log("tenant-portal-shell.self-check ok");
