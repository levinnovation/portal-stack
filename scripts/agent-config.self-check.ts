import assert from "node:assert/strict";
import { coreTenant } from "@tenants/core/config";

const externalAgents = coreTenant.externalAgents ?? [];
const externalDbs = coreTenant.externalDatabases ?? [];

assert.ok(externalAgents.length >= 2, "core tenant should define external agents");
assert.ok(externalAgents.some((agent) => agent.id === "inteligencia-13"), "missing inteligencia-13 external agent");
assert.ok(externalAgents.some((agent) => agent.id === "qara"), "missing qara external agent");
assert.ok(externalDbs.some((db) => db.id === "bi"), "missing bi external database config");

console.log("agent-config.self-check ok");

