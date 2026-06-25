import "server-only";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function requireAgentAdmin() {
  const user = await getSession();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (user.role !== "admin" && user.role !== "superadmin") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { user };
}
