import assert from "node:assert/strict";
import { coreTenant } from "@tenants/core/config";

const custom = coreTenant.roles.find((r) => r.key === "admin")?.nav.filter((n) => n.kind === "custom") ?? [];
const paths = custom.map((n) => n.to);

assert.equal(custom.length, 5, "admin nav should have 5 custom agent routes");
assert.ok(paths.includes("/portal/admin/agents"));
assert.ok(paths.includes("/portal/admin/agents/leah"));
assert.ok(paths.includes("/portal/admin/agents/leah/contratos"));
assert.ok(paths.includes("/portal/admin/agents/qara"));
assert.ok(paths.includes("/portal/admin/agents/qara/control"));
console.log("agents-nav.self-check ok");
