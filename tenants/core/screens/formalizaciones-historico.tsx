import { MultiLineTrend } from "@/components/portal/charts/multi-line-trend";
import { AgentRunTrigger } from "@tenants/core/components/agent-run-trigger";
import { SectionCard } from "@tenants/core/components/section-card";
import { TimeRangeSlider } from "@tenants/core/components/time-range-slider";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { num } from "@tenants/core/lib/format";
import {
  getFormalizacionesHistory,
  getFormalizacionesTimeseries,
  type MetricTimeseries,
  type SnapshotHistoryPoint,
} from "@tenants/core/sources/formalizaciones";

const TREND_METRICS: { key: string; label: string }[] = [
  { key: "scanned_cases", label: "Casos escaneados" },
  { key: "contacted_or_resumed", label: "Contactados" },
  { key: "ready_for_bank", label: "Listos para banco" },
  { key: "escalated", label: "Escalados" },
  { key: "still_pending", label: "Pendientes" },
];

function seriesFromTimeseries(raw: MetricTimeseries) {
  return TREND_METRICS.filter((m) => (raw[m.key] || []).length > 0).map((m) => ({
    key: m.key,
    label: m.label,
    data: raw[m.key] || [],
  }));
}

export async function FormalizacionesHistoricoScreen({
  from,
  to,
}: {
  from: string | null;
  to: string | null;
}) {
  let history: SnapshotHistoryPoint[];
  let timeseries: MetricTimeseries;
  try {
    [history, timeseries] = await Promise.all([
      getFormalizacionesHistory({ from, to, limit: 500 }),
      getFormalizacionesTimeseries(
        TREND_METRICS.map((m) => m.key),
        { from, to },
      ),
    ]);
  } catch (e) {
    return <ErrorState title="No se pudo leer la historia de Formalizaciones" detail={errMsg(e)} />;
  }

  const oldest = history[0]?.generatedAt ? new Date(history[0].generatedAt).getTime() : NaN;
  const minTs = Number.isFinite(oldest) ? oldest : Date.now() - 30 * 24 * 60 * 60 * 1000;
  const latest = history[history.length - 1];
  const series = seriesFromTimeseries(timeseries);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Historia append-only del pipeline (cada corrida real y cada refresh del snapshot), para
          analizar tendencias más allá de la última corrida.
        </p>
        <AgentRunTrigger
          agentId="formalizaciones"
          refreshInputs={{ event_type: "report_snapshot", force_refresh: true }}
          realInputs={{ event_type: "core_formalizaciones_daily_scan" }}
          confirmTitle="¿Ejecutar la corrida real de Formalizaciones?"
          confirmDescription="Contactará clientes reales (WhatsApp/email) y escribirá en Quickbase. El kill switch CORE_FORMALIZACIONES_DRY_RUN, si está activo, seguirá aplicando."
        />
      </div>

      <TimeRangeSlider minTs={minTs} />

      <SectionCard
        title="Tendencia del pipeline"
        description="Métricas escalares extraídas de cada snapshot en el rango seleccionado"
      >
        {series.length ? (
          <MultiLineTrend series={series} />
        ) : (
          <EmptyState message="Sin historia en este rango" hint="Ajusta el rango de tiempo o corre el agente" />
        )}
      </SectionCard>

      <SectionCard
        title="Corridas"
        description={`${history.length} snapshot(s) en el rango — más reciente primero`}
      >
        {history.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Origen</th>
                  <th className="py-2 pr-4">Dry-run</th>
                  <th className="py-2 pr-4">Escaneados</th>
                  <th className="py-2 pr-4">Contactados</th>
                  <th className="py-2 pr-4">Listos banco</th>
                  <th className="py-2 pr-4">Escalados</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((point) => (
                  <tr key={point.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground">
                      {new Date(point.generatedAt).toLocaleString("es-CR")}
                    </td>
                    <td className="py-2 pr-4">{point.runKind}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{point.triggerSource || "—"}</td>
                    <td className="py-2 pr-4">{point.dryRun ? "Sí" : "No"}</td>
                    <td className="py-2 pr-4">{num(point.summary.scanned_cases)}</td>
                    <td className="py-2 pr-4">{num(point.summary.contacted_or_resumed)}</td>
                    <td className="py-2 pr-4">{num(point.summary.ready_for_bank)}</td>
                    <td className="py-2 pr-4">{num(point.summary.escalated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Sin corridas en este rango" />
        )}
      </SectionCard>

      {latest ? (
        <p className="text-xs text-muted-foreground/70">
          Último snapshot del rango: {new Date(latest.generatedAt).toLocaleString("es-CR")}
        </p>
      ) : null}
    </div>
  );
}
