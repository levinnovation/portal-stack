import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthCookieName } from "./auth/cookie-name";
import { getAuthProvider } from "./auth/provider";
import { resolveTenantRole } from "./auth/resolve-tenant-role";
import { getTenant } from "./tenant";
import type { SessionUser } from "./auth/provider";

export async function getSession(): Promise<SessionUser | null> {
  const provider = await getAuthProvider();
  // build a Request from the current request headers (Next 15)
  const h = await headers();
  const cookie = (await cookies()).toString();
  const fakeReq = new Request("http://localhost", {
    headers: { cookie, "x-forwarded-for": h.get("x-forwarded-for") ?? "" },
  });
  return provider.getSession(fakeReq);
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/portal/auth");
  return user;
}

export async function requireRole(roles: string[]): Promise<SessionUser> {
  const user = await requireSession();
  if (!roles.includes(user.role)) {
    const tenant = await getTenant();
    const role = resolveTenantRole(tenant, user.role);
    redirect(role?.homePath || "/portal/auth");
  }
  return user;
}

export async function signOut() {
  const provider = await getAuthProvider();
  const h = await headers();
  const cookie = (await cookies()).toString();
  const fakeReq = new Request("http://localhost", {
    headers: { cookie },
  });
  await provider.signOut(fakeReq);
  (await cookies()).delete(getAuthCookieName());
}
