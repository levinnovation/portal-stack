import { AlertTriangle, ArrowLeftRight, Percent, TrendingUp } from "lucide-react";
import { AutoRefresh } from "@/components/portal/auto-refresh";
import { AnomalyTimeline } from "@/components/portal/charts/anomaly-timeline";
import { AreaTrend } from "@/components/portal/charts/area-trend";
import { Heatmap } from "@/components/portal/charts/heatmap";
import { StackedBar } from "@/components/portal/charts/stacked-bar";
import { VarianceWaterfall } from "@/components/portal/charts/variance-waterfall";
import { AgentRunTrigger } from "@tenants/core/components/agent-run-trigger";
import { ProjectFilter } from "@tenants/core/components/cashflows/project-filter";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { money } from "@tenants/core/lib/format";
import { getCashflowsReport, uniqueProjects, type CashflowsReport } from "@tenants/core/sources/cashflows";

export async function CashflowsFlujoScreen({ project }: { project?: string }) {
  let report: CashflowsReport;
  try {
    report = await getCashflowsReport({ project });
  } catch (e) {
    return <ErrorState title="No se pudo leer el agente de Cashflows" detail={errMsg(e)} />;
  }

  const { summary, flujo, anomalies } = report;
  const projects = uniqueProjects(report.accounts, report.allProjects);
  const compositionData = flujo.monthlySeries.map((m) => ({ name: m.name, Ingresos: m.ingresos, Egresos: m.egresos }));

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60_000} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Diagnóstico mes a mes: composición ingresos/egresos, caja acumulada, qué partidas explican el
          cambio del neto y qué meses/partidas se salieron del rango esperado.
        </p>
        <div className="flex items-center gap-2">
          <ProjectFilter projects={projects} current={project} />
          <AgentRunTrigger
            agentId="cashflows"
            refreshInputs={{ action: "report_snapshot" }}
            realInputs={{ action: "refresh", dry_run: false }}
            confirmTitle="¿Ejecutar la corrida real de Cashflows?"
            confirmDescription="Volverá a leer Quickbase/SharePoint/banco, escribirá movimientos y plan en la base de datos."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Posición neta" value={money(summary.netPositionUsd)} icon={ArrowLeftRight} status={summary.netPositionUsd >= 0 ? "green" : "red"} />
        <KpiCard label="Recuperación de ingresos" value={summary.recoveryPct === null ? "—" : `${summary.recoveryPct.toFixed(1)}%`} icon={Percent} />
        <KpiCard
          label="Forecast neto (3m, P50)"
          value={summary.forecastNet3mP50 === null ? "—" : money(summary.forecastNet3mP50)}
          icon={TrendingUp}
          hint="modelo tendencia+estacional"
        />
        <KpiCard
          label="Anomalías detectadas"
          value={String(summary.anomalyCount)}
          icon={AlertTriangle}
          status={summary.anomalyCount > 0 ? "amber" : "green"}
          hint="meses fuera del rango esperado"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:[&>*]:min-w-0">
        <SectionCard
          title="Ingresos vs. egresos por mes"
          description="Movimiento bancario clasificado (excluye traslados/CXC-CXP), últimos periodos"
          aiExplain={{
            kind: "chart",
            description: "Barras divergentes: ingresos sobre el eje, egresos bajo el eje, por mes.",
            formula: "Σ amount_usd agrupado por mes y signo, excluyendo categoría.flow_type = 'neutral'",
            data: compositionData,
          }}
        >
          {compositionData.length ? (
            <StackedBar data={compositionData} keys={["Ingresos", "Egresos"]} moneyFormat />
          ) : (
            <EmptyState message="Sin movimientos clasificados" />
          )}
        </SectionCard>
        <SectionCard
          title="Caja neta acumulada"
          description="Curva de caja: suma acumulada del neto mensual (no es saldo bancario de apertura)"
          aiExplain={{
            kind: "chart",
            description: "Suma acumulada del neto (ingresos + egresos) mes a mes desde el primer periodo con datos.",
            formula: "cumulative[i] = cumulative[i-1] + neto[i]",
            data: flujo.cumulativeNetCurve,
          }}
        >
          {flujo.cumulativeNetCurve.length ? (
            <AreaTrend data={flujo.cumulativeNetCurve} label="Caja acumulada" />
          ) : (
            <EmptyState message="Sin historia suficiente" />
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:[&>*]:min-w-0">
        <SectionCard
          title="Bridge mes vs. mes anterior"
          description="Qué partidas explican el cambio del neto actual vs. el mes previo"
          aiExplain={{
            kind: "chart",
            description: "Cascada de las top 8 partidas por magnitud de cambio (actual del mes − actual del mes anterior).",
            formula: "delta = Σ actual_amount_usd(mes actual, partida) − Σ actual_amount_usd(mes anterior, partida)",
            data: flujo.bridgeMom,
          }}
        >
          {flujo.bridgeMom.length ? (
            <VarianceWaterfall data={flujo.bridgeMom} />
          ) : (
            <EmptyState message="Necesita al menos 2 meses con movimiento" />
          )}
        </SectionCard>
        <SectionCard
          title="Anomalías en el neto mensual"
          description="Meses fuera del rango esperado (mediana ± MAD robusto de la vecindad)"
          aiExplain={{
            kind: "chart",
            description: "Puntos marcados en rojo/ámbar son meses cuyo neto se desvía significativamente de sus meses vecinos.",
            formula: "z = 0.6745 × (valor − mediana_vecindad) / MAD_vecindad; alto si |z| ≥ 3, medio si |z| ≥ 2",
            data: anomalies,
          }}
        >
          {anomalies.available ? (
            <AnomalyTimeline data={anomalies.series} anomalies={anomalies.anomalies} trend={anomalies.trend} />
          ) : (
            <EmptyState message="Necesita al menos 6 meses de historia" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Mapa de desviaciones por partida × mes"
        description="% de variación (actual vs. plan) por partida, últimos 12 meses con datos"
        aiExplain={{
          kind: "chart",
          description: "Cada celda es el % de desviación de una partida en un mes — más intenso = mayor desviación absoluta.",
          formula: "variance_pct = ((actual − plan) / |plan|) × 100, por partida y mes",
          data: flujo.varianceHeatmap.slice(0, 60),
        }}
      >
        {flujo.varianceHeatmap.length ? (
          <Heatmap data={flujo.varianceHeatmap} />
        ) : (
          <EmptyState message="Sin suficientes partidas con plan y actual para comparar" />
        )}
      </SectionCard>
    </div>
  );
}
