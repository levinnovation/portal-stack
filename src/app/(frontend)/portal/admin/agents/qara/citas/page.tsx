import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentHeaderActions } from "@tenants/core/components/layout/agent-header-actions";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { QaraCitasScreen } from "@tenants/core/screens/qara-citas";

export const dynamic = "force-dynamic";

export default async function QaraCitasPage() {
  return renderCustomScreen({
    title: "Qara · Citas",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <AgentHeaderActions />,
    children: <QaraCitasScreen />,
  });
}
