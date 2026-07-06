import { MultiLineTrend } from "@/components/portal/charts/multi-line-trend";
import { AgentRunTrigger } from "@tenants/core/components/agent-run-trigger";
import { SectionCard } from "@tenants/core/components/section-card";
import { TimeRangeSlider } from "@tenants/core/components/time-range-slider";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { money, num } from "@tenants/core/lib/format";
import {
  getCashflowsHistory,
  getCashflowsTimeseries,
  type MetricTimeseries,
  type SnapshotHistoryPoint,
} from "@tenants/core/sources/cashflows";

const TREND_METRICS: { key: string; label: string }[] = [
  { key: "total_income_usd", label: "Ingresos" },
  { key: "total_outflow_usd", label: "Egresos" },
  { key: "net_position_usd", label: "Posición neta" },
  { key: "deviation_count", label: "Desviaciones" },
];

function seriesFromTimeseries(raw: MetricTimeseries) {
  return TREND_METRICS.filter((m) => (raw[m.key] || []).length > 0).map((m) => ({
    key: m.key,
    label: m.label,
    data: raw[m.key] || [],
  }));
}

export async function CashflowsHistoricoScreen({
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
      getCashflowsHistory({ from, to, limit: 500 }),
      getCashflowsTimeseries(
        TREND_METRICS.map((m) => m.key),
        { from, to },
      ),
    ]);
  } catch (e) {
    return <ErrorState title="No se pudo leer la historia de Cashflows" detail={errMsg(e)} />;
  }

  const oldest = history[0]?.generatedAt ? new Date(history[0].generatedAt).getTime() : NaN;
  const minTs = Number.isFinite(oldest) ? oldest : Date.now() - 180 * 24 * 60 * 60 * 1000;
  const latest = history[history.length - 1];
  const series = seriesFromTimeseries(timeseries);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Historia append-only del pipeline (cada corrida real y cada refresh del snapshot), para
          ver la evolución mes a mes de caja e ingresos más allá del último corte.
        </p>
        <AgentRunTrigger
          agentId="cashflows"
          refreshInputs={{ action: "report_snapshot" }}
          realInputs={{ action: "refresh", dry_run: false }}
          confirmTitle="¿Ejecutar la corrida real de Cashflows?"
          confirmDescription="Volverá a leer Quickbase/SharePoint/banco, escribirá movimientos y plan en la base de datos, y puede enviar alertas de desviación por correo al equipo si se supera el umbral configurado."
        />
      </div>

      <TimeRangeSlider minTs={minTs} />

      <SectionCard
        title="Tendencia de caja e ingresos"
        description="Métricas escalares extraídas de cada snapshot en el rango seleccionado"
        aiExplain={{
          kind: "chart",
          description: "Una línea por métrica (ingresos, egresos, posición neta, desviaciones) a través del tiempo, un punto por snapshot persistido.",
          formula: "Series extraídas de summary_json de agent_run_snapshots, filtradas por el rango de fecha seleccionado",
          data: series.map((s) => ({ key: s.key, points: s.data.length, last: s.data[s.data.length - 1] })),
        }}
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
        aiExplain={{
          kind: "table",
          description: "Cada fila es una ejecución persistida del pipeline de Cashflows (cron o manual), con el resumen de ese corte.",
          formula: "Lectura directa de agent_run_snapshots (sin cálculo derivado)",
          data: history.slice(-20),
        }}
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
                  <th className="py-2 pr-4">Ingresos</th>
                  <th className="py-2 pr-4">Egresos</th>
                  <th className="py-2 pr-4">Posición neta</th>
                  <th className="py-2 pr-4">Desviaciones</th>
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
                    <td className="py-2 pr-4">{money(point.summary.totalIncomeUsd)}</td>
                    <td className="py-2 pr-4">{money(point.summary.totalOutflowUsd)}</td>
                    <td className="py-2 pr-4">{money(point.summary.netPositionUsd)}</td>
                    <td className="py-2 pr-4">{num(point.summary.deviationCount)}</td>
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
