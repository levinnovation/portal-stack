/** ponytail: minimal QuickBase REST client + optional Payload sync for projects table. */
import type { Payload } from "payload";
import { resolveIntegrationToken } from "./credentials";

export async function quickbaseFetchRecords(tableId: string, where?: string): Promise<unknown[]> {
  const realm = process.env.QUICKBASE_REALM;
  const token = resolveIntegrationToken("quickbase");
  if (!realm || !token) throw new Error("QuickBase not configured (QUICKBASE_REALM + token)");

  const url = `https://api.quickbase.com/v1/records/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "QB-Realm-Hostname": realm,
      Authorization: `QB-USER-TOKEN ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: tableId, where: where || "" }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`QuickBase HTTP ${res.status}`);
  const json = await res.json();
  return (json as any).data || [];
}

/** Map QuickBase row → projects collection (core vertical). Extend field map per tenant. */
export async function syncQuickbaseProjectRecord(
  payload: Payload,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; message?: string }> {
  const recordId = String(body.recordId || body.id || "");
  if (!recordId) return { ok: false, message: "missing recordId" };

  const name = String(body.name || body.projectName || `Project ${recordId}`);
  const existing = await payload.find({
    collection: "projects",
    where: { quickbaseRecordId: { equals: recordId } },
    limit: 1,
    overrideAccess: true,
  });

  const data = {
    name,
    quickbaseRecordId: recordId,
    location: String(body.location || ""),
    projectStatus: "planning" as const,
  };

  if (existing.docs[0]) {
    await payload.update({
      collection: "projects",
      id: existing.docs[0].id as any,
      data: data as any,
      overrideAccess: true,
    });
    return { ok: true, message: "updated project" };
  }

  await payload.create({ collection: "projects", data: data as any, overrideAccess: true });
  return { ok: true, message: "created project" };
}
