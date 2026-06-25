import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { RefreshButton } from "@tenants/core/components/layout/refresh-button";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { LeahContratosScreen } from "@tenants/core/screens/leah-contratos";

export const dynamic = "force-dynamic";

export default async function LeahContratosPage() {
  return renderCustomScreen({
    title: "Leah · Contratos",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <RefreshButton />,
    children: <LeahContratosScreen />,
  });
}
