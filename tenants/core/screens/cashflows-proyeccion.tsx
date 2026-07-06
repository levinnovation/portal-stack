import { AlarmClockOff, ArrowDownToLine, CalendarClock, TrendingUp } from "lucide-react";
import { AutoRefresh } from "@/components/portal/auto-refresh";
import { ForecastLine } from "@/components/portal/charts/forecast-line";
import { MultiLineTrend } from "@/components/portal/charts/multi-line-trend";
import { StackedBar } from "@/components/portal/charts/stacked-bar";
import { AgentRunTrigger } from "@tenants/core/components/agent-run-trigger";
import { ProjectFilter } from "@tenants/core/components/cashflows/project-filter";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { fechaCorta, money } from "@tenants/core/lib/format";
import {
  getCashflowsReport,
  uniqueProjects,
  type CashflowsReport,
  type ForecastResult,
} from "@tenants/core/sources/cashflows";

function forecastLineData(forecast: ForecastResult) {
  if (!forecast.available) return [];
  const history = forecast.history.map((h) => ({ date: h.date, actual: h.actual }));
  const lastActual = history[history.length - 1];
  const bridge = lastActual ? [{ date: lastActual.date, actual: lastActual.actual, forecast: lastActual.actual }] : [];
  const future = forecast.forecast.map((f) => ({ date: f.date, forecast: f.p50, lower: f.p10, upper: f.p90 }));
  return [...history, ...bridge, ...future];
}

