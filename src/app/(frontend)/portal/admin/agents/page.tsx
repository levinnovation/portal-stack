import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentHeaderActions } from "@tenants/core/components/layout/agent-header-actions";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { AgentsOverviewScreen } from "@tenants/core/screens/agents-overview";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  return renderCustomScreen({
    title: "Overview",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <AgentHeaderActions />,
    children: <AgentsOverviewScreen />,
  });
}
