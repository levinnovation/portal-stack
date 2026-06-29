import { CalendarRange, CircleDollarSign, Flame, Gauge, Snowflake, Target, Thermometer, TrendingUp, TrendingDown, Users, Minus } from "lucide-react";

import { ComboSpendReservations } from "@/components/portal/charts/combo";
import { TransitionMatrixChart } from "@/components/portal/charts/transition-matrix";
import { FunnelSimple } from "@/components/portal/charts/funnel";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { KriCard } from "@tenants/core/components/inteligencia/kri-card";
import { TopLeadsAtRisk } from "@tenants/core/components/inteligencia/top-leads-at-risk";
import { KriTable } from "@tenants/core/components/inteligencia/evidence-tables";
import { SectionCard } from "@tenants/core/components/section-card";
import { PrescriptionCard } from "@tenants/core/components/inteligencia/prescription-card";
import { TimeWindowToggle } from "@tenants/core/components/inteligencia/time-window-toggle";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { getInteligenciaDataOrNull, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { RUN_TYPE_OPTIONS } from "@tenants/core/lib/inteligencia-run";
import { EtlControl } from "@tenants/core/components/inteligencia/etl-control";
import { GLOSSARY } from "@tenants/core/lib/inteligencia-glossary";
import { money, num, pct } from "@tenants/core/lib/format";

export async function InteligenciaComandoScreen({ run }: { run: InteligenciaRunType }) {
  let data: Awaited<ReturnType<typeof getInteligenciaDataOrNull>>;
  try {
    data = await getInteligenciaDataOrNull(run);
  } catch (err) {
    return <ErrorState title="No se pudo leer Inteligencia BI" detail={String(err)} />;
  }

  if (!data) {
    const windowLabel = RUN_TYPE_OPTIONS.find((o) => o.value === run)?.label ?? run;
    return (
      <div className="space-y-6">
        <EtlControl run={run} />
        <SectionCard
          title={`Sin snapshot para "${windowLabel}"`}
          description="Cada ventana es un snapshot independiente del silver layer y se genera bajo demanda."
        >
          <EmptyState message='Esta ventana aún no tiene datos reconciliados. Usá "Actualizar datos" para ingestar las fuentes y generar el snapshot de este periodo.' />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <EtlControl run={run} />
        <TimeWindowToggle run={run} />
      </div>
      {data.updatedAt && (
        <p className="text-xs text-muted-foreground">Actualizado desde ETL live: {new Date(data.updatedAt).toLocaleString("es-CR")}</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard label="Leads analizados" value={num(data.kpis.leads)} icon={Users} info={GLOSSARY.leads} />
        <KpiCard label="Calificados" value={num(data.kpis.qualified)} icon={Target} info={GLOSSARY.qualified} />
        <KpiCard label="Reservas" value={num(data.kpis.reservations)} icon={CalendarRange} info={GLOSSARY.reservations} />
        <KpiCard label="Inversión pauta" value={money(data.kpis.adSpend, "USD")} icon={CircleDollarSign} info={GLOSSARY.adSpend} />
        <KpiCard
          label="Show-up rate"
          value={pct(data.kpis.showUpRate)}
          hint={`Meta ≥ ${pct(0.6)}`}
          icon={Gauge}
          info={GLOSSARY.showUpRate}
        />
        <KpiCard
          label="Forecast reservas"
          value={num(data.kpis.forecastReservationsNextPeriod)}
          hint="Próximo periodo"
          icon={TrendingUp}
          info={GLOSSARY.forecastReservations}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Embudo comercial" description="Leads -> calificados -> citas -> reservas" info={GLOSSARY.funnel}>
          {data.funnel.length ? <FunnelSimple data={data.funnel} /> : <EmptyState message="Sin embudo disponible" />}
        </SectionCard>
        <SectionCard title="Inversión vs reservas" description="Diagnóstico de eficiencia por campaña" info={GLOSSARY.spendVsReservations}>
          {data.campaigns.length ? (
            <ComboSpendReservations
              data={data.campaigns.map((c) => ({
                name: c.name.length > 18 ? `${c.name.slice(0, 18)}…` : c.name,
                spend: c.spend,
                reservations: c.reservations,
              }))}
              leftFormat="money"
              rightFormat="num"
            />
          ) : (
            <EmptyState message="Sin campañas en el periodo" />
          )}
        </SectionCard>
      </div>

      {/* Lead temperature summary — shown when we have classification data */}
      {data.leadTemperatureSummary && data.leadTemperatureSummary.total > 0 && (() => {
        const lts = data.leadTemperatureSummary!;
        const momentum = lts.netMomentum > 0 ? "warming" : lts.netMomentum < 0 ? "cooling" : "stable";
        const MomIcon = momentum === "warming" ? TrendingUp : momentum === "cooling" ? TrendingDown : Minus;
        const momColor = momentum === "warming" ? "text-emerald-400" : momentum === "cooling" ? "text-rose-400" : "text-muted-foreground";
        return (
          <SectionCard title="Temperatura de leads" description="Distribución del pipeline por temperatura + momentum" info={GLOSSARY.leadTemperature}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-muted/40 p-3 flex items-center gap-3">
                <Flame className="h-5 w-5 text-rose-400 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Calientes</p>
                  <p className="text-xl font-semibold">{num(lts.hot)}</p>
                  <p className="text-xs text-muted-foreground">{pct(lts.hotPct)}</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 flex items-center gap-3">
                <Thermometer className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Tibios</p>
                  <p className="text-xl font-semibold">{num(lts.warm)}</p>
                  <p className="text-xs text-muted-foreground">{pct(lts.warmPct)}</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 flex items-center gap-3">
                <Snowflake className="h-5 w-5 text-sky-400 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Fríos</p>
                  <p className="text-xl font-semibold">{num(lts.cold)}</p>
                  <p className="text-xs text-muted-foreground">{pct(lts.coldPct)}</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 flex items-center gap-3">
                <MomIcon className={`h-5 w-5 ${momColor} shrink-0`} />
                <div>
                  <p className="text-xs text-muted-foreground">Momentum neto</p>
                  <p className="text-xl font-semibold">{lts.netMomentum > 0 ? "+" : ""}{lts.netMomentum}</p>
                  <p className={`text-xs ${momColor}`}>{lts.warming} calentando · {lts.cooling} enfriando</p>
                </div>
              </div>
            </div>
          </SectionCard>
        );
      })()}

      <SectionCard
        title="Prescripciones activas"
        description="Qué escalar, pausar, ajustar o activar — clic para ver leads impactados"
        info={GLOSSARY.prescriptions}
      >
        {data.prescriptions && data.prescriptions.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.prescriptions.map((prescription) => (
              <PrescriptionCard key={prescription.id} prescription={prescription} runType={run} />
            ))}
          </div>
        ) : (
          <EmptyState message="No hay prescripciones para este período — ejecuta el ETL para generar recomendaciones." />
        )}
      </SectionCard>
      {/* Transition matrix */}
      {data.transitionMatrix && data.transitionMatrix.cells && data.transitionMatrix.cells.some((c) => c.value > 0) && (
        <SectionCard
          title="Matriz de transiciones de temperatura"
          description="Flujo de leads entre estados fríos, tibios y calientes (observado + predicho)"
          info={GLOSSARY.transitionMatrix}
        >
          <TransitionMatrixChart data={data.transitionMatrix} />
        </SectionCard>
      )}

      <SectionCard title="KRIs operativos" description="Riesgos vivos desde HubSpot + Meta Ads" info={GLOSSARY.kris}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          {data.kris.map((kri) => (
            <KriCard key={kri.name} {...kri} />
          ))}
        </div>
      </SectionCard>

      {/* KRI detail table */}
      {data.kris.length > 0 && (
        <SectionCard title="Detalle KRIs" description="Tabla exportable de indicadores de riesgo operativo" info={GLOSSARY.kris}>
          <KriTable data={data.kris} run={run} />
        </SectionCard>
      )}

      {/* Top leads at risk */}
      <SectionCard
        title="Top leads en riesgo de revenue"
        description="Leads con mayor revenue at risk en el período — ordenar, filtrar y exportar"
        info={GLOSSARY.topRisk}
      >
        <TopLeadsAtRisk runType={run} limit={50} csvFilename={`leads-riesgo-${run}.csv`} />
      </SectionCard>
    </div>
  );
}
