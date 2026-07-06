import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentHeaderActions } from "@tenants/core/components/layout/agent-header-actions";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { CashflowsCxcScreen } from "@tenants/core/screens/cashflows-cxc";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CashflowsCxcPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const rawProject = params?.project;
  const project = (Array.isArray(rawProject) ? rawProject[0] : rawProject) || undefined;

  return renderCustomScreen({
    title: "Cashflows · CxC / Cartera",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <AgentHeaderActions />,
    children: <CashflowsCxcScreen project={project} />,
  });
}
