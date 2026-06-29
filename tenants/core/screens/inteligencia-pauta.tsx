import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { ComboSpendReservations } from "@/components/portal/charts/combo";
import { ScatterEfficiency } from "@/components/portal/charts/scatter";
import { RecommendationCard } from "@tenants/core/components/inteligencia/recommendation-card";
import { TimeWindowToggle } from "@tenants/core/components/inteligencia/time-window-toggle";
import { WhatIfSimulator } from "@tenants/core/components/inteligencia/whatif-simulator";
import { CampaignTable } from "@tenants/core/components/inteligencia/evidence-tables";
import { getInteligenciaDataOrNull, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { GLOSSARY } from "@tenants/core/lib/inteligencia-glossary";
import { WindowEmptyState } from "@tenants/core/components/inteligencia/window-empty-state";

export async function InteligenciaPautaScreen({ run }: { run: InteligenciaRunType }) {
  let data: Awaited<ReturnType<typeof getInteligenciaDataOrNull>>;
  try {
    data = await getInteligenciaDataOrNull(run);
  } catch (err) {
    return <ErrorState title="No se pudo leer Inteligencia BI" detail={String(err)} />;
  }
  if (!data) return <WindowEmptyState title="Inteligencia · Pauta" subtitle={`Eficiencia por campaña (${run})`} run={run} />;
  const spend = data.campaigns.reduce((acc, c) => acc + c.spend, 0);
  const reservations = data.campaigns.reduce((acc, c) => acc + c.reservations, 0);

  return (
    <div className="space-y-6">
      <TimeWindowToggle run={run} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Spend vs reservas" description="Diagnóstico por campaña" info={GLOSSARY.spendVsReservations}>
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
        <SectionCard title="CAC scatter" description="Costo por lead calificado vs costo por reserva" info={GLOSSARY.cacScatter}>
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

      <SectionCard
        title="Recomendaciones"
        description="Scale / pause / adjust por campaña · clic para ver el experimento A/B"
        info={GLOSSARY.recommendations}
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {data.campaigns.map((campaign) => (
            <RecommendationCard
              key={campaign.name}
              action={campaign.action}
              title={campaign.name}
              reason={campaign.reason}
              campaign={campaign}
              abTest={data.abTests.find(
                (t) => (t.campaign ?? "").toLowerCase() === campaign.name.toLowerCase()
              )}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="What-if simulator" description="Simulación rápida de reasignación de presupuesto" info={GLOSSARY.whatIf}>
        <WhatIfSimulator baseSpend={spend} baseReservations={reservations} />
      </SectionCard>

      {/* Campaigns detail table */}
      <SectionCard
        title="Tabla de campañas"
        description="KPIs por campaña — clic en el nombre abre la campaña en Meta Ads Manager"
        info={GLOSSARY.campaignTable}
      >
        {data.campaigns.length ? (
          <CampaignTable data={data.campaigns} run={run} />
        ) : (
          <EmptyState message="Sin campañas para el período" />
        )}
      </SectionCard>
    </div>
  );
}
