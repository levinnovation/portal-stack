import { ContratosTable } from "@tenants/core/components/leah/contratos-table";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { env } from "@tenants/core/lib/env";
import { errMsg } from "@tenants/core/lib/errors";
import { getContratos } from "@tenants/core/sources/quickbase";

export async function LeahContratosScreen() {
  let contratos;
  try {
    contratos = await getContratos();
  } catch (e) {
    return <ErrorState title="No se pudo leer Quickbase" detail={errMsg(e)} />;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Ventas firmadas con su atribución de primer toque.</p>
      <SectionCard title="Contratos atribuidos" description="Filtra por fuente y ordena por monto o fecha">
        {contratos.length ? (
          <ContratosTable contratos={contratos} portalId={env.HUBSPOT_PORTAL_ID || undefined} />
        ) : (
          <EmptyState message="Aún no hay contratos" hint="Aparecen cuando Leah procesa contratos en QuickBase" />
        )}
      </SectionCard>
    </div>
  );
}
