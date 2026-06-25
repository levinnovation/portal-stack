import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentHeaderActions } from "@tenants/core/components/layout/agent-header-actions";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { LeahDashboardScreen } from "@tenants/core/screens/leah-dashboard";

export const dynamic = "force-dynamic";

export default async function LeahPage() {
  return renderCustomScreen({
    title: "Leah · Mercadeo",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <AgentHeaderActions />,
    children: <LeahDashboardScreen />,
  });
}
