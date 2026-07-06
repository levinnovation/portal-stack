import { BarChart3, CircleDollarSign, PieChart, Users } from "lucide-react";
import { AutoRefresh } from "@/components/portal/auto-refresh";
import { BarHorizontal } from "@/components/portal/charts/bar-horizontal";
import { Donut } from "@/components/portal/charts/donut";
import { Histogram } from "@/components/portal/charts/histogram";
import { ParetoChart } from "@/components/portal/charts/pareto";
import { StackedBar } from "@/components/portal/charts/stacked-bar";
import { AgentRunTrigger } from "@tenants/core/components/agent-run-trigger";
import { ProjectFilter } from "@tenants/core/components/cashflows/project-filter";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { compactMoney, money } from "@tenants/core/lib/format";
import { getCashflowsReport, uniqueProjects, type CashflowsReport } from "@tenants/core/sources/cashflows";

function fmtPct(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(1)}%`;
}

export async function CashflowsCxpScreen({ project }: { project?: string }) {
  let report: CashflowsReport;
  try {
    report = await getCashflowsReport({ project });
  } catch (e) {
    return <ErrorState title="No se pudo leer el agente de Cashflows" detail={errMsg(e)} />;
  }

  const { cxp } = report;
  const projects = uniqueProjects(report.accounts);
  const presupuestoData = cxp.presupuestoVsEjecutado.flatMap((r) => [
    { name: `${r.name} (plan)`, value: r.plan },
    { name: `${r.name} (real)`, value: r.actual },
  ]);

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60_000} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Analítica de gasto ejecutado (banco) + plan presupuestado por partida — Quickbase no tiene un
          ledger de payables vivo, así que no se reporta un "CxP abierto" real.
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
        <KpiCard label="Gasto del mes" value={money(cxp.kpis.gastoMesActualUsd)} icon={CircleDollarSign} />
        <KpiCard label="% top proveedor" value={fmtPct(cxp.kpis.pctTopProveedor)} icon={PieChart} status={cxp.kpis.pctTopProveedor !== null && cxp.kpis.pctTopProveedor > 40 ? "amber" : "green"} />
        <KpiCard label="Proveedores activos (12m)" value={String(cxp.kpis.proveedoresActivos)} icon={Users} />
        <KpiCard label="Presupuesto restante" value={cxp.kpis.presupuestoRestanteUsd === null ? "—" : money(cxp.kpis.presupuestoRestanteUsd)} icon={BarChart3} hint="del año, partidas costo/gasto" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:[&>*]:min-w-0">
        <SectionCard
          title="Gasto por proveedor (Pareto)"
          description="Últimos 12 meses, con % acumulado"
          aiExplain={{
            kind: "chart",
            description: "Barras de gasto absoluto por proveedor, ordenadas de mayor a menor, con línea de % acumulado.",
            formula: "Σ |amount_usd| por proveedor (movimientos costo/gasto/financiamiento), últimos 12 meses",
            data: cxp.paretoProveedores,
          }}
        >
          {cxp.paretoProveedores.length ? (
            <ParetoChart data={cxp.paretoProveedores} />
          ) : (
            <EmptyState message="Sin movimientos de gasto" />
          )}
        </SectionCard>
        <SectionCard
          title="Distribución de tamaños de pago"
          description="Detección de atomización/fraccionamiento de pagos"
          aiExplain={{
            kind: "chart",
            description: "Cuántos pagos caen en cada rango de monto, últimos 12 meses.",
            formula: "bins: <100, 100-500, 500-1k, 1k-5k, 5k-20k, 20k+ USD",
            data: cxp.histogramaPagos,
          }}
        >
          {cxp.histogramaPagos.some((h) => h.count > 0) ? (
            <Histogram data={cxp.histogramaPagos} />
          ) : (
            <EmptyState message="Sin movimientos de gasto" />
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:[&>*]:min-w-0">
        <SectionCard
          title="Gasto por partida × mes"
          description="Top partidas de gasto, últimos 12 meses"
          aiExplain={{
            kind: "chart",
            description: "Composición mensual del gasto por partida presupuestaria (top 6 + Otros).",
            formula: "Σ |amount_usd| agrupado por (mes, partida), top 6 partidas por total + resto agrupado en 'Otros'",
            data: cxp.gastoPorPartidaMes,
          }}
        >
          {cxp.gastoPorPartidaMes.length ? (
            <StackedBar data={cxp.gastoPorPartidaMes} keys={[...cxp.topPartidas, "Otros"]} tickFormatter={compactMoney} />
          ) : (
            <EmptyState message="Sin movimientos de gasto" />
          )}
        </SectionCard>
        <SectionCard
          title="Concentración de proveedores"
          description="Índice HHI sobre el gasto de los últimos 12 meses"
          aiExplain={{
            kind: "chart",
            description: "HHI de la distribución de gasto por proveedor: >2500 alta concentración, 1500-2500 moderada, <1500 diversificada.",
            formula: "HHI = Σ (gasto_proveedor / gasto_total)² × 10000",
            data: { hhi: cxp.concentracionHhi },
          }}
        >
          <div className="flex h-[260px] flex-col items-center justify-center gap-2">
            <span className="text-4xl font-semibold text-foreground">{cxp.concentracionHhi ?? "—"}</span>
            <span className="text-xs text-muted-foreground">
              {cxp.concentracionHhi === null ? "Sin datos" : cxp.concentracionHhi > 2500 ? "Alta concentración" : cxp.concentracionHhi > 1500 ? "Concentración moderada" : "Diversificado"}
            </span>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Presupuesto vs. ejecutado — top 10 partidas"
        description="Partidas de costo/gasto con mayor ejecución del año"
        aiExplain={{
          kind: "chart",
          description: "Comparación plan vs. real por partida, alternando barras de plan y real para las 10 partidas con mayor ejecución.",
          formula: "top 10 por |actual_amount_usd|, entre partidas con flow_type ∈ {costo, gasto}",
          data: cxp.presupuestoVsEjecutado,
        }}
      >
        {presupuestoData.length ? (
          <BarHorizontal data={presupuestoData} format="moneyCompact" />
        ) : (
          <EmptyState message="Sin plan de presupuesto cargado" />
        )}
      </SectionCard>

      {cxp.notes.length ? (
        <p className="text-xs text-muted-foreground/70">{cxp.notes.join(" ")}</p>
      ) : null}
    </div>
  );
}
