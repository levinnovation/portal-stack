import { Flame, Gauge, UserCheck, Users } from "lucide-react";
import { BarHorizontal } from "@tenants/core/components/charts/bar-horizontal";
import { BarVertical } from "@tenants/core/components/charts/bar-vertical";
import { Donut } from "@tenants/core/components/charts/donut";
import { Histogram } from "@tenants/core/components/charts/histogram";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { num } from "@tenants/core/lib/format";
import { getQaraData } from "@tenants/core/sources/hubspot";
import { SectionTabs } from "@/components/portal/section-tabs";

export async function QaraDashboardScreen() {
  let data: Awaited<ReturnType<typeof getQaraData>>;
  try {
    data = await getQaraData();
  } catch (e) {
    return <ErrorState title="No se pudo leer HubSpot" detail={errMsg(e)} />;
  }

  const { kpis, scoreHistograma, porProyecto, llamadaVsMensaje, funnel, engagement, useType, budget, timeline } = data;
  const avg = kpis.scorePromedio != null ? kpis.scorePromedio.toFixed(1) : "—";

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Perfilado de leads de CORE — score, intención y estado del embudo.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Leads nuevos hoy" value={num(kpis.nuevosHoy)} icon={Users} />
        <KpiCard label="Contactados" value={num(kpis.contactados)} icon={UserCheck} hint={`${num(kpis.totalLeads)} en total`} />
        <KpiCard label="Scoreados" value={num(kpis.scoreados)} icon={Gauge} />
        <KpiCard label="Score promedio" value={avg} icon={Gauge} />
        <KpiCard label="Alta intención (≥8)" value={num(kpis.altaIntencion)} icon={Flame} />
      </div>

      <SectionTabs
        sections={[
          {
            value: "embudo",
            label: "Embudo",
            content: (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SectionCard title="Distribución de AI score" description="Puntaje de intención 1–10 asignado por Qara">
                  {scoreHistograma.some((b) => b.count > 0) ? <Histogram data={scoreHistograma} /> : <EmptyState message="Aún no hay leads scoreados" />}
                </SectionCard>
                <SectionCard title="Embudo por estado" description="hs_lead_status: nuevo → contactado → descartado">
                  {funnel.length ? <BarVertical data={funnel} format="num" /> : <EmptyState message="Sin leads en el embudo" />}
                </SectionCard>
              </div>
            ),
          },
          {
            value: "perfil",
            label: "Perfil",
            content: (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SectionCard title="Interés por proyecto" description="proyecto_de_interes de los leads">
                  {porProyecto.length ? <BarHorizontal data={porProyecto} format="num" /> : <EmptyState message="Sin proyecto registrado" />}
                </SectionCard>
                <SectionCard title="Llamada vs mensaje" description="Ruta de contacto elegida">
                  {llamadaVsMensaje.some((d) => d.value > 0) ? (
                    <Donut data={llamadaVsMensaje} format="num" />
                  ) : (
                    <EmptyState message="Sin leads para rutear" />
                  )}
                </SectionCard>
                <SectionCard title="Engagement (ai_engagement)" description="Nivel de interacción detectado">
                  {engagement.length ? <Donut data={engagement} format="num" /> : <EmptyState message="Sin datos" />}
                </SectionCard>
              </div>
            ),
          },
          {
            value: "atributos",
            label: "Atributos",
            content: (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SectionCard title="Tipo de uso (ai_use_type)" description="Para qué quiere el lead la propiedad">
                  {useType.length ? <BarHorizontal data={useType} format="num" /> : <EmptyState message="Sin datos" />}
                </SectionCard>
                <SectionCard title="Presupuesto (ai_budget)" description="Rango de presupuesto inferido">
                  {budget.length ? <BarHorizontal data={budget} format="num" /> : <EmptyState message="Sin datos" />}
                </SectionCard>
                <SectionCard title="Horizonte de compra (ai_timeline)" description="Cuándo planea comprar" className="lg:col-span-2">
                  {timeline.length ? <BarHorizontal data={timeline} format="num" /> : <EmptyState message="Sin datos" />}
                </SectionCard>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
