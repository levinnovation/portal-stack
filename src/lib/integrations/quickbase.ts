/** ponytail: minimal QuickBase REST client stub — extend when sync mapper ships. */
export async function quickbaseFetchRecords(tableId: string, where?: string): Promise<unknown[]> {
  const realm = process.env.QUICKBASE_REALM;
  const token = process.env.INTEGRATION_CORE_QUICKBASE_TOKEN || process.env.INTEGRATION_QUICKBASE_TOKEN;
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
