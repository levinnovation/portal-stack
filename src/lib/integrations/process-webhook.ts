import type { Payload } from "payload";

/** Process inbound webhook payload — ponytail: map by source; extend per integration. */
export async function processWebhook(
  payload: Payload,
  source: string,
  event: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; message?: string }> {
  if (source === "quickbase" && event === "record.updated") {
    const table = String(body.table || "");
    const recordId = String(body.recordId || body.id || "");
    if (!recordId) return { ok: false, message: "missing recordId" };
    // ponytail: stub — log only until QuickBase field mapper ships
    await payload.create({
      collection: "audit-logs",
      data: {
        action: "webhook.quickbase",
        entityType: table || "quickbase",
        entityId: recordId,
        details: body,
      },
      overrideAccess: true,
    });
    return { ok: true, message: "logged" };
  }

  if (source === "stripe" || source === "n8n" || source === "agentyx" || source === "other") {
    await payload.create({
      collection: "audit-logs",
      data: { action: `webhook.${source}`, entityType: source, details: body },
      overrideAccess: true,
    });
    return { ok: true, message: "logged" };
  }

  return { ok: false, message: `unsupported source: ${source}` };
}
