import assert from "node:assert/strict";
import { extendedToolNames, shouldEnableExtendedTools } from "./tools/availability";
import { coreTenant } from "@tenants/core/config";
import type { SessionUser } from "../auth/provider";
import type { TenantConfig } from "../tenant-types";

const adminUser: SessionUser = {
  id: "1",
  email: "admin@example.com",
  name: "Admin",
  role: "admin",
  themePreference: "system",
};

const investorUser: SessionUser = {
  id: "2",
  email: "investor@example.com",
  name: "Investor",
  role: "investor",
  themePreference: "system",
};

assert.ok(extendedToolNames.includes("bi_snapshot"), "bi_snapshot must be part of extended toolset");
assert.ok(extendedToolNames.includes("execute_portal_action"), "execute_portal_action must be part of extended toolset");
assert.equal(shouldEnableExtendedTools(adminUser, coreTenant), true, "admin in core should have extended tools");
assert.equal(shouldEnableExtendedTools(investorUser, coreTenant), false, "investor in core must not have extended tools");

const nonCoreTenant: TenantConfig = { ...coreTenant, id: "finu" };
assert.equal(shouldEnableExtendedTools(adminUser, nonCoreTenant), false, "non-core tenant should not have extended tools");

console.log("ai/tools.self-check ok");
