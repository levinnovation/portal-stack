import { BarHorizontal } from "@/components/portal/charts/bar-horizontal";
import { SectionCard } from "@tenants/core/components/section-card";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import type { InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { loadInteligencia } from "@tenants/core/lib/inteligencia-run";

export async function InteligenciaSegmentosScreen({ run }: { run: InteligenciaRunType }) {
  const loaded = await loadInteligencia(run);
  if (!loaded.ok) {
    return <ErrorState title="No se pudo leer Inteligencia BI" detail={loaded.error} />;
  }
  const data = loaded.data;

  return (
    <div className="space-y-6">
      <SectionCard title="Segmentos con mayor señal de compra" description="Combinaciones de interés priorizadas por score y conversión">
        {data.segments.length ? <BarHorizontal data={data.segments} format="num" /> : <EmptyState message="Sin segmentos disponibles" />}
      </SectionCard>
    </div>
  );
}