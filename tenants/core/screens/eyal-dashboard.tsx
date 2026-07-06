import { AlertTriangle, Building2, Clock, Landmark, Percent, ShieldAlert } from "lucide-react";
import { MultiLineTrend } from "@/components/portal/charts/multi-line-trend";
import { StackedBar } from "@/components/portal/charts/stacked-bar";
import { AgentRunTrigger } from "@tenants/core/components/agent-run-trigger";
import { BarHorizontal } from "@tenants/core/components/charts/bar-horizontal";
import { Donut } from "@tenants/core/components/charts/donut";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { money, num, pct as fmtPct } from "@tenants/core/lib/format";
import { getEyalReport } from "@tenants/core/sources/eyal";

type ProjectHealthRow = {
  plan_title?: string;
  status?: "red" | "yellow" | "green" | string;
  status_label?: string;
  next_due?: string;
  avg_pct?: number;
  urgent_count?: number;
  overdue_count?: number;
};

type RiskQueueRow = {
  priority_score?: number;
  source?: string;
  owner?: string;
  title?: string;
  why?: string;
  cta?: string;
};

type GanttRow = {
  title?: string;
  plan_title?: string;
  due?: string;
  pct?: number;
  offset_pct?: number;
  bar_pct?: number;
  progress_pct?: number;
  status?: "overdue" | "urgent" | "ontrack" | string;
};

type OcHeatRow = {
  project?: string;
  count?: number;
  latest?: string;
  level?: string;
  level_label?: string;
};

type EtapaStack = {
  nombre?: string;
  proyecto?: string;
  sold?: number;
  reserved?: number;
  available?: number;
  total?: number;
};

type TrendPoint = { period?: string; ar?: number; ap?: number; net?: number; runway?: number };

type ExposureRow = { project?: string; net?: number; exposure_score?: number; oc?: number };

type SharepointProjectRow = {
  slug?: string;
  count?: number;
  done?: number;
  overdue?: number;
  soon?: number;
  milestones?: { name?: string; date?: string; pct?: number; status_label?: string; status_key?: string }[];
};

const STATUS_DOT: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
};

const GANTT_BAR: Record<string, string> = {
  overdue: "bg-red-500/70",
  urgent: "bg-amber-500/70",
  ontrack: "bg-emerald-500/60",
};

const asNum = (v: unknown): number => (typeof v === "number" && isFinite(v) ? v : 0);

