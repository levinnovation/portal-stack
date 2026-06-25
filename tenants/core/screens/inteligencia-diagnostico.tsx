import { Activity, Filter, Radar } from "lucide-react";

import { Heatmap } from "@/components/portal/charts/heatmap";
import { ParetoChart } from "@/components/portal/charts/pareto";
import { WaterfallChart } from "@/components/portal/charts/waterfall";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { num, pct } from "@tenants/core/lib/format";
import { getInteligenciaData, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";

export async function InteligenciaDiagnosticoScreen({ run }: { run: InteligenciaRunType }) {
  const data = await getInteligenciaData(run);
  const rootCauses = data.diagnostics.root_causes ?? data.diagnostics.rootCauses ?? [];
  const sourceBreakdown = data.diagnostics.source_breakdown ?? data.diagnostics.sourceBreakdown ?? [];
  const heatmapData = sourceBreakdown.map((row) => ({ x: "Leads", y: row.name, value: row.value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KpiCard
          label="Delta reservas"
          value={num(data.diagnostics.deltas.reservations?.absolute ?? 0)}
          delta={data.diagnostics.deltas.reservations?.relative}
          icon={Filter}
        />
        <KpiCard
          label="Delta ROAS"
          value={`${(data.diagnostics.deltas.roas?.absolute ?? 0).toFixed(2)}x`}
          delta={data.diagnostics.deltas.roas?.relative}
          icon={Radar}
        />
        <KpiCard label="Causas activas" value={num(rootCauses.length)} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Waterfall de reservas" description="Puente entre snapshot anterior y actual">
          {data.diagnostics.waterfall.length ? (
            <WaterfallChart data={data.diagnostics.waterfall} />
          ) : (
            <EmptyState message="Sin waterfall disponible" />
          )}
        </SectionCard>
        <SectionCard title="Pareto de campañas" description="Qué campañas explican el 80/20 de reservas">
          {data.diagnostics.pareto.length ? (
            <ParetoChart data={data.diagnostics.pareto} />
          ) : (
            <EmptyState message="Sin pareto disponible" />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Mapa de calor por fuente" description="Distribución live de fuentes de adquisición desde HubSpot">
        {heatmapData.length ? <Heatmap data={heatmapData} /> : <EmptyState message="Sin breakdown de fuentes" />}
      </SectionCard>

      <SectionCard title="Causas raíz sugeridas" description="Diagnóstico determinístico sobre KPIs/KRIs live">
        <div className="space-y-2">
          {rootCauses.map((cause) => (
            <div key={cause} className="rounded-lg border border-border bg-secondary/20 px-3 py-2 text-sm">
              {cause}
            </div>
          ))}
          {!rootCauses.length && <EmptyState message="Sin causas raíz activas" />}
        </div>
      </SectionCard>

      <SectionCard title="Conversión de funnel" description="Tasas clave para aislar caída de volumen vs calidad">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <KpiCard label="Lead → calificado" value={pct(data.kpis.leadToQualifiedRate)} icon={Filter} />
          <KpiCard label="Calificado → cita" value={pct(data.kpis.qualifiedToMeetingRate)} icon={Filter} />
          <KpiCard label="Lead → cliente/reserva" value={pct(data.kpis.leadToCustomerRate)} icon={Filter} />
        </div>
      </SectionCard>
    </div>
  );
}
