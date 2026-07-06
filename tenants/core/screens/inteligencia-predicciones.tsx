import { ForecastLine } from "@/components/portal/charts/forecast-line";
import { AnomalyTimeline } from "@/components/portal/charts/anomaly-timeline";
import { KpiRadar } from "@/components/portal/charts/kpi-radar";
import { TimeWindowToggle } from "@tenants/core/components/inteligencia/time-window-toggle";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { AnomalyTable, ForecastTable, type AnomalyRow, type ForecastRow } from "@tenants/core/components/inteligencia/evidence-tables";
import { getInteligenciaDataOrNull, type Anomaly, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { WindowEmptyState } from "@tenants/core/components/inteligencia/window-empty-state";
import { GLOSSARY } from "@tenants/core/lib/inteligencia-glossary";
import { detectAnomalies, movingAverage } from "@tenants/core/lib/forecast-insights";
import { money, num } from "@tenants/core/lib/format";
import { Activity, CalendarRange, Radar as RadarIcon, TrendingUp } from "lucide-react";

export async function InteligenciaPrediccionesScreen({ run }: { run: InteligenciaRunType }) {
  let data: Awaited<ReturnType<typeof getInteligenciaDataOrNull>>;
  try {
    data = await getInteligenciaDataOrNull(run);
  } catch (err) {
    return <ErrorState title="No se pudo leer Inteligencia BI" detail={String(err)} />;
  }
  if (!data) return <WindowEmptyState title="Inteligencia · Predicciones" subtitle={`Forecasts live (${run})`} run={run} />;
  const reservations = data.predictions.forecasts?.reservations ?? [];
  const cpr = data.predictions.forecasts?.cost_per_reservation ?? [];
  const anomalySeries = reservations
    .filter((p) => typeof p.actual === "number")
    .map((p) => ({ date: p.date, value: Number(p.actual) }));

  // The upstream BI payload often ships zero anomalies, so derive a sensitive z-score set
  // (|z| ≥ 1.5) from the actual series and union it with whatever upstream sent. This is what
  // gives "Anomalías detectadas" real markers and the moving-average trend below.
  const reservationTrend = movingAverage(anomalySeries, 3);
  const derivedAnomalies = detectAnomalies(anomalySeries, { metric: "reservas" });
  const upstreamDates = new Set(data.predictions.anomalies.map((a) => a.date));
  const mergedAnomalies: Anomaly[] = [
    ...data.predictions.anomalies,
    ...derivedAnomalies.filter((d) => !upstreamDates.has(d.date)),
  ];

  // Efficiency/forecast radar: each axis is a KPI as % of its target.
  const radarData = [
    { metric: "Lead→Calif.", value: data.kpis.leadToQualifiedRate, target: 0.4 },
    { metric: "Calif.→Cita", value: data.kpis.qualifiedToMeetingRate, target: 0.5 },
    { metric: "Cita→Reserva", value: data.kpis.meetingToReservation, target: 0.2 },
    { metric: "Lead→Cliente", value: data.kpis.leadToCustomerRate, target: 0.05 },
    { metric: "ROAS", value: data.kpis.roas, target: 3 },
    { metric: "LTV:CAC", value: data.kpis.ltvCacRatio, target: 3 },
  ];

  // Anomaly detail table (chart + table stay in sync via the merged set).
  const anomalyRows: AnomalyRow[] = mergedAnomalies.map((a) => {
    const z = a.z_score ?? a.zScore;
    return { ...a, zScoreDisplay: z != null ? Number(z).toFixed(2) : "—" };
  });

  // Forecast detail table
  const forecastRows: ForecastRow[] = reservations.map((p) => ({ ...p, dateDisplay: p.date }));

  return (
    <div className="space-y-6">
      <TimeWindowToggle run={run} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KpiCard
          label="Forecast reservas"
          value={num(data.kpis.forecastReservationsNextPeriod)}
          icon={CalendarRange}
          info={GLOSSARY.forecastReservationsKpi}
        />
        <KpiCard label="ROAS actual" value={`${data.kpis.roas.toFixed(2)}x`} icon={TrendingUp} info={GLOSSARY.roas} />
        <KpiCard
          label="Anomalías"
          value={num(mergedAnomalies.length)}
          icon={Activity}
          status={mergedAnomalies.length ? "amber" : "green"}
          info={GLOSSARY.anomaliesKpi}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Reservas: real vs forecast" description={data.predictions.method} info={GLOSSARY.reservasForecast}>
          {reservations.length ? <ForecastLine data={reservations} /> : <EmptyState message="Sin historial suficiente" />}
        </SectionCard>
        <SectionCard title="Costo por reserva proyectado" description="Intervalo de confianza desde snapshots horarios" info={GLOSSARY.cprForecast}>
          {cpr.length ? <ForecastLine data={cpr} format="money" /> : <EmptyState message="Sin historial suficiente" />}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Radar de eficiencia comercial" description="KPIs como % de su meta · las hendiduras = cuellos de botella" info={GLOSSARY.funnelRadar}>
          <KpiRadar data={radarData} />
        </SectionCard>
        <SectionCard title="Anomalías detectadas" description="Z-score sensible (|z| ≥ 1.5) + tendencia media móvil" info={GLOSSARY.anomaliesChart}>
          {anomalySeries.length ? (
            <AnomalyTimeline
              data={anomalySeries}
              anomalies={mergedAnomalies.map((a) => ({ date: a.date, value: a.value, severity: a.severity, metric: a.metric }))}
              trend={reservationTrend}
            />
          ) : (
            <EmptyState message="Sin historial suficiente" />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Contexto financiero" description="Forecast conectado a eficiencia comercial" info={GLOSSARY.financialContext}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <KpiCard label="CAC" value={money(data.kpis.cac, "USD")} icon={Activity} invertDelta info={GLOSSARY.cac} />
          <KpiCard label="LTV:CAC" value={`${data.kpis.ltvCacRatio.toFixed(2)}x`} icon={TrendingUp} info={GLOSSARY.ltvCac} />
          <KpiCard label="MER" value={`${data.kpis.mer.toFixed(2)}x`} icon={RadarIcon} info={GLOSSARY.mer} />
        </div>
      </SectionCard>

      {/* Anomaly detail table */}
      {anomalyRows.length > 0 && (
        <SectionCard title="Detalle anomalías detectadas" description="Todas las anomalías del período con z-score y severidad — exportable" info={GLOSSARY.anomaliesChart}>
          <AnomalyTable data={anomalyRows} run={run} />
        </SectionCard>
      )}

      {/* Forecast detail table */}
      {forecastRows.length > 0 && (
        <SectionCard title="Detalle forecast de reservas" description="Serie temporal real vs proyectada con intervalos de confianza" info={GLOSSARY.reservasForecast}>
          <ForecastTable data={forecastRows} run={run} />
        </SectionCard>
      )}
    </div>
  );
}
