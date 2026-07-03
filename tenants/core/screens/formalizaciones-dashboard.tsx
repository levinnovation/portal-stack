import {
  AlertTriangle,
  Clock,
  FileCheck2,
  Landmark,
  MessageSquare,
  Users,
} from "lucide-react";
import { AutoRefresh } from "@/components/portal/auto-refresh";
import { BarHorizontal } from "@/components/portal/charts/bar-horizontal";
import { BarVertical } from "@/components/portal/charts/bar-vertical";
import { Donut } from "@/components/portal/charts/donut";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { num } from "@tenants/core/lib/format";
import { STAGE_LABELS, STATUS_LABELS } from "@tenants/core/lib/formalizaciones-labels";
import {
  getFormalizacionesReport,
  type CaseStage,
  type CaseStatus,
  type FormalizacionesReport,
} from "@tenants/core/sources/formalizaciones";

/** Variación relativa día-sobre-día para KpiCard (null = sin dato previo). */
function delta(curr: number, prev: number | undefined): number | null {
  if (prev === undefined || !isFinite(prev) || prev <= 0) return null;
  return (curr - prev) / prev;
}

export async function FormalizacionesDashboardScreen() {
  let report: FormalizacionesReport;
  try {
    report = await getFormalizacionesReport();
  } catch (e) {
    return <ErrorState title="No se pudo leer el agente de Formalizaciones" detail={errMsg(e)} />;
  }

  const { summary, previousSummary: prev, caseRows } = report;

  const statusCounts = new Map<CaseStatus, number>();
  const stageCounts = new Map<CaseStage, number>();
  const missingDocCounts = new Map<string, number>();
  const completenessBuckets = [0, 0, 0, 0, 0]; // 0-24, 25-49, 50-74, 75-99, 100
  for (const row of caseRows) {
    statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
    stageCounts.set(row.stage, (stageCounts.get(row.stage) ?? 0) + 1);
    for (const doc of row.missingDocs) {
      missingDocCounts.set(doc, (missingDocCounts.get(doc) ?? 0) + 1);
    }
    completenessBuckets[row.completenessPct >= 100 ? 4 : Math.floor(row.completenessPct / 25)] += 1;
  }

  const statusData = [...statusCounts.entries()].map(([status, count]) => ({
    name: STATUS_LABELS[status],
    value: count,
  }));
  const stageData = (Object.keys(STAGE_LABELS) as CaseStage[]).map((stage) => ({
    name: STAGE_LABELS[stage],
    value: stageCounts.get(stage) ?? 0,
  }));
  const missingDocData = [...missingDocCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([doc, count]) => ({ name: doc, value: count }));
  const completenessData = ["0-24%", "25-49%", "50-74%", "75-99%", "100%"].map((label, i) => ({
    name: label,
    value: completenessBuckets[i],
  }));

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60_000} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Pipeline de formalización de crédito (Quickbase · Entrega de Unidad), mismo corte que el
          reporte diario por correo/PDF.
        </p>
        <p className="text-xs text-muted-foreground/70">
          Corte: {report.runDate} · se refresca cada minuto
        </p>
      </div>

      {/* KPIs con delta día-sobre-día */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard label="Casos escaneados" value={num(summary.scanned_cases)} icon={Users} />
        <KpiCard
          label="Contactados hoy"
          value={num(summary.contacted_or_resumed)}
          icon={MessageSquare}
          delta={delta(summary.contacted_or_resumed, prev?.contacted_or_resumed)}
          deltaLabel="vs ayer"
        />
        <KpiCard
          label="Docs recibidos hoy"
          value={num(summary.docs_received_today)}
          icon={FileCheck2}
          delta={delta(summary.docs_received_today, prev?.docs_received_today)}
          deltaLabel="vs ayer"
        />
        <KpiCard label="Listos para banco" value={num(summary.ready_for_bank)} icon={Landmark} status="green" />
        <KpiCard
          label="Escalados"
          value={num(summary.escalated)}
          icon={AlertTriangle}
          status={summary.escalated > 0 ? "red" : "green"}
          invertDelta
        />
        <KpiCard
          label="Pendientes"
          value={num(summary.still_pending)}
          icon={Clock}
          status={summary.still_pending > 0 ? "amber" : "green"}
          hint={summary.pending_review_count > 0 ? `${num(summary.pending_review_count)} en revisión manual` : undefined}
        />
      </div>

      {/* Estado + etapas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Distribución por estado"
          description="Estado operativo de cada caso en la corrida actual"
        >
          {statusData.length ? <Donut data={statusData} /> : <EmptyState message="Sin casos activos" />}
        </SectionCard>
        <SectionCard
          title="Etapas del proceso"
          description="S1 Inicio → S4 Banco, S5 = escalado por silencio"
        >
          {caseRows.length ? <BarVertical data={stageData} format="num" /> : <EmptyState message="Sin casos activos" />}
        </SectionCard>
      </div>

      {/* Docs faltantes + completitud */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Documentos pendientes más frecuentes"
          description="Cuántos casos esperan cada documento del checklist bancario"
        >
          {missingDocData.length ? (
            <BarHorizontal data={missingDocData} format="num" />
          ) : (
            <EmptyState message="No hay documentos pendientes" hint="Todos los checklists están completos" />
          )}
        </SectionCard>
        <SectionCard
          title="Completitud del expediente"
          description="Distribución del % de checklist completado por caso"
        >
          {caseRows.length ? (
            <BarVertical data={completenessData} format="num" />
          ) : (
            <EmptyState message="Sin casos activos" />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
