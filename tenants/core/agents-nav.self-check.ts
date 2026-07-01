import assert from "node:assert/strict";
import { coreTenant } from "@tenants/core/config";

const custom = coreTenant.roles.find((r) => r.key === "admin")?.nav.filter((n) => n.kind === "custom") ?? [];
const paths = custom.map((n) => n.to);

assert.equal(custom.length, 13, "admin nav should have 13 custom agent routes");
assert.ok(paths.includes("/portal/admin/agents"));
assert.ok(paths.includes("/portal/admin/agents/leah"));
assert.ok(paths.includes("/portal/admin/agents/leah/contratos"));
assert.ok(paths.includes("/portal/admin/agents/qara"));
assert.ok(paths.includes("/portal/admin/agents/qara/control"));
assert.ok(paths.includes("/portal/admin/agents/inteligencia"));
assert.ok(paths.includes("/portal/admin/agents/inteligencia/segmentos"));
assert.ok(paths.includes("/portal/admin/agents/inteligencia/equipo"));
assert.ok(paths.includes("/portal/admin/agents/inteligencia/pauta"));
assert.ok(paths.includes("/portal/admin/agents/inteligencia/predicciones"));
assert.ok(paths.includes("/portal/admin/agents/inteligencia/diagnostico"));
assert.ok(paths.includes("/portal/admin/agents/inteligencia/experimentos"));
assert.ok(paths.includes("/portal/admin/agents/inteligencia/reportes"));
console.log("agents-nav.self-check ok");
