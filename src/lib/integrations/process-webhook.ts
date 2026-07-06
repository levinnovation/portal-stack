import type { Payload } from "payload";
import { syncQuickbaseProjectRecord } from "./quickbase";

/** Process inbound webhook payload — extend per integration. */
export async function processWebhook(
  payload: Payload,
  source: string,
  event: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; message?: string }> {
  if (source === "quickbase" && (event === "record.updated" || event === "record.created")) {
    const table = String(body.table || "");
    const projectsTable = process.env.QUICKBASE_PROJECTS_TABLE || "";
    if (projectsTable && table === projectsTable) {
      return syncQuickbaseProjectRecord(payload, body);
    }
    const recordId = String(body.recordId || body.id || "");
    if (!recordId) return { ok: false, message: "missing recordId" };
    await payload.create({
      collection: "audit-logs",
      data: {
        action: "webhook.quickbase",
        entityType: table || "quickbase",
        entityId: recordId,
        metadata: body,
      },
      overrideAccess: true,
    });
    return { ok: true, message: "logged" };
  }

  if (source === "stripe" || source === "n8n" || source === "agentyx" || source === "other") {
    await payload.create({
      collection: "audit-logs",
      data: { action: `webhook.${source}`, entityType: source, metadata: body },
      overrideAccess: true,
    });
    return { ok: true, message: "logged" };
  }

  return { ok: false, message: `unsupported source: ${source}` };
}
