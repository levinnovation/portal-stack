import assert from "node:assert/strict";
import { resolveIntegrationToken } from "./credentials";

process.env.INTEGRATION_CORE_DEMO_TOKEN = "secret";
assert.equal(resolveIntegrationToken("demo"), "secret");
delete process.env.INTEGRATION_CORE_DEMO_TOKEN;

console.log("credentials.self-check ok");
