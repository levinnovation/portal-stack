import { Activity, Filter as Funnel, Radar } from "lucide-react";

import { MatrixHeatmap } from "@/components/portal/charts/matrix-heatmap";
import { ParetoChart } from "@/components/portal/charts/pareto";
import { WaterfallChart } from "@/components/portal/charts/waterfall";
import { PostRanking } from "@tenants/core/components/inteligencia/post-ranking";
import { TimeWindowToggle } from "@tenants/core/components/inteligencia/time-window-toggle";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { FunnelConversionTable, SourceBreakdownTable, type FunnelRow, type SourceRow } from "@tenants/core/components/inteligencia/evidence-tables";
import { num, pct } from "@tenants/core/lib/format";
import { getInteligenciaDataOrNull, getInteligenciaPosts, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { WindowEmptyState } from "@tenants/core/components/inteligencia/window-empty-state";

export async function InteligenciaDiagnosticoScreen({ run }: { run: InteligenciaRunType }) {
  let data: Awaited<ReturnType<typeof getInteligenciaDataOrNull>>;
  let posts: Awaited<ReturnType<typeof getInteligenciaPosts>>;
  try {
    [data, posts] = await Promise.all([
      getInteligenciaDataOrNull(run),
      getInteligenciaPosts(run, 50).catch(() => []),
    ]);
  } catch (err) {
    return <ErrorState title="No se pudo leer Inteligencia BI" detail={String(err)} />;
  }
  if (!data) return <WindowEmptyState title="Inteligencia · Diagnóstico" subtitle={`Root-cause comercial (${run})`} run={run} />;
  const rootCauses = data.diagnostics.root_causes ?? data.diagnostics.rootCauses ?? [];
  const sourceBreakdown = data.diagnostics.source_breakdown ?? data.diagnostics.sourceBreakdown ?? [];

  // Funnel conversion table data
  const funnelRows: FunnelRow[] = data.funnel.map((step, i) => ({
    stage: step.name,
    count: step.value,
    stepConversion: i === 0 ? "—" : (data.funnel[i - 1]!.value > 0 ? pct(step.value / data.funnel[i - 1]!.value) : "—"),
    cumulative: data.funnel[0]!.value > 0 ? pct(step.value / data.funnel[0]!.value) : "—",
  }));

  // Source breakdown table
  const totalLeads = sourceBreakdown.reduce((s, r) => s + r.value, 0);
  const sourceRows: SourceRow[] = [...sourceBreakdown]
    .sort((a, b) => b.value - a.value)
    .map((r) => ({ name: r.name, value: r.value, share: totalLeads > 0 ? pct(r.value / totalLeads) : "—" }));

  return (
    <div className="space-y-6">
      <TimeWindowToggle run={run} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KpiCard label="Delta reservas" value={num(data.diagnostics.deltas.reservations?.absolute ?? 0)} delta={data.diagnostics.deltas.reservations?.relative} icon={Funnel} />
        <KpiCard label="Delta ROAS" value={`${(data.diagnostics.deltas.roas?.absolute ?? 0).toFixed(2)}x`} delta={data.diagnostics.deltas.roas?.relative} icon={Radar} />
        <KpiCard label="Causas activas" value={num(rootCauses.length)} icon={Activity} status={rootCauses.length > 1 ? "amber" : "green"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Waterfall de reservas" description="Puente entre snapshot anterior y actual">
          {data.diagnostics.waterfall.length ? <WaterfallChart data={data.diagnostics.waterfall} /> : <EmptyState message="Sin waterfall disponible" />}
        </SectionCard>
        <SectionCard title="Pareto de campañas" description="Qué campañas explican el 80/20 de reservas">
          {data.diagnostics.pareto.length ? <ParetoChart data={data.diagnostics.pareto} /> : <EmptyState message="Sin pareto disponible" />}
        </SectionCard>
      </div>

      <SectionCard title="Mapa de calor por fuente" description="Distribución live de fuentes de adquisición desde HubSpot — actividad diaria/semanal">
        {data.sourceHeatmap?.sources.length ? (
          <MatrixHeatmap data={data.sourceHeatmap} />
        ) : (
          <EmptyState message="Sin datos de heatmap de fuentes para esta ventana" />
        )}
      </SectionCard>

      {posts.length > 0 && (
        <SectionCard
          title="Ranking de posts de Meta"
          description="Rendimiento individual por anuncio — fuente (FB/IG), formato, engagements y gasto"
        >
          <PostRanking posts={posts} />
        </SectionCard>
      )}

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
          <KpiCard label="Lead → calificado" value={pct(data.kpis.leadToQualifiedRate)} icon={Funnel} />
          <KpiCard label="Calificado → cita" value={pct(data.kpis.qualifiedToMeetingRate)} icon={Funnel} />
          <KpiCard label="Lead → cliente/reserva" value={pct(data.kpis.leadToCustomerRate)} icon={Funnel} />
        </div>
      </SectionCard>

      {/* Funnel conversion detail table */}
      {funnelRows.length > 0 && (
        <SectionCard title="Detalle conversión por etapa" description="Conversión paso a paso y acumulada desde el primer touchpoint">
          <FunnelConversionTable data={funnelRows} run={run} />
        </SectionCard>
      )}

      {/* Source breakdown table */}
      {sourceRows.length > 0 && (
        <SectionCard title="Desempeño por fuente de adquisición" description="Leads totales y participación por canal — exportable">
          <SourceBreakdownTable data={sourceRows} run={run} />
        </SectionCard>
      )}
    </div>
  );
}
