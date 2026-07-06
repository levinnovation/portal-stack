import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentHeaderActions } from "@tenants/core/components/layout/agent-header-actions";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { EyalDashboardScreen } from "@tenants/core/screens/eyal-dashboard";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EyalPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const raw = params?.snapshot_id;
  const snapshotId = (Array.isArray(raw) ? raw[0] : raw) || undefined;

  return renderCustomScreen({
    title: "Eyal · PM Cronograma",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <AgentHeaderActions />,
    children: <EyalDashboardScreen snapshotId={snapshotId} />,
  });
}
