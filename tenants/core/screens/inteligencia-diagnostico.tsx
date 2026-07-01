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
import { RootCauseList } from "@tenants/core/components/inteligencia/root-cause-list";
import { num, pct } from "@tenants/core/lib/format";
import { buildRootCauseInsights, type RootCauseAction } from "@tenants/core/lib/root-causes";
import { getInteligenciaDataOrNull, getInteligenciaPosts, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { WindowEmptyState } from "@tenants/core/components/inteligencia/window-empty-state";
import { GLOSSARY } from "@tenants/core/lib/inteligencia-glossary";

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
  const rootCauseInsights = buildRootCauseInsights({
    kris: data.kris,
    deltas: data.diagnostics.deltas,
    campaigns: data.campaigns,
    kpis: data.kpis,
  });
  // Cookbook: attach runnable Meta actions to campaign-level root causes by
  // resolving the evidence campaign names to live campaign IDs.
  const liveCampaigns = (data.campaigns as Array<{ name: string; campaignId?: string; spend: number }>).filter(
    (c) => c.campaignId,
  );
  const resolveCampaign = (name: string) => {
    const needle = name.trim().toLowerCase();
    return liveCampaigns.find((c) => {
      const n = c.name.trim().toLowerCase();
      return n === needle || n.includes(needle) || needle.includes(n);
    });
  };
  const enrichedInsights = rootCauseInsights.map((insight) => {
    if (insight.id !== "campaign:inefficient" && insight.id !== "campaign:fatigue") return insight;
    const actions: RootCauseAction[] = [];
    for (const ev of insight.evidence) {
      const hit = resolveCampaign(ev.label);
      if (!hit?.campaignId) continue;
      const short = ev.label.length > 16 ? `${ev.label.slice(0, 16)}…` : ev.label;
      actions.push({
        label: `Pausar ${short}`,
        target: "meta",
        op: "pauseCampaign",
        payload: { campaignId: hit.campaignId },
        variant: "danger",
        destructive: true,
        description: `Pausar la campaña "${ev.label}" en Meta`,
      });
      if (hit.spend > 0) {
        const daily = Math.max((hit.spend / 30) * 0.7, 1);
        actions.push({
          label: `Bajar 30% ${short}`,
          target: "meta",
          op: "updateCampaign",
          payload: { campaignId: hit.campaignId, dailyBudget: Math.round(daily * 100) / 100 },
          variant: "ghost",
          description: `Reducir 30% el presupuesto diario de "${ev.label}"`,
        });
      }
    }
    return actions.length ? { ...insight, actions } : insight;
  });
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
        <KpiCard label="Causas activas" value={num(rootCauseInsights.length)} icon={Activity} status={rootCauseInsights.some((i) => i.severity === "high") ? "red" : rootCauseInsights.length > 1 ? "amber" : "green"} />
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

      <SectionCard title="Causas raíz sugeridas" description="Diagnóstico determinístico sobre KPIs/KRIs live" info={GLOSSARY.rootCauses}>
        {rootCauseInsights.length || rootCauses.length ? (
          <RootCauseList insights={enrichedInsights} notes={rootCauses} />
        ) : (
          <EmptyState message="Sin causas raíz activas — KPIs dentro de umbral" />
        )}
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
