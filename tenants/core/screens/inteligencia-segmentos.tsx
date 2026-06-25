import { BarHorizontal } from "@/components/portal/charts/bar-horizontal";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { getInteligenciaData, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";

export async function InteligenciaSegmentosScreen({ run }: { run: InteligenciaRunType }) {
  const data = await getInteligenciaData(run);

  return (
    <div className="space-y-6">
      <SectionCard title="Segmentos con mayor señal de compra" description="Combinaciones de interés priorizadas por score y conversión">
        {data.segments.length ? <BarHorizontal data={data.segments} format="num" /> : <EmptyState message="Sin segmentos disponibles" />}
      </SectionCard>
    </div>
  );
}
