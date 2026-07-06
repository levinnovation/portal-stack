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

function quickbaseToken(): { realm: string; token: string } {
  const realm = process.env.QUICKBASE_REALM;
  const token = resolveIntegrationToken("quickbase") || process.env.QUICKBASE_USER_TOKEN;
  if (!realm || !token) throw new Error("QuickBase not configured (QUICKBASE_REALM + token)");
  return { realm, token };
}

export async function quickbaseUpsert(
  tableId: string,
  record: Record<string, { value: unknown }>,
): Promise<unknown> {
  const { realm, token } = quickbaseToken();
  const res = await fetch("https://api.quickbase.com/v1/records", {
    method: "POST",
    headers: {
      "QB-Realm-Hostname": realm,
      Authorization: `QB-USER-TOKEN ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: tableId,
      data: [record],
      fieldsToReturn: Object.keys(record).map((k) => Number(k)).filter((n) => Number.isFinite(n)),
    }),
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) throw new Error(`QuickBase write HTTP ${res.status}: ${typeof json === "string" ? json : JSON.stringify(json).slice(0, 200)}`);
  return json;
}

/**
 * Safe record update by named fields. The caller supplies a logical field map
 * (name -> fid) and the values keyed by those logical names; only mapped names
 * are written, and the key field (default Record ID# = fid 3) pins the update to
 * one existing row. This keeps magic FIDs out of UI code.
 */
export async function quickbaseUpdateRecord(args: {
  tableId: string;
  recordId: number | string;
  fieldMap: Record<string, number>;
  values: Record<string, unknown>;
  keyFieldId?: number;
}): Promise<unknown> {
  const { tableId, recordId, fieldMap, values, keyFieldId = 3 } = args;
  const id = Number(recordId);
  if (!Number.isFinite(id) || id <= 0) throw new Error("quickbaseUpdateRecord requires a numeric recordId");

  const entries = Object.entries(values).filter(([, v]) => v !== undefined);
  if (!entries.length) throw new Error("quickbaseUpdateRecord requires at least one field to write");

  const record: Record<string, { value: unknown }> = { [String(keyFieldId)]: { value: id } };
  for (const [name, value] of entries) {
    const fid = fieldMap[name];
    if (!fid) throw new Error(`QuickBase field not allowed: ${name}`);
    record[String(fid)] = { value };
  }
  return quickbaseUpsert(tableId, record);
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
