import assert from "node:assert/strict";
import { coreTenant } from "@tenants/core/config";
import { resolveTenantRole } from "./resolve-tenant-role";

const admin = resolveTenantRole(coreTenant, "superadmin");
assert.equal(admin?.key, "admin", "superadmin should resolve to admin role");
assert.equal(resolveTenantRole(coreTenant, "member"), undefined);
console.log("resolve-tenant-role.self-check ok");
