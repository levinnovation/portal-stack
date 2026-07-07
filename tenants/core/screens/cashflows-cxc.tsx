import { AlertTriangle, Clock, PieChart, Receipt, ShieldAlert } from "lucide-react";
import { AutoRefresh } from "@/components/portal/auto-refresh";
import { ComboBarLine } from "@/components/portal/charts/combo-bar-line";
import { Donut } from "@/components/portal/charts/donut";
import { ParetoChart } from "@/components/portal/charts/pareto";
import { StackedBar } from "@/components/portal/charts/stacked-bar";
import { AgentRunTrigger } from "@tenants/core/components/agent-run-trigger";
import { ProjectFilter } from "@tenants/core/components/cashflows/project-filter";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { dias, money } from "@tenants/core/lib/format";
import { getCashflowsReport, uniqueProjects, type CashflowsReport } from "@tenants/core/sources/cashflows";

const AGING_ORDER = ["corriente", "1-30", "31-60", "61-90", "90+", "sin_fecha"];
const AGING_LABEL: Record<string, string> = {
  corriente: "Corriente",
  "1-30": "1-30 días",
  "31-60": "31-60 días",
  "61-90": "61-90 días",
  "90+": "90+ días",
  sin_fecha: "Sin fecha",
};

function withAgingLabels(rows: Record<string, string | number>[]) {
  return rows.map((r) => {
    const out: Record<string, string | number> = { name: r.name };
    for (const bucket of AGING_ORDER) out[AGING_LABEL[bucket]] = r[bucket] ?? 0;
    return out;
  });
}

