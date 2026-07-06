import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PortalRoot() {
  const user = await getSession();
  if (!user) {
    // #region agent log
    console.log("[DEBUG-AUTH] PortalRoot no session, bouncing to /portal/auth", JSON.stringify({ hypothesisId: "H-no-session-on-page" }));
    // #endregion
    redirect("/portal/auth");
  }
  const tenant = await getTenant();
  const role = tenant.roles.find((r) => r.key === user.role);
  if (!role) {
    // #region agent log
    console.log(
      "[DEBUG-AUTH] PortalRoot role not matched, bouncing to /portal/auth",
      JSON.stringify({ hypothesisId: "H-role-mismatch", userRole: user.role, tenantRoleKeys: tenant.roles.map((r) => r.key) }),
    );
    // #endregion
    redirect("/portal/auth");
  }
  redirect(role.homePath);
}
