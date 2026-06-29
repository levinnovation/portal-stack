import { ForecastLine } from "@/components/portal/charts/forecast-line";
import { AnomalyTimeline } from "@/components/portal/charts/anomaly-timeline";
import { TimeWindowToggle } from "@tenants/core/components/inteligencia/time-window-toggle";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { AnomalyTable, ForecastTable, type AnomalyRow, type ForecastRow } from "@tenants/core/components/inteligencia/evidence-tables";
import { getInteligenciaDataOrNull, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { WindowEmptyState } from "@tenants/core/components/inteligencia/window-empty-state";
import { money, num } from "@tenants/core/lib/format";
import { Activity, CalendarRange, TrendingUp } from "lucide-react";

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

  // Anomaly detail table
  const anomalyRows: AnomalyRow[] = data.predictions.anomalies.map((a) => ({
    ...a,
    zScoreDisplay: (a.z_score ?? a.zScore) != null ? Number(a.z_score ?? a.zScore).toFixed(2) : "—",
  }));

  // Forecast detail table
  const forecastRows: ForecastRow[] = reservations.map((p) => ({ ...p, dateDisplay: p.date }));

  return (
    <div className="space-y-6">
      <TimeWindowToggle run={run} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KpiCard label="Forecast reservas" value={num(data.kpis.forecastReservationsNextPeriod)} icon={CalendarRange} />
        <KpiCard label="ROAS actual" value={`${data.kpis.roas.toFixed(2)}x`} icon={TrendingUp} />
        <KpiCard label="Anomalías" value={num(data.predictions.anomalies.length)} icon={Activity} status={data.predictions.anomalies.length ? "amber" : "green"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Reservas: real vs forecast" description={data.predictions.method}>
          {reservations.length ? <ForecastLine data={reservations} /> : <EmptyState message="Sin historial suficiente" />}
        </SectionCard>
        <SectionCard title="Costo por reserva proyectado" description="Intervalo de confianza desde snapshots horarios">
          {cpr.length ? <ForecastLine data={cpr} format="money" /> : <EmptyState message="Sin historial suficiente" />}
        </SectionCard>
      </div>

      <SectionCard title="Anomalías detectadas" description="Marcadores z-score sobre la serie de reservas">
        {anomalySeries.length ? (
          <AnomalyTimeline data={anomalySeries} anomalies={data.predictions.anomalies.map((a) => ({ ...a, value: a.value }))} />
        ) : (
          <EmptyState message="Sin anomalías o sin historial suficiente" />
        )}
      </SectionCard>

      <SectionCard title="Contexto financiero" description="Forecast conectado a eficiencia comercial">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <KpiCard label="CAC" value={money(data.kpis.cac, "USD")} icon={Activity} invertDelta />
          <KpiCard label="LTV:CAC" value={`${data.kpis.ltvCacRatio.toFixed(2)}x`} icon={TrendingUp} />
          <KpiCard label="MER" value={`${data.kpis.mer.toFixed(2)}x`} icon={TrendingUp} />
        </div>
      </SectionCard>

      {/* Anomaly detail table */}
      {anomalyRows.length > 0 && (
        <SectionCard title="Detalle anomalías detectadas" description="Todas las anomalías del período con z-score y severidad — exportable">
          <AnomalyTable data={anomalyRows} run={run} />
        </SectionCard>
      )}

      {/* Forecast detail table */}
      {forecastRows.length > 0 && (
        <SectionCard title="Detalle forecast de reservas" description="Serie temporal real vs proyectada con intervalos de confianza">
          <ForecastTable data={forecastRows} run={run} />
        </SectionCard>
      )}
    </div>
  );
}
