import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";

export const dynamic = "force-dynamic";

/** Import spreadsheet rows into a Payload collection. Form field: file + collection. */
export async function POST(req: Request) {
  const user = await getSession();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const collection = String(form.get("collection") || "projects");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const payload = await getPayloadClient();
  let created = 0;
  for (const row of rows.slice(0, 500)) {
    await payload.create({ collection, data: row as any, overrideAccess: true });
    created += 1;
  }

  await payload.create({
    collection: "audit-logs",
    data: { action: "excel.import", entityType: collection, details: { rows: created, file: file.name } },
    overrideAccess: true,
  });

  return NextResponse.json({ ok: true, created });
}
