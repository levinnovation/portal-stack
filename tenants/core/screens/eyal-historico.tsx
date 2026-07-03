import Link from "next/link";
import { MultiLineTrend } from "@/components/portal/charts/multi-line-trend";
import { AgentRunTrigger } from "@tenants/core/components/agent-run-trigger";
import { EyalWindowToggle } from "@tenants/core/components/eyal/window-toggle";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { num } from "@tenants/core/lib/format";
import { getEyalReport, type EyalHistoryPoint, type EyalWindow } from "@tenants/core/sources/eyal";

const TREND_METRICS: { key: keyof EyalHistoryPoint["kpis"]; label: string }[] = [
  { key: "avgProgress", label: "Avance %" },
  { key: "urgentCount", label: "Urgentes" },
  { key: "overdueCount", label: "Atrasados" },
  { key: "riskQueueCount", label: "Cola de riesgo" },
];

export async function EyalHistoricoScreen({ window }: { window: EyalWindow }) {
  let history: EyalHistoryPoint[];
  try {
    ({ history } = await getEyalReport({ window }));
  } catch (e) {
    return <ErrorState title="No se pudo leer la historia de Eyal" detail={errMsg(e)} />;
  }

  const series = TREND_METRICS.map((m) => ({
    key: String(m.key),
    label: m.label,
    data: history
      .filter((point) => point.kpis[m.key] !== null && point.kpis[m.key] !== undefined)
      .map((point) => ({ t: point.generatedAt, v: Number(point.kpis[m.key]) })),
  })).filter((s) => s.data.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Historia append-only del cronograma (una fila por corrida real), para tendencias más allá
          del último corte.
        </p>
        <AgentRunTrigger
          agentId="eyal"
          refreshInputs={{ trigger: "report_snapshot" }}
          realInputs={{ trigger: "cron_daily_checkin" }}
          confirmTitle="¿Ejecutar la corrida real de Eyal?"
          confirmDescription="Enviará el reporte de cronograma real por WhatsApp/Teams/email al equipo PM."
        />
      </div>

      <EyalWindowToggle window={window} />

      <SectionCard title="Tendencia de KPIs" description="Extraídos de cada snapshot en la ventana seleccionada">
        {series.length ? <MultiLineTrend series={series} /> : <EmptyState message="Sin historia en esta ventana" />}
      </SectionCard>

      <SectionCard title="Corridas" description={`${history.length} snapshot(s) en la ventana — más reciente primero`}>
        {history.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Avance</th>
                  <th className="py-2 pr-4">Urgentes</th>
                  <th className="py-2 pr-4">Atrasados</th>
                  <th className="py-2 pr-4">Riesgo</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((point) => (
                  <tr key={point.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground">
                      {new Date(point.generatedAt).toLocaleString("es-CR")}
                    </td>
                    <td className="py-2 pr-4">{point.kpis.avgProgress ?? "—"}%</td>
                    <td className="py-2 pr-4">{num(point.kpis.urgentCount ?? 0)}</td>
                    <td className="py-2 pr-4">{num(point.kpis.overdueCount ?? 0)}</td>
                    <td className="py-2 pr-4">{num(point.kpis.riskQueueCount)}</td>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/portal/admin/agents/eyal?snapshot_id=${encodeURIComponent(point.id)}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Sin corridas en esta ventana" />
        )}
      </SectionCard>
    </div>
  );
}