function fmtPct(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(1)}%`;
}

export async function CashflowsCxcScreen({ project }: { project?: string }) {
  let report: CashflowsReport;
  try {
    report = await getCashflowsReport({ project });
  } catch (e) {
    return <ErrorState title="No se pudo leer el agente de Cashflows" detail={errMsg(e)} />;
  }

  const { summary, cxc } = report;
  const projects = uniqueProjects(report.accounts, report.allProjects);
  const agingByProject = withAgingLabels(cxc.agingByProject);
  const agingByTipoPago = withAgingLabels(cxc.agingByTipoPago);
  const agingKeys = AGING_ORDER.map((b) => AGING_LABEL[b]);

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60_000} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Cartera abierta (Pagos plan pendiente, Quickbase): aging, concentración y priorización de
          cobro ponderada por probabilidad de atraso.
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="AR total"
          value={money(cxc.kpis.arTotalUsd)}
          icon={Receipt}
          aiExplain={{
            description: "Saldo abierto total de cuotas de Pagos (Quickbase) en el periodo/proyecto filtrado — cartera pendiente de cobro.",
            formula: "Σ saldo_usd de todas las cuotas abiertas",
            data: { arTotalUsd: cxc.kpis.arTotalUsd, openLines: cxc.kpis.openLines },
          }}
        />
        <KpiCard
          label="AR vencido"
          value={money(cxc.kpis.arVencidoUsd)}
          icon={AlertTriangle}
          status={cxc.kpis.arVencidoUsd > 0 ? "amber" : "green"}
          hint={fmtPct(cxc.kpis.arVencidoPct)}
          aiExplain={{
            description: "Cuánto del AR abierto ya pasó su fecha estimada de cobro (cualquier bucket de antigüedad distinto de 'corriente').",
            formula: "ar_vencido = Σ saldo_usd donde aging_bucket ≠ 'corriente'; ar_vencido_pct = ar_vencido / ar_total × 100",
            data: { arVencidoUsd: cxc.kpis.arVencidoUsd, arVencidoPct: cxc.kpis.arVencidoPct, arTotalUsd: cxc.kpis.arTotalUsd },
          }}
        />
        <KpiCard
          label="AR vencido 90+"
          value={money(cxc.kpis.arVencido90Usd)}
          icon={ShieldAlert}
          status={cxc.kpis.arVencido90Usd > 0 ? "red" : "green"}
          aiExplain={{
            description: "Cartera con más de 90 días de atraso — el tramo de mayor riesgo de incobrabilidad.",
            formula: "Σ saldo_usd donde aging_bucket = '90+'",
            data: { arVencido90Usd: cxc.kpis.arVencido90Usd, arTotalUsd: cxc.kpis.arTotalUsd },
          }}
        />
        <KpiCard
          label="AR ponderado por riesgo"
          value={money(summary.arRiskWeightedUsd)}
          icon={ShieldAlert}
          hint="cobro esperado tras descuento de riesgo"
          aiExplain={{
            description: "Estimado de cobro esperado descontando la probabilidad de atraso de cada cuota según su bucket de antigüedad (más conservador que el AR nominal).",
            formula: "Σ saldo_usd × (1 − risk_weight(aging_bucket)); risk_weight: corriente=0.05, 1-30=0.15, 31-60=0.35, 61-90=0.55, 90+=0.85",
            data: { arRiskWeightedUsd: summary.arRiskWeightedUsd, arTotalUsd: cxc.kpis.arTotalUsd },
          }}
        />
        <KpiCard
          label="DSO aprox."
          value={cxc.dsoDays === null ? "—" : dias(cxc.dsoDays)}
          icon={Clock}
          aiExplain={{
            description: "Days Sales Outstanding aproximado: cuántos días de facturación planificada representa el AR abierto actual, usando el plan de pagos de ingresos como proxy de facturación mensual (no existe un monto de 'venta reconocida' mensual separado en Quickbase).",
            formula: "dso_days = ar_total_usd / (promedio del plan de pagos de ingreso, últimos 6 meses) × 30",
            data: { dsoDays: cxc.dsoDays, arTotalUsd: cxc.kpis.arTotalUsd },
          }}
        />
        <KpiCard
          label="Concentración (HHI)"
          value={cxc.kpis.hhi === null ? "—" : String(cxc.kpis.hhi)}
          icon={PieChart}
          status={cxc.kpis.hhi !== null && cxc.kpis.hhi > 2500 ? "amber" : "green"}
          hint={`${cxc.kpis.openLines} cuotas abiertas`}
          aiExplain={{
            description: "Índice Herfindahl-Hirschman sobre el saldo abierto por cliente (agregando todas sus negociaciones): mide qué tan concentrada está la cartera en pocos clientes. >2500 alta concentración, 1500-2500 moderada, <1500 diversificada.",
            formula: "HHI = Σ (saldo_cliente / saldo_total)² × 10000",
            data: { hhi: cxc.kpis.hhi, openLines: cxc.kpis.openLines },
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:[&>*]:min-w-0">
        <SectionCard
          title="Aging por proyecto"
          description="Saldo abierto por bucket de antigüedad, agrupado por proyecto"
          aiExplain={{
            kind: "chart",
            description: "Barras apiladas: cuánto saldo de AR abierto hay en cada bucket de antigüedad, por proyecto.",
            formula: "aging_bucket recomputado desde fecha_estimada de Pagos (no del campo nativo de Quickbase)",
            data: agingByProject,
          }}
        >
          {agingByProject.length ? (
            <StackedBar data={agingByProject} keys={agingKeys} moneyFormat />
          ) : (
            <EmptyState message="Sin cartera abierta" />
          )}
        </SectionCard>
        <SectionCard
          title="Aging por tipo de pago"
          description="Reserva / prima / mensualidad — qué tramo de la cartera está más atrasado"
          aiExplain={{
            kind: "chart",
            description: "Mismo aging, agrupado por tipo de pago en vez de proyecto.",
            formula: "Σ saldo_usd agrupado por (tipo_pago, aging_bucket)",
            data: agingByTipoPago,
          }}
        >
          {agingByTipoPago.length ? (
            <StackedBar data={agingByTipoPago} keys={agingKeys} moneyFormat />
          ) : (
            <EmptyState message="Sin cartera abierta" />
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:[&>*]:min-w-0">
        <SectionCard
          title="Top deudores (Pareto)"
          description="Clientes por saldo abierto, con % acumulado"
          aiExplain={{
            kind: "chart",
            description:
              "Barras de saldo por cliente (agregando todas sus negociaciones/unidades) ordenadas de mayor a menor, línea de % acumulado sobre el total de AR. 'Otros' agrupa a los clientes fuera del top-15 más la cartera sin cliente identificado (nombre vacío o '—') — nunca aparece como un deudor con nombre propio.",
            formula: "cumulative[i] = Σ saldo[0..i] / (Σ saldo top-N + saldo sin cliente identificado)",
            data: cxc.paretoClientes,
          }}
        >
          {cxc.paretoClientes.length ? (
            <ParetoChart data={cxc.paretoClientes} />
          ) : (
            <EmptyState message="Sin cartera abierta" />
          )}
        </SectionCard>
        <SectionCard
          title="Concentración top-5 clientes"
          description="Qué % del AR total está en los 5 clientes más grandes"
          aiExplain={{
            kind: "chart",
            description:
              "Los 5 clientes (por nombre real, agregando todas sus negociaciones) con mayor saldo abierto vs. el resto de la cartera. 'Otros' incluye tanto a los clientes fuera del top-5 como a la cartera sin cliente identificado.",
            formula: "top5 = 5 clientes por saldo_usd descendente (agregado por cliente); Otros = AR total − Σ top5",
            data: cxc.concentracionTop5,
          }}
        >
          {cxc.concentracionTop5.length ? (
            <Donut data={cxc.concentracionTop5} format="moneyCompact" />
          ) : (
            <EmptyState message="Sin cartera abierta" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Plan de pagos vs. recibos — recuperación mensual"
        description="Recibos cobrados por mes (ingresos reales del agente) vs. % de recuperación sobre el plan de pagos (Pagos, Quickbase)"
        aiExplain={{
          kind: "chart",
          description:
            "Barra: total de recibos de ingreso cobrados en el mes (movimientos reales del agente, fuente Recibos de Quickbase). Línea: % de lo planificado en el plan de pagos de ingresos (Pagos, Quickbase) que efectivamente se cobró. Ya no usa la tabla 'Flujo de Cajas' de Quickbase, que está abandonada para los periodos actuales (plan y recibos en null desde 2023).",
          formula: "recuperacion_pct = (Σ recibos de ingreso del mes / Σ plan de pagos de ingreso del mes) × 100, por mes",
          data: cxc.recuperacion,
        }}
      >
        {cxc.recuperacion.length ? (
          <ComboBarLine
            data={cxc.recuperacion.map((r) => ({ name: r.name, recibos: r.recibos, recuperacion_pct: (r.recuperacionPct ?? 0) / 100 }))}
            barKey="recibos"
            lineKey="recuperacion_pct"
            barLabel="Recibos"
            lineLabel="% Recuperación"
            leftMoneyFormat
          />
        ) : (
          <EmptyState message="Sin recibos o plan de pagos registrados en este periodo" />
        )}
      </SectionCard>

      <SectionCard
        title="Lista de prioridad de cobro"
        description={`${cxc.priorityList.length} cuota(s) rankeadas por saldo en riesgo (saldo × probabilidad de atraso)`}
        aiExplain={{
          kind: "table",
          description: "Cuotas abiertas ordenadas por el USD en mayor riesgo de atraso — combina monto y probabilidad de atraso por bucket de antigüedad.",
          formula: "priority_score = saldo_usd × risk_weight(aging_bucket)",
          data: cxc.priorityList.slice(0, 25),
        }}
      >
        {cxc.priorityList.length ? (
          <div className="max-h-[420px] overflow-y-auto overflow-x-auto" data-scroll-container>
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4">Cliente</th>
                  <th className="py-2 pr-4">Proyecto / Unidad</th>
                  <th className="py-2 pr-4">Antigüedad</th>
                  <th className="py-2 pr-4 text-right">Saldo</th>
                  <th className="py-2 pr-4 text-right">Prob. atraso</th>
                  <th className="py-2 pr-4 text-right">Score de riesgo</th>
                </tr>
              </thead>
              <tbody>
                {cxc.priorityList.map((r, i) => (
                  <tr key={`${r.pagoRid}-${i}`} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4">{r.cliente}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{r.project} / {r.unidad || "—"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{AGING_LABEL[r.agingBucket] ?? r.agingBucket}</td>
                    <td className="py-2 pr-4 text-right">{money(r.saldoUsd)}</td>
                    <td className="py-2 pr-4 text-right">{(r.riskWeight * 100).toFixed(0)}%</td>
                    <td className="py-2 pr-4 text-right font-medium">{money(r.priorityScore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Sin cartera abierta para priorizar" />
        )}
      </SectionCard>

      {cxc.notes.length ? (
        <p className="text-xs text-muted-foreground/70">{cxc.notes.join(" ")}</p>
      ) : null}
    </div>
  );
}
