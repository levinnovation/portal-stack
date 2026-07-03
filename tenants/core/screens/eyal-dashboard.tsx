import { AlertTriangle, Building2, Clock, Landmark, Percent, ShieldAlert } from "lucide-react";
import { AgentRunTrigger } from "@tenants/core/components/agent-run-trigger";
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
};

type RiskQueueRow = {
  priority_score?: number;
  source?: string;
  owner?: string;
  title?: string;
  why?: string;
  cta?: string;
};

const STATUS_DOT: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
};

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
  const projectHealth = (Array.isArray(delivery.project_health) ? delivery.project_health : []) as ProjectHealthRow[];
  const riskQueue = (Array.isArray(reportSections.risk_queue) ? reportSections.risk_queue : []) as RiskQueueRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Cronograma, financiero e inventario CORE — mismo corte que el reporte diario PDF/WhatsApp.
        </p>
        <p className="text-xs text-muted-foreground/70">
          Corte: {new Date(snapshot.generatedAt).toLocaleString("es-CR")}
          {snapshotId ? " · viendo snapshot histórico" : ""}
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
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Sin riesgos activos" />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
