import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthProvider } from "@/lib/auth/provider";
import { getTenant } from "@/lib/tenant";

export async function POST(req: Request) {
  const provider = await getAuthProvider();
  await provider.signOut(req);
  const tenant = await getTenant();
  const res = NextResponse.json({ ok: true });
  (await cookies()).delete(tenant.auth.cookieName);
  return res;
}
