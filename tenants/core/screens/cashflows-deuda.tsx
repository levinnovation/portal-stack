import { Landmark, PiggyBank, ShieldCheck, TrendingUp } from "lucide-react";
import { AutoRefresh } from "@/components/portal/auto-refresh";
import { AreaTrend } from "@/components/portal/charts/area-trend";
import { BarHorizontal } from "@/components/portal/charts/bar-horizontal";
import { Gauge } from "@/components/portal/charts/gauge";
import { StackedBar } from "@/components/portal/charts/stacked-bar";
import { AgentRunTrigger } from "@tenants/core/components/agent-run-trigger";
import { ProjectFilter } from "@tenants/core/components/cashflows/project-filter";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { fechaCorta, money } from "@tenants/core/lib/format";
import { getCashflowsReport, uniqueProjects, type CashflowsReport } from "@tenants/core/sources/cashflows";

export async function CashflowsDeudaScreen({ project }: { project?: string }) {
  let report: CashflowsReport;
  try {
    report = await getCashflowsReport({ project });
  } catch (e) {
    return <ErrorState title="No se pudo leer el agente de Cashflows" detail={errMsg(e)} />;
  }

  const { deuda } = report;
  const projects = uniqueProjects(report.accounts, report.allProjects);

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60_000} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Fideicomisos de garantía: saldo de préstamo, desembolsos (milestones financieros) y servicio de
          deuda ejecutado (Quickbase).
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
        <KpiCard label="Saldo total de préstamo" value={money(deuda.kpis.saldoTotalPrestamoUsd)} icon={Landmark} />
        <KpiCard label="Excedente de garantía" value={money(deuda.kpis.excedenteGarantiaTotalUsd)} icon={ShieldCheck} status={deuda.kpis.excedenteGarantiaTotalUsd >= 0 ? "green" : "red"} />
        <KpiCard label="Intereses YTD" value={money(deuda.kpis.interesesYtdUsd)} icon={TrendingUp} />
        <KpiCard label="Fideicomisos activos" value={String(deuda.kpis.fideicomisosActivos)} icon={PiggyBank} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:[&>*]:min-w-0">
        {deuda.fideicomisos.slice(0, 3).map((f) => (
          <SectionCard
            key={f.fideicomisoRid}
            title={f.nombre}
            description={`${f.project} · ${f.banco || "—"}`}
            aiExplain={{
              kind: "chart",
              description: "% desembolsado = liberaciones acumuladas / monto inicial del préstamo.",
              formula: "pct_desembolsado = Monto Total Liberaciones / Monto Inicial de Prestamo",
              data: f,
            }}
          >
            {f.pctDesembolsado === null ? (
              <EmptyState message="Sin monto inicial registrado" />
            ) : (
              <Gauge value={f.pctDesembolsado} threshold={1} caption={`${money(f.montoLiberacionesUsd ?? 0)} de ${money(f.montoInicialUsd ?? 0)}`} />
            )}
          </SectionCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:[&>*]:min-w-0">
        <SectionCard
          title="Saldo de préstamo por fideicomiso"
          description="Saldo total pendiente al corte"
          aiExplain={{
            kind: "chart",
            description: "Ranking de fideicomisos por saldo de préstamo pendiente.",
            formula: "Saldo Total de Prestamo por fideicomiso (Quickbase)",
            data: deuda.saldoPorFideicomiso,
          }}
        >
          {deuda.saldoPorFideicomiso.length ? (
            <BarHorizontal data={deuda.saldoPorFideicomiso} format="moneyCompact" />
          ) : (
            <EmptyState message="Sin fideicomisos registrados" />
          )}
        </SectionCard>
        <SectionCard
          title="Desembolsos acumulados"
          description="Línea de crédito utilizada en el tiempo (todos los fideicomisos filtrados)"
          aiExplain={{
            kind: "chart",
            description: "Suma acumulada de los desembolsos (drawdowns) de Fideicomisos Desembolsos, en orden cronológico.",
            formula: "cumulative[i] = cumulative[i-1] + monto_usd del desembolso i",
            data: deuda.desembolsosAcumulados,
          }}
        >
          {deuda.desembolsosAcumulados.length ? (
            <AreaTrend data={deuda.desembolsosAcumulados} label="Desembolsado" />
          ) : (
            <EmptyState message="Sin desembolsos registrados" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Servicio de deuda mensual"
        description="Cuota vs. intereses pagados (Pagos Fideicomisos, ya ejecutado)"
        aiExplain={{
          kind: "chart",
          description: "Barras apiladas de cuota de capital + intereses pagados por mes.",
          formula: "Σ Monto Cuota y Σ Monto Intereses agrupados por mes",
          data: deuda.debtServiceMensual,
        }}
      >
        {deuda.debtServiceMensual.length ? (
          <StackedBar data={deuda.debtServiceMensual} keys={["Cuota", "Intereses"]} moneyFormat />
        ) : (
          <EmptyState message="Sin pagos de servicio de deuda registrados" />
        )}
      </SectionCard>

      <SectionCard
        title="Desembolsos recientes y cobertura de garantía"
        description={`${deuda.desembolsosRecientes.length} desembolso(s) más reciente(s)`}
        aiExplain={{
          kind: "table",
          description: "Últimos drawdowns por fideicomiso, y el detalle de cada fideicomiso con su excedente de garantía.",
          formula: "Lectura directa de Fideicomisos Desembolsos, ordenada por fecha descendente",
          data: { desembolsosRecientes: deuda.desembolsosRecientes, fideicomisos: deuda.fideicomisos },
        }}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Fideicomiso</th>
                  <th className="py-2 pr-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {deuda.desembolsosRecientes.length ? (
                  deuda.desembolsosRecientes.map((d, i) => (
                    <tr key={`${d.fideicomisoRid}-${i}`} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4 text-muted-foreground">{fechaCorta(d.fecha)}</td>
                      <td className="py-2 pr-4">
                        {deuda.fideicomisos.find((f) => f.fideicomisoRid === d.fideicomisoRid)?.nombre ?? d.fideicomisoRid}
                      </td>
                      <td className="py-2 pr-4 text-right">{money(d.montoUsd)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-muted-foreground">
                      Sin desembolsos recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4">Fideicomiso</th>
                  <th className="py-2 pr-4 text-right">Excedente garantía</th>
                  <th className="py-2 pr-4 text-right">% desembolsado</th>
                </tr>
              </thead>
              <tbody>
                {deuda.fideicomisos.map((f) => (
                  <tr key={f.fideicomisoRid} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4">{f.nombre}</td>
                    <td className={`py-2 pr-4 text-right ${(f.excedenteGarantiaUsd ?? 0) < 0 ? "text-rose-400" : ""}`}>
                      {f.excedenteGarantiaUsd === null ? "—" : money(f.excedenteGarantiaUsd)}
                    </td>
                    <td className="py-2 pr-4 text-right">{f.pctDesembolsado === null ? "—" : `${(f.pctDesembolsado * 100).toFixed(1)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      {deuda.notes.length ? (
        <p className="text-xs text-muted-foreground/70">{deuda.notes.join(" ")}</p>
      ) : null}
    </div>
  );
}
