import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentHeaderActions } from "@tenants/core/components/layout/agent-header-actions";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { QaraDashboardScreen } from "@tenants/core/screens/qara-dashboard";

export const dynamic = "force-dynamic";

export default async function QaraPage() {
  return renderCustomScreen({
    title: "Qara · Analítica",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <AgentHeaderActions />,
    children: <QaraDashboardScreen />,
  });
}
