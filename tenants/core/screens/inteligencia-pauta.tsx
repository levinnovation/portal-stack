import { ComboSpendReservations } from "@/components/portal/charts/combo";
import { ScatterEfficiency } from "@/components/portal/charts/scatter";
import { RecommendationCard } from "@tenants/core/components/inteligencia/recommendation-card";
import { WhatIfSimulator } from "@tenants/core/components/inteligencia/whatif-simulator";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { getInteligenciaData, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";

export async function InteligenciaPautaScreen({ run }: { run: InteligenciaRunType }) {
  const data = await getInteligenciaData(run);
  const spend = data.campaigns.reduce((acc, c) => acc + c.spend, 0);
  const reservations = data.campaigns.reduce((acc, c) => acc + c.reservations, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Spend vs reservas" description="Diagnóstico por campaña">
          {data.campaigns.length ? (
            <ComboSpendReservations
              data={data.campaigns.map((c) => ({
                name: c.name.length > 16 ? `${c.name.slice(0, 16)}…` : c.name,
                spend: c.spend,
                reservations: c.reservations,
              }))}
              leftFormat="money"
              rightFormat="num"
            />
          ) : (
            <EmptyState message="Sin campañas para graficar" />
          )}
        </SectionCard>
        <SectionCard title="CAC scatter" description="Costo por lead calificado vs costo por reserva">
          {data.campaigns.length ? (
            <ScatterEfficiency
              data={data.campaigns.map((c) => ({
                name: c.name,
                x: c.costPerQualified,
                y: c.costPerReservation,
              }))}
            />
          ) : (
            <EmptyState message="Sin datos para scatter" />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Recomendaciones" description="Scale / pause / adjust por campaña">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {data.campaigns.map((campaign) => (
            <RecommendationCard
              key={campaign.name}
              action={campaign.action}
              title={campaign.name}
              reason={campaign.reason}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="What-if simulator" description="Simulación rápida de reasignación de presupuesto">
        <WhatIfSimulator baseSpend={spend} baseReservations={reservations} />
      </SectionCard>
    </div>
  );
}
