import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PortalRoot() {
  const user = await getSession();
  if (!user) redirect("/portal/auth");
  const tenant = await getTenant();
  const role = tenant.roles.find((r) => r.key === user.role);
  if (!role) redirect("/portal/auth");
  redirect(role.homePath);
}
