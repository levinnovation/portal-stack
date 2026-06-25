import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentsOverviewScreen } from "@tenants/core/screens/agents-overview";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  return renderCustomScreen({
    title: "Agentes IA",
    portalPrefix: "/portal/admin",
    roles: ["admin", "superadmin"],
    children: <AgentsOverviewScreen />,
  });
}
