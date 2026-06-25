import assert from "node:assert/strict";
import {
  buildFastAPIChatBody,
  buildFastAPIChatUrl,
  buildFastAPIProxyHeaders,
  getFastAPITimeoutMs,
  validateFastAPIConfig,
} from "./fastapi-client";

assert.equal(buildFastAPIChatUrl("http://agent"), "http://agent/v1/chat");
assert.equal(buildFastAPIChatUrl("http://agent/"), "http://agent/v1/chat");
assert.equal(buildFastAPIChatUrl("http://agent/api/"), "http://agent/api/v1/chat");

assert.deepEqual(buildFastAPIProxyHeaders("s3cr3t"), {
  Authorization: "Bearer s3cr3t",
  "Content-Type": "application/json",
});

const body = buildFastAPIChatBody({
  tenantId: "core",
  userId: "u1",
  role: "admin",
  agentId: "default",
  chatId: "c1",
  messages: [{ id: "m1", role: "user", parts: [{ type: "text", text: "hi" }] }],
  sessionToken: "tok",
});
assert.equal(body.tenantId, "core");
assert.equal(body.userId, "u1");
assert.equal(body.role, "admin");
assert.equal(body.sessionToken, "tok");

const savedUrl = process.env.FASTAPI_AGENT_URL;
const savedSecret = process.env.FASTAPI_AGENT_SECRET;
const savedTimeout = process.env.FASTAPI_AGENT_TIMEOUT_MS;

try {
  delete process.env.FASTAPI_AGENT_URL;
  delete process.env.FASTAPI_AGENT_SECRET;
  assert.equal(validateFastAPIConfig().ok, false);

  process.env.FASTAPI_AGENT_URL = "http://agent";
  assert.equal(validateFastAPIConfig().ok, false);

  process.env.FASTAPI_AGENT_SECRET = "secret";
  const ok = validateFastAPIConfig();
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.url, "http://agent");
    assert.equal(ok.secret, "secret");
  }

  process.env.FASTAPI_AGENT_TIMEOUT_MS = "5000";
  assert.equal(getFastAPITimeoutMs(), 5000);
  delete process.env.FASTAPI_AGENT_TIMEOUT_MS;
  assert.equal(getFastAPITimeoutMs(), 30_000);
} finally {
  if (savedUrl === undefined) delete process.env.FASTAPI_AGENT_URL;
  else process.env.FASTAPI_AGENT_URL = savedUrl;
  if (savedSecret === undefined) delete process.env.FASTAPI_AGENT_SECRET;
  else process.env.FASTAPI_AGENT_SECRET = savedSecret;
  if (savedTimeout === undefined) delete process.env.FASTAPI_AGENT_TIMEOUT_MS;
  else process.env.FASTAPI_AGENT_TIMEOUT_MS = savedTimeout;
}

console.log("fastapi-client.self-check ok");
