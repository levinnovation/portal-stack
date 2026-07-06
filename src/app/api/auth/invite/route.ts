import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";

/** Admin-only: create a portal user with email/password/role. ponytail: no email send yet. */
export async function POST(req: Request) {
  const user = await getSession();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { email, password, name, role } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const payload = await getPayloadClient();
  const created = await payload.create({
    collection: "users",
    data: { email, password, name: name || email, role: role || "member" } as any,
    overrideAccess: true,
  });

  return NextResponse.json({ ok: true, id: created.id });
}
