import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { QaraControlScreen } from "@tenants/core/screens/qara-control";

export const dynamic = "force-dynamic";

export default async function QaraControlPage() {
  return renderCustomScreen({
    title: "Qara · Control",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    children: <QaraControlScreen />,
  });
}