export async function CashflowsProyeccionScreen({ project }: { project?: string }) {
  let report: CashflowsReport;
  try {
    report = await getCashflowsReport({ project });
  } catch (e) {
    return <ErrorState title="No se pudo leer el agente de Cashflows" detail={errMsg(e)} />;
  }

  const { summary, proyeccion } = report;
  const projects = uniqueProjects(report.accounts);

  const weeklyBars = proyeccion.weeks.map((w) => ({
    name: `S${w.week}`,
    "Entradas (ponderadas por riesgo)": w.inflowRiskWeightedUsd,
    Salidas: -w.outflowUsd,
  }));

  const cumulativeSeries = [
    {
      key: "p50",
      label: "Caja acumulada — nominal (P50)",
      data: proyeccion.weeks.map((w) => ({ t: `S${w.week}`, v: w.cumulativeP50Usd })),
    },
    {
      key: "p10",
      label: "Caja acumulada — ponderada por riesgo (P10)",
      data: proyeccion.weeks.map((w) => ({ t: `S${w.week}`, v: w.cumulativeP10Usd })),
    },
  ];

  const upcoming = [...report.cxc.priorityList]
    .filter((r) => r.fechaEstimada)
    .sort((a, b) => (a.fechaEstimada ?? "").localeCompare(b.fechaEstimada ?? ""))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60_000} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Proyección de liquidez a 13 semanas (entradas plan ponderadas por riesgo de atraso de pago,
          menos salidas al ritmo actual) y forecast de neto/ingresos a 6 meses.
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
        <KpiCard
          label="Runway (P10)"
          value={proyeccion.runwayWeeksP10 === null ? "13+ semanas" : `${proyeccion.runwayWeeksP10} semanas`}
          icon={AlarmClockOff}
          status={proyeccion.runwayWeeksP10 !== null && proyeccion.runwayWeeksP10 <= 6 ? "red" : proyeccion.runwayWeeksP10 !== null ? "amber" : "green"}
          hint="primera semana donde la curva ponderada por riesgo cruza cero"
        />
        <KpiCard label="Caja inicial" value={money(proyeccion.startingCashUsd)} icon={ArrowDownToLine} />
        <KpiCard label="Salida semanal promedio" value={money(proyeccion.avgWeeklyOutflowUsd)} icon={CalendarClock} hint="trailing 3 meses ÷ 4.33" />
        <KpiCard
          label="Forecast neto 3m (P50)"
          value={summary.forecastNet3mP50 === null ? "—" : money(summary.forecastNet3mP50)}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:[&>*]:min-w-0">
        <SectionCard
          title="Entradas vs. salidas — 13 semanas"
          description="Entradas ponderadas por riesgo de atraso (por bucket de antigüedad) vs. salida plana estimada"
          aiExplain={{
            kind: "chart",
            description: "Barras semanales: entradas de cobranza esperada (ya descontadas por probabilidad de atraso) contra la salida semanal estimada.",
            formula: "inflow_risk_weighted = Σ saldo_usd × (1 − risk_weight(aging_bucket)) por semana de fecha_estimada",
            data: weeklyBars,
          }}
        >
          {weeklyBars.length ? (
            <StackedBar data={weeklyBars} keys={["Entradas (ponderadas por riesgo)", "Salidas"]} moneyFormat />
          ) : (
            <EmptyState message="Sin cartera abierta ni movimiento para proyectar" />
          )}
        </SectionCard>
        <SectionCard
          title="Curva de caja proyectada (13 semanas)"
          description="Acumulado nominal (P50) vs. ponderado por riesgo (P10) — el runway es donde la P10 cruza cero"
          aiExplain={{
            kind: "chart",
            description: "Dos curvas acumuladas semana a semana partiendo de la caja inicial: la nominal usa el saldo pleno, la ponderada descuenta por riesgo de atraso.",
            formula: "cumulative[w] = cumulative[w-1] + inflow[w] − outflow[w]",
            data: cumulativeSeries,
          }}
        >
          {proyeccion.weeks.length ? (
            <MultiLineTrend series={cumulativeSeries} />
          ) : (
            <EmptyState message="Sin datos para proyectar" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Forecast neto — 6 meses"
        description={
          proyeccion.forecast6m.available
            ? `Modelo: ${proyeccion.forecast6m.model} · ${proyeccion.forecast6m.trainPoints} meses de historia`
            : "Necesita al menos 12 meses de historia mensual"
        }
        aiExplain={{
          kind: "chart",
          description: "Tendencia lineal + componente estacional (si hay ≥24 meses de historia) sobre el neto mensual, con banda P10/P90 que crece con la raíz del horizonte.",
          formula: "p50 = slope × t + intercept + estacional[mes]; banda = residual_std × √h × 1.2816",
          data: proyeccion.forecast6m,
        }}
      >
        {proyeccion.forecast6m.available ? (
          <ForecastLine data={forecastLineData(proyeccion.forecast6m)} format="moneyCompact" />
        ) : (
          <EmptyState message="Sin suficiente historia para forecast" hint="Se necesitan 12+ meses de movimientos" />
        )}
      </SectionCard>

      <SectionCard
        title="Próximos vencimientos"
        description={`${upcoming.length} cuota(s) próxima(s) por fecha estimada, con probabilidad de atraso`}
        aiExplain={{
          kind: "table",
          description: "Cuotas abiertas de Pagos (Quickbase) ordenadas por fecha estimada más próxima, con el peso de riesgo de atraso asignado por su bucket de antigüedad actual.",
          formula: "risk_weight por aging_bucket: corriente=0.05, 1-30=0.15, 31-60=0.35, 61-90=0.55, 90+=0.85",
          data: upcoming,
        }}
      >
        {upcoming.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4">Cliente</th>
                  <th className="py-2 pr-4">Proyecto / Unidad</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4 text-right">Saldo</th>
                  <th className="py-2 pr-4">Fecha estimada</th>
                  <th className="py-2 pr-4 text-right">Prob. atraso</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((r, i) => (
                  <tr key={`${r.pagoRid}-${i}`} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4">{r.cliente}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{r.project} / {r.unidad || "—"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{r.tipoPago || "—"}</td>
                    <td className="py-2 pr-4 text-right">{money(r.saldoUsd)}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{fechaCorta(r.fechaEstimada)}</td>
                    <td className="py-2 pr-4 text-right">{(r.riskWeight * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Sin cuotas con fecha estimada" />
        )}
      </SectionCard>
    </div>
  );
}