export async function EyalDashboardScreen({ snapshotId }: { snapshotId?: string }) {
  let data: Awaited<ReturnType<typeof getEyalReport>>;
  try {
    data = await getEyalReport({ snapshotId, window: "1m" });
  } catch (e) {
    return <ErrorState title="No se pudo leer el agente Eyal (PM Cronograma)" detail={errMsg(e)} />;
  }

  const { snapshot } = data;
  if (!snapshot) {
    return (
      <div className="space-y-4">
        <AgentRunTrigger
          agentId="eyal"
          refreshInputs={{ trigger: "report_snapshot" }}
          realInputs={{ trigger: "cron_daily_checkin" }}
          confirmTitle="¿Ejecutar la corrida real de Eyal?"
          confirmDescription="Enviará el reporte de cronograma real por WhatsApp/Teams/email al equipo PM."
        />
        <EmptyState
          message="Aún no hay snapshots de Eyal"
          hint="Corre el cron_daily_checkin (o espera a la corrida diaria) para poblar el histórico"
        />
      </div>
    );
  }

  const { kpis, reportSections } = snapshot;
  const delivery = (reportSections.delivery as Record<string, unknown>) || {};
  const crm = (reportSections.crm as Record<string, unknown>) || {};
  const financial = (reportSections.financial as Record<string, unknown>) || {};
  const changeOrders = (reportSections.change_orders as Record<string, unknown>) || {};
  const sharepoint = (reportSections.sharepoint as Record<string, unknown>) || {};
  const dataQuality = (reportSections.data_quality as Record<string, unknown>) || {};

  const projectHealth = (Array.isArray(delivery.project_health) ? delivery.project_health : []) as ProjectHealthRow[];
  const ganttRows = (Array.isArray(delivery.gantt_rows) ? delivery.gantt_rows : []) as GanttRow[];
  const agingCounts = (delivery.aging_counts as Record<string, number>) || {};
  const plannerStatusCounts = (delivery.planner_status_counts as Record<string, number>) || {};
  const riskQueue = (Array.isArray(reportSections.risk_queue) ? reportSections.risk_queue : []) as RiskQueueRow[];
  const inventory = (crm.inventory_totals as Record<string, number>) || {};
  const topEtapas = (Array.isArray(crm.top_etapas) ? crm.top_etapas : []) as EtapaStack[];
  const trendPoints = (Array.isArray(financial.trend_points) ? financial.trend_points : []) as TrendPoint[];
  const projectExposure = (Array.isArray(financial.project_exposure) ? financial.project_exposure : []) as ExposureRow[];
  const ocHeat = (Array.isArray(changeOrders.oc_heat) ? changeOrders.oc_heat : []) as OcHeatRow[];
  const spProjects = (Array.isArray(sharepoint.projects) ? sharepoint.projects : []) as SharepointProjectRow[];

  // Aging de tareas — mismo bucketing que el "Aging" del reporte email/PDF.
  const agingData = [
    { name: "Vencidas", value: asNum(agingCounts.overdue) },
    { name: "0-7 días", value: asNum(agingCounts["0_7"]) },
    { name: "8-14 días", value: asNum(agingCounts["8_14"]) },
    { name: "15-30 días", value: asNum(agingCounts["15_30"]) },
    { name: "Sin fecha", value: asNum(agingCounts.no_date) },
  ].filter((d) => d.value > 0);

  const plannerData = Object.entries(plannerStatusCounts)
    .map(([name, value]) => ({ name, value: asNum(value) }))
    .filter((d) => d.value > 0);

  const inventoryData = [
    { name: "Vendidas", value: asNum(inventory.sold_units) },
    { name: "Reservadas", value: asNum(inventory.reserved_units) },
    { name: "Disponibles", value: asNum(inventory.available_units) },
  ].filter((d) => d.value > 0);

  // AR vs AP vs Neto mensual — misma serie que "AR vs AP Trend" del reporte.
  const finTrendSeries = [
    { key: "ar", label: "AR", data: trendPoints.map((p) => ({ t: String(p.period || ""), v: asNum(p.ar) })) },
    { key: "ap", label: "AP", data: trendPoints.map((p) => ({ t: String(p.period || ""), v: asNum(p.ap) })) },
    { key: "net", label: "Neto", data: trendPoints.map((p) => ({ t: String(p.period || ""), v: asNum(p.net) })) },
  ].filter((s) => s.data.some((p) => p.v !== 0));

  const runwaySeries = trendPoints.some((p) => asNum(p.runway) !== 0)
    ? [{ key: "runway", label: "Cash runway (acumulado)", data: trendPoints.map((p) => ({ t: String(p.period || ""), v: asNum(p.runway) })) }]
    : [];

  const exposureData = projectExposure
    .map((row) => ({ name: String(row.project || "—"), value: asNum(row.net) }))
    .filter((d) => d.value !== 0)
    .slice(0, 10);

  const etapasStackData = topEtapas.map((e) => ({
    name: `${e.nombre || "—"}${e.proyecto ? ` · ${e.proyecto}` : ""}`.slice(0, 28),
    Vendidas: asNum(e.sold),
    Reservadas: asNum(e.reserved),
    Disponibles: asNum(e.available),
  }));

  const qualityBadge = String(dataQuality.badge || "");
  const spSync = (sharepoint.sync as Record<string, unknown>) || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Cronograma, financiero e inventario CORE — mismo corte que el reporte diario PDF/WhatsApp.
        </p>
        <p className="text-xs text-muted-foreground/70">
          Corte: {new Date(snapshot.generatedAt).toLocaleString("es-CR")}
          {snapshotId ? " · viendo snapshot histórico" : ""}
          {qualityBadge ? ` · Confianza de datos: ${qualityBadge}` : ""}
        </p>
      </div>

      <AgentRunTrigger
        agentId="eyal"
        refreshInputs={{ trigger: "report_snapshot" }}
        realInputs={{ trigger: "cron_daily_checkin" }}
        confirmTitle="¿Ejecutar la corrida real de Eyal?"
        confirmDescription="Enviará el reporte de cronograma real por WhatsApp/Teams/email al equipo PM."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Avance promedio" value={fmtPct((kpis.avgProgress ?? 0) / 100)} icon={Percent} />
        <KpiCard
          label="Urgentes / atrasados"
          value={`${num(kpis.urgentCount ?? 0)} / ${num(kpis.overdueCount ?? 0)}`}
          icon={Clock}
          status={(kpis.overdueCount ?? 0) > 0 ? "red" : (kpis.urgentCount ?? 0) > 0 ? "amber" : "green"}
        />
        <KpiCard label="AR próximos 30 días" value={money(kpis.arNext30 ?? 0)} icon={Landmark} status="green" />
        <KpiCard label="AP próximos 30 días" value={money(kpis.apNext30 ?? 0)} icon={Landmark} status="amber" />
        <KpiCard label="Neto 30 días" value={money(kpis.net30 ?? 0)} icon={Landmark} />
        <KpiCard label="Exposición OC" value={money(kpis.ocExposure ?? 0)} icon={AlertTriangle} />
        <KpiCard
          label="Inventario disponible"
          value={`${num(kpis.availableUnits ?? 0)} (${fmtPct((kpis.availablePct ?? 0) / 100)})`}
          icon={Building2}
        />
        <KpiCard label="Cola de riesgo" value={num(kpis.riskQueueCount)} icon={ShieldAlert} status={kpis.riskQueueCount > 0 ? "amber" : "green"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Salud de proyectos"
          description="Estado del cronograma por plan (rojo = atrasado, amarillo = urgente)"
        >
          {projectHealth.length ? (
            <div className="space-y-2">
              {projectHealth.map((row, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[row.status || ""] || "bg-muted"}`} />
                    <span className="font-medium text-foreground">{row.plan_title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{row.next_due}</span>
                    <span className="tabular-nums">{row.avg_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Sin proyectos activos" />
          )}
        </SectionCard>
        <SectionCard title="Cola de riesgo" description="Top señales priorizadas (schedule, financiero, CRM, OC)">
          {riskQueue.length ? (
            <div className="space-y-2">
              {riskQueue.map((row, i) => (
                <div key={i} className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{row.title}</span>
                    <span className="text-xs text-muted-foreground">{row.owner}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{row.why}</p>
                  {row.cta ? <p className="mt-1 text-xs text-amber-400/90">{row.cta}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Sin riesgos activos" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Cronograma (Gantt)"
        description="Hitos incompletos en la ventana de lookahead — barra = duración restante, relleno = avance"
      >
        {ganttRows.length ? (
          <div className="space-y-1.5">
            {ganttRows.map((row, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,220px)_1fr_64px] items-center gap-3 text-xs">
                <div className="truncate">
                  <span className="font-medium text-foreground">{row.title}</span>
                  <span className="ml-1 text-muted-foreground/70">· {row.plan_title}</span>
                </div>
                <div className="relative h-4 rounded bg-muted/40">
                  <div
                    className={`absolute top-0 h-4 rounded ${GANTT_BAR[row.status || ""] || "bg-muted"}`}
                    style={{ left: `${asNum(row.offset_pct)}%`, width: `${Math.max(asNum(row.bar_pct), 1.5)}%` }}
                  >
                    <div
                      className="h-4 rounded-l bg-foreground/30"
                      style={{ width: `${Math.min(asNum(row.pct), 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right tabular-nums text-muted-foreground">
                  {String(row.due || "").slice(5, 10)} · {asNum(row.pct)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Sin hitos en la ventana de lookahead" />
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="Aging de tareas" description="Tareas incompletas por antigüedad del vencimiento">
          {agingData.length ? <BarHorizontal data={agingData} format="num" /> : <EmptyState message="Sin tareas pendientes" />}
        </SectionCard>
        <SectionCard title="Estado Planner/MS Project" description="Distribución de tareas por estado">
          {plannerData.length ? <Donut data={plannerData} format="num" /> : <EmptyState message="Sin tareas" />}
        </SectionCard>
        <SectionCard
          title="Inventario CRM"
          description={`${num(asNum(inventory.total_units))} unidades en etapas activas`}
        >
          {inventoryData.length ? <Donut data={inventoryData} format="num" /> : <EmptyState message="Sin inventario CRM activo" />}
        </SectionCard>
      </div>

      <SectionCard
        title="Top etapas CRM"
        description="Vendidas / reservadas / disponibles por etapa (mismo stack que el reporte)"
      >
        {etapasStackData.length ? (
          <StackedBar data={etapasStackData} keys={["Vendidas", "Reservadas", "Disponibles"]} />
        ) : (
          <EmptyState message="Sin etapas CRM activas" />
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Tendencia AR vs AP" description="Flujo mensual: cuentas por cobrar, por pagar y neto">
          {finTrendSeries.length ? <MultiLineTrend series={finTrendSeries} /> : <EmptyState message="Sin datos financieros confiables" />}
        </SectionCard>
        <SectionCard title="Cash runway" description="Neto acumulado (AR - AP) por mes">
          {runwaySeries.length ? <MultiLineTrend series={runwaySeries} /> : <EmptyState message="Sin datos financieros confiables" />}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Neto por proyecto" description="AR - AP por proyecto (exposición financiera)">
          {exposureData.length ? <BarHorizontal data={exposureData} format="moneyCompact" /> : <EmptyState message="Sin exposición por proyecto" />}
        </SectionCard>
        <SectionCard
          title="Órdenes de cambio"
          description={`${num(asNum(changeOrders.oc_total_count as number))} OC activas en ${num(asNum(changeOrders.oc_projects_count as number))} proyecto(s)`}
        >
          {ocHeat.length ? (
            <div className="space-y-2">
              {ocHeat.map((row, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        row.level === "high" ? "bg-red-500" : row.level === "medium" ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    />
                    <span className="font-medium text-foreground">{row.project}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{row.level_label}</span>
                    <span>{row.latest}</span>
                    <span className="tabular-nums font-semibold text-foreground">{num(asNum(row.count))}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Sin órdenes de cambio activas" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Hitos SharePoint (Avance de obra)"
        description={`${num(asNum(sharepoint.milestone_total as number))} hito(s) · sync: ${String(spSync.status || spSync.result || "—")}`}
      >
        {spProjects.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4">Proyecto</th>
                  <th className="py-2 pr-4">Hitos</th>
                  <th className="py-2 pr-4">Completos</th>
                  <th className="py-2 pr-4">Próximos</th>
                  <th className="py-2 pr-4">Vencidos</th>
                  <th className="py-2 pr-4">Próximo hito</th>
                </tr>
              </thead>
              <tbody>
                {spProjects.map((row, i) => {
                  const nextMilestone = (row.milestones || []).find((m) => m.status_key !== "done");
                  return (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4 font-medium text-foreground">{row.slug}</td>
                      <td className="py-2 pr-4 tabular-nums">{num(asNum(row.count))}</td>
                      <td className="py-2 pr-4 tabular-nums text-emerald-400">{num(asNum(row.done))}</td>
                      <td className="py-2 pr-4 tabular-nums text-amber-400">{num(asNum(row.soon))}</td>
                      <td className={`py-2 pr-4 tabular-nums ${asNum(row.overdue) > 0 ? "text-red-400" : "text-muted-foreground"}`}>
                        {num(asNum(row.overdue))}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {nextMilestone ? `${nextMilestone.name || ""} · ${nextMilestone.date || "sin fecha"}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Sin hitos SharePoint sincronizados" />
        )}
      </SectionCard>
    </div>
  );
}
