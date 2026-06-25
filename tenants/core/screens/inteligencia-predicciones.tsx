import { Activity, CalendarRange, TrendingUp } from "lucide-react";

import { AnomalyTimeline } from "@/components/portal/charts/anomaly-timeline";
import { ForecastLine } from "@/components/portal/charts/forecast-line";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { money, num } from "@tenants/core/lib/format";
import type { InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { loadInteligencia } from "@tenants/core/lib/inteligencia-run";

export async function InteligenciaPrediccionesScreen({ run }: { run: InteligenciaRunType }) {
  const loaded = await loadInteligencia(run);
  if (!loaded.ok) {
    return <ErrorState title="No se pudo leer Inteligencia BI" detail={loaded.error} />;
  }
  const data = loaded.data;
  const reservations = data.predictions.forecasts?.reservations ?? [];
  const cpr = data.predictions.forecasts?.cost_per_reservation ?? [];
  const anomalySeries = reservations
    .filter((p) => typeof p.actual === "number")
    .map((p) => ({ date: p.date, value: Number(p.actual) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KpiCard label="Forecast reservas" value={num(data.kpis.forecastReservationsNextPeriod)} icon={CalendarRange} />
        <KpiCard label="ROAS actual" value={`${data.kpis.roas.toFixed(2)}x`} icon={TrendingUp} />
        <KpiCard label="Anomalías" value={num(data.predictions.anomalies.length)} icon={Activity} />
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
          <AnomalyTimeline
            data={anomalySeries}
            anomalies={data.predictions.anomalies.map((a) => ({ ...a, value: a.value }))}
          />
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
    </div>
  );
}