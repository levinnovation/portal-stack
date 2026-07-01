import assert from "node:assert/strict";
import { assertInAccount, majorToMinorCurrency } from "@/lib/integrations/meta/graph";
import { buildDedupEventId, hashPII } from "@/lib/integrations/meta/conversions";
import { listCommandKeys, resolveCommand } from "@/lib/inteligencia/commands";

async function testAccountScopeGuard() {
  process.env.META_ACCESS_TOKEN = "test-token";
  process.env.META_AD_ACCOUNT_ID = "act_123";
  const originalFetch = global.fetch;
  global.fetch = (async () =>
    new Response(JSON.stringify({ id: "cmp_1", account_id: "999" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
  let thrown = false;
  try {
    await assertInAccount("cmp_1");
  } catch {
    thrown = true;
  }
  global.fetch = originalFetch;
  assert.equal(thrown, true, "assertInAccount must reject cross-account ids");
}

function testHashingAndDedup() {
  const hashed = hashPII("  USER@example.COM ");
  assert.equal(/^[a-f0-9]{64}$/.test(hashed), true, "hashPII must return sha256 hex");

  const eventA = buildDedupEventId("contact-1", "Lead", "2026-06-30");
  const eventB = buildDedupEventId("contact-1", "Lead", "2026-06-30");
  assert.equal(eventA, eventB, "dedup event id must be stable for same keys");
}

function testCurrencyAndRegistry() {
  assert.equal(majorToMinorCurrency(12.34), 1234);
  const keys = listCommandKeys();
  assert.equal(keys.includes("meta.publishCreative"), true);
  assert.equal(keys.includes("hubspot.updateContact"), true);
  const deleteCampaign = resolveCommand("meta.deleteCampaign");
  assert.equal(Boolean(deleteCampaign?.destructive), true, "deleteCampaign should be destructive");

  // Named QuickBase update must exist and reject unmapped/empty field sets.
  const updateContrato = resolveCommand("quickbase.updateContrato");
  assert.ok(updateContrato, "quickbase.updateContrato should be registered");
  assert.equal(
    updateContrato!.schema.safeParse({ recordId: 5, fields: {} }).success,
    false,
    "updateContrato must reject empty field sets",
  );
  assert.equal(
    updateContrato!.schema.safeParse({ recordId: 5, fields: { leahAttributed: true } }).success,
    true,
    "updateContrato must accept a mapped field",
  );
}

async function main() {
  await testAccountScopeGuard();
  testHashingAndDedup();
  testCurrencyAndRegistry();
  console.log("commands.self-check ok");
}

void main();

