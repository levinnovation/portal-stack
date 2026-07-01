import { CalendarRange, Target, TrendingUp, Users } from "lucide-react";

import { BarHorizontal } from "@/components/portal/charts/bar-horizontal";
import { ComboBarLine } from "@/components/portal/charts/combo-bar-line";
import { Gauge } from "@/components/portal/charts/gauge";
import { ScatterEfficiency } from "@/components/portal/charts/scatter";
import { TimeWindowToggle } from "@tenants/core/components/inteligencia/time-window-toggle";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { RepDetailTable, type RepRow } from "@tenants/core/components/inteligencia/evidence-tables";
import { TopLeadsAtRisk } from "@tenants/core/components/inteligencia/top-leads-at-risk";
import { num, pct } from "@tenants/core/lib/format";
import { getInteligenciaDataOrNull, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { GLOSSARY } from "@tenants/core/lib/inteligencia-glossary";
import { WindowEmptyState } from "@tenants/core/components/inteligencia/window-empty-state";

export async function InteligenciaEquipoScreen({ run }: { run: InteligenciaRunType }) {
  let data: Awaited<ReturnType<typeof getInteligenciaDataOrNull>>;
  try {
    data = await getInteligenciaDataOrNull(run);
  } catch (err) {
    return <ErrorState title="No se pudo leer Inteligencia BI" detail={String(err)} />;
  }
  if (!data) return <WindowEmptyState title="Inteligencia · Equipo Comercial" subtitle={`KPIs de reps y seguimiento (${run})`} run={run} />;

  const reps = data.reps ?? [];

  // Combo data: meetings (bar) + show-up rate (line) per rep
  const comboData = reps.map((r) => ({
    name: r.name.length > 12 ? `${r.name.slice(0, 12)}…` : r.name,
    meetings: r.meetings,
    showUpRate: r.showUpRate,
  }));

  // Bubble scatter: meetings (x) vs reservations (y), size = avgScore
  const scatterData = reps.map((r) => ({
    name: r.name,
    x: r.meetings,
    y: r.reservations,
    z: Math.max(r.avgScore, 1),
  }));

  // Leaderboard by reservations
  const leaderboard = [...reps].sort((a, b) => b.reservations - a.reservations);

  const repTableData: RepRow[] = [...reps]
    .sort((a, b) => b.reservations - a.reservations)
    .map((r) => ({
      name: r.name,
      meetings: r.meetings,
      reservations: r.reservations,
      showUpRate: r.showUpRate,
      conversion: r.meetings > 0 ? r.reservations / r.meetings : 0,
      avgScore: r.avgScore,
    }));

  return (
    <div className="space-y-6">
      <TimeWindowToggle run={run} />

      {/* Team gauges — two distinct funnel-stage conversions, scaled to their own target */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Calificado → cita" description="Qué tan bien el equipo agenda a los leads calificados (meta 50%)" info={GLOSSARY.qualifiedToMeeting}>
          <Gauge value={data.kpis.qualifiedToMeetingRate} threshold={0.5} />
        </SectionCard>
        <SectionCard title="Cita → reserva" description="Qué tan bien el equipo cierra las citas en reservas (meta 20%)" info={GLOSSARY.meetingToReservation}>
          <Gauge value={data.kpis.meetingToReservation} threshold={0.2} />
        </SectionCard>
      </div>

      {/* Per-rep KPI cards */}
      {reps.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label="Total citas"
            value={num(reps.reduce((s, r) => s + r.meetings, 0))}
            icon={CalendarRange}
            info={GLOSSARY.meetings}
          />
          <KpiCard
            label="Total reservas"
            value={num(reps.reduce((s, r) => s + r.reservations, 0))}
            icon={Target}
            info={GLOSSARY.reservations}
          />
          <KpiCard
            label="Show-up promedio"
            value={pct(reps.reduce((s, r) => s + r.showUpRate, 0) / Math.max(reps.length, 1))}
            icon={TrendingUp}
            info="Promedio simple de la tasa de show-up (reservas÷citas) entre todos los asesores con actividad."
          />
          <KpiCard
            label="Score promedio"
            value={(reps.reduce((s, r) => s + r.avgScore, 0) / Math.max(reps.length, 1)).toFixed(1)}
            icon={Users}
            info="Promedio del lead score de los contactos asignados a cada asesor (0–100), promediado entre reps."
          />
        </div>
      )}

      {/* Leaderboard: reservations per rep */}
      <SectionCard title="Leaderboard — reservas por rep" description="Ranking de conversión efectiva" info={GLOSSARY.repLeaderboard}>
        {leaderboard.length ? (
          <BarHorizontal data={leaderboard.map((r) => ({ name: r.name, value: r.reservations }))} format="num" />
        ) : (
          <EmptyState message="Sin reservas por rep para el periodo" />
        )}
      </SectionCard>

      {/* Combo: meetings + show-up rate */}
      <SectionCard title="Citas vs show-up rate por rep" description="Barras = citas · Línea = tasa de asistencia" info={GLOSSARY.repShowUp}>
        {comboData.length ? (
          <ComboBarLine
            data={comboData}
            barKey="meetings"
            lineKey="showUpRate"
            barLabel="Citas"
            lineLabel="Show-up rate"
            showLabels
          />
        ) : (
          <EmptyState message="Sin datos de citas por rep" />
        )}
      </SectionCard>

      {/* Bubble scatter: meetings vs reservations, size = score */}
      <SectionCard title="Citas vs reservas (tamaño = score promedio)" description="Reps más arriba/derecha tienen mayor conversión" info={GLOSSARY.repScatter}>
        {scatterData.filter((d) => d.x > 0 || d.y > 0).length ? (
          <ScatterEfficiency
            data={scatterData}
            height={260}
            xName="Citas"
            yName="Reservas"
            zName="Score promedio"
            showLabels
          />
        ) : (
          <EmptyState message="Sin scatter data para el periodo" />
        )}
      </SectionCard>

      {/* Top leads at risk for this period */}
      <SectionCard
        title="Leads en riesgo de revenue — equipo"
        description="Leads asignados con mayor revenue at risk — filtrables por asesor"
        info={GLOSSARY.topRisk}
      >
        <TopLeadsAtRisk runType={run} limit={100} csvFilename={`equipo-leads-${run}.csv`} />
      </SectionCard>

      {/* Full table */}
      <SectionCard title="Tabla detalle por rep" description="Reuniones, reservas, show-up y score promedio" info={GLOSSARY.repTable}>
        {repTableData.length ? (
          <RepDetailTable data={repTableData} run={run} />
        ) : (
          <EmptyState message="Sin desempeño por rep para el periodo" />
        )}
      </SectionCard>
    </div>
  );
}
