import { AlertTriangle, ClipboardList, Landmark, Percent, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { AutoRefresh } from "@/components/portal/auto-refresh";
import { Donut } from "@/components/portal/charts/donut";
import { VarianceWaterfall } from "@/components/portal/charts/variance-waterfall";
import { AgentRunTrigger } from "@tenants/core/components/agent-run-trigger";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { money, num } from "@tenants/core/lib/format";
import { getCashflowsReport, type CashflowsReport, type VarianceRow } from "@tenants/core/sources/cashflows";

const FLOW_TYPE_LABELS: Record<string, string> = {
  ingreso: "Ingresos",
  costo: "Costos directos",
  gasto: "Gastos operativos",
  financiamiento: "Financiamiento",
  neutral: "Traslados / CXC-CXP",
};

const STATUS_LABELS: Record<VarianceRow["status"], string> = {
  ok: "En rango",
  warning: "Atención",
  breach: "Desviación crítica",
};

const STATUS_DOT: Record<VarianceRow["status"], string> = {
  ok: "bg-emerald-400",
  warning: "bg-amber-400",
  breach: "bg-rose-500",
};

function fmtPct(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(1)}%`;
}

export async function CashflowsDashboardScreen({
  periodMonth,
  project,
}: {
  periodMonth?: string;
  project?: string;
}) {
  let report: CashflowsReport;
  try {
    report = await getCashflowsReport({ periodMonth, project });
  } catch (e) {
    return <ErrorState title="No se pudo leer el agente de Cashflows" detail={errMsg(e)} />;
  }

  const { summary, varianceRows, topVariances, accounts } = report;

  const compositionByFlowType = new Map<string, number>();
  for (const row of varianceRows) {
    if (!row.flowType || row.flowType === "neutral") continue;
    compositionByFlowType.set(row.flowType, (compositionByFlowType.get(row.flowType) ?? 0) + Math.abs(row.actualAmountUsd));
  }
  const compositionData = [...compositionByFlowType.entries()]
    .filter(([, value]) => value > 0)
    .map(([flowType, value]) => ({ name: FLOW_TYPE_LABELS[flowType] ?? flowType, value }));

  const waterfallData = topVariances.map((r) => ({
    name: r.categoryName || r.categoryCode || "—",
    value: r.varianceAmountUsd,
  }));

  const categoryRows = varianceRows.filter((r) => r.categoryCode);

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60_000} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Actuals (Quickbase + banco clasificado) vs. presupuesto (SharePoint) por partida —{" "}
          {summary.project === "ALL" ? "todos los proyectos" : summary.project}.
        </p>
        <p className="text-xs text-muted-foreground/70">
          Periodo: {summary.periodMonth} · se refresca cada minuto
        </p>
      </div>

      <AgentRunTrigger
        agentId="cashflows"
        refreshInputs={{ action: "report_snapshot" }}
        realInputs={{ action: "refresh", dry_run: false }}
        confirmTitle="¿Ejecutar la corrida real de Cashflows?"
        confirmDescription="Volverá a leer Quickbase/SharePoint/banco, escribirá movimientos y plan en la base de datos, y puede enviar alertas de desviación por correo al equipo si se supera el umbral configurado."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Ingresos actuales"
          value={money(summary.totalIncomeUsd)}
          icon={TrendingUp}
          status="green"
          aiExplain={{
            description: "Suma de movimientos bancarios clasificados como ingreso (créditos reconciliados con Recibos de Quickbase) en el periodo/proyecto filtrado.",
            formula: "Σ amount_usd donde amount_usd > 0 y categoría.flow_type = 'ingreso'",
            data: { periodMonth: summary.periodMonth, project: summary.project, totalIncomeUsd: summary.totalIncomeUsd },
          }}
        />
        <KpiCard
          label="Egresos actuales"
          value={money(summary.totalOutflowUsd)}
          icon={TrendingDown}
          status={summary.totalOutflowUsd < 0 ? "amber" : "green"}
          aiExplain={{
            description: "Suma de movimientos bancarios clasificados como costo, gasto o financiamiento (débitos) en el periodo/proyecto filtrado. Excluye traslados/CXC-CXP (categorías neutrales).",
            formula: "Σ amount_usd donde amount_usd < 0 y categoría.flow_type ≠ 'neutral'",
            data: { periodMonth: summary.periodMonth, project: summary.project, totalOutflowUsd: summary.totalOutflowUsd },
          }}
        />
        <KpiCard
          label="Posición neta"
          value={money(summary.netPositionUsd)}
          icon={Wallet}
          status={summary.netPositionUsd >= 0 ? "green" : "red"}
          aiExplain={{
            description: "Caja neta generada en el periodo: todos los movimientos excepto traslados internos/CXC/CXP (categorías neutrales, que no representan entrada o salida real de caja del proyecto).",
            formula: "Σ amount_usd de todos los movimientos con categoría.flow_type ≠ 'neutral'",
            data: { netPositionUsd: summary.netPositionUsd, totalIncomeUsd: summary.totalIncomeUsd, totalOutflowUsd: summary.totalOutflowUsd },
          }}
        />
        <KpiCard
          label="Recuperación de ingresos"
          value={fmtPct(summary.recoveryPct)}
          icon={Percent}
          status={summary.recoveryPct === null ? undefined : summary.recoveryPct >= 95 ? "green" : summary.recoveryPct >= 80 ? "amber" : "red"}
          hint="vs. presupuesto"
          aiExplain={{
            description: "Qué porcentaje del ingreso presupuestado (partidas de tipo ingreso: primas, cuotas, aportes de socios) se recuperó realmente este periodo.",
            formula: "(Σ actual_amount_usd ingreso / Σ planned_amount_usd ingreso) × 100",
            data: { recoveryPct: summary.recoveryPct, periodMonth: summary.periodMonth },
          }}
        />
        <KpiCard
          label="Desviaciones"
          value={num(summary.deviationCount)}
          icon={AlertTriangle}
          status={summary.deviationCount > 0 ? "red" : "green"}
          invertDelta
          hint="categorías fuera de umbral"
          aiExplain={{
            description: "Cantidad de partidas cuya desviación (actual vs. plan) supera el umbral configurado. 'Atención' = 1x umbral, 'Crítica' = 2x umbral.",
            formula: "count(categorías con status ∈ {warning, breach}), donde |variance_pct| ≥ CASHFLOWS_DEVIATION_THRESHOLD_PCT",
            data: { deviationCount: summary.deviationCount, topVariances: topVariances.slice(0, 5) },
          }}
        />
        <KpiCard
          label="Movimientos por revisar"
          value={num(summary.movementsNeedingReview)}
          icon={ClipboardList}
          status={summary.movementsNeedingReview > 0 ? "amber" : "green"}
          hint="clasificación de baja confianza"
          aiExplain={{
            description: "Movimientos bancarios que el motor de reglas (histórico proveedor/detalle) o el clasificador LLM no pudieron asignar a una partida con suficiente confianza, y quedan marcados para revisión manual.",
            formula: "count(movimientos con needs_review = true)",
            data: { movementsNeedingReview: summary.movementsNeedingReview },
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:[&>*]:min-w-0">
        <SectionCard
          title="Top desviaciones por partida"
          description="Diferencia actual − plan, ordenada por magnitud absoluta (USD)"
          aiExplain={{
            kind: "chart",
            description: "Gráfico de cascada: cada barra es la desviación (actual − plan) de una partida, apilada acumulativamente. Verde = favorable, rojo = desfavorable.",
            formula: "variance_amount_usd = actual_amount_usd − planned_amount_usd, por partida, top 8 por |variance_amount_usd|",
            data: waterfallData,
          }}
        >
          {waterfallData.length ? (
            <VarianceWaterfall data={waterfallData} />
          ) : (
            <EmptyState message="Sin desviaciones calculadas" hint="Necesita movimientos y plan cargados para este periodo" />
          )}
        </SectionCard>
        <SectionCard
          title="Composición del flujo actual"
          description="Distribución del monto absoluto movido por tipo de partida"
          aiExplain={{
            kind: "chart",
            description: "Qué proporción del movimiento bancario del periodo corresponde a ingresos, costos directos, gastos operativos o financiamiento (excluye traslados/CXC-CXP).",
            formula: "Σ |actual_amount_usd| agrupado por categoría.flow_type",
            data: compositionData,
          }}
        >
          {compositionData.length ? (
            <Donut data={compositionData} format="moneyCompact" />
          ) : (
            <EmptyState message="Sin movimientos clasificados este periodo" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Plan vs. actual por partida"
        description={`${categoryRows.length} partida(s) con movimiento o plan en este periodo`}
        aiExplain={{
          kind: "table",
          description: "Detalle de cada partida oficial: monto presupuestado, monto real registrado, la diferencia en USD y en %, y el estado de desviación.",
          formula: "variance_pct = ((actual − plan) / |plan|) × 100 · null si no hay plan cargado para esa partida (nunca divide por cero)",
          data: categoryRows.slice(0, 30),
        }}
      >
        {categoryRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4">Partida</th>
                  <th className="py-2 pr-4">Proyecto</th>
                  <th className="py-2 pr-4 text-right">Plan</th>
                  <th className="py-2 pr-4 text-right">Actual</th>
                  <th className="py-2 pr-4 text-right">Variación</th>
                  <th className="py-2 pr-4 text-right">%</th>
                  <th className="py-2 pr-4">Estado</th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map((row, i) => (
                  <tr key={`${row.project}-${row.categoryCode}-${i}`} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4">{row.categoryCode}. {row.categoryName || "—"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{row.project}</td>
                    <td className="py-2 pr-4 text-right">{money(row.plannedAmountUsd)}</td>
                    <td className="py-2 pr-4 text-right">{money(row.actualAmountUsd)}</td>
                    <td className={`py-2 pr-4 text-right ${row.varianceAmountUsd < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                      {money(row.varianceAmountUsd)}
                    </td>
                    <td className="py-2 pr-4 text-right text-muted-foreground">{fmtPct(row.variancePct)}</td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[row.status]}`} />
                        {STATUS_LABELS[row.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Sin partidas para este periodo/proyecto" />
        )}
      </SectionCard>

      <SectionCard
        title="Cuentas fideicomiso"
        description={`${accounts.length} cuenta(s) registradas (Quickbase + workbook de clasificación)`}
        aiExplain={{
          kind: "table",
          description: "Maestro de cuentas bancarias/fideicomiso por proyecto, usado para asociar cada movimiento bancario a su proyecto y para conciliar contra Cuentas Fideicomiso de Quickbase.",
          formula: "Lectura directa de cashflows_accounts (sin cálculo derivado)",
          data: accounts.slice(0, 20),
        }}
      >
        {accounts.length ? (
          <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4">Fideicomiso / Cuenta</th>
                  <th className="py-2 pr-4">Proyecto</th>
                  <th className="py-2 pr-4">Banco</th>
                  <th className="py-2 pr-4">Moneda</th>
                  <th className="py-2 pr-4">Fuente</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a, i) => (
                  <tr key={`${a.accountNumber}-${i}`} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-1.5">
                        <Landmark className="h-3.5 w-3.5 text-muted-foreground/60" />
                        {a.trustName || a.accountNumber}
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{a.project || "—"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{a.bank || "—"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{a.currency || "—"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{a.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Sin cuentas registradas" hint="Corre el backfill inicial o el pipeline de ingestión" />
        )}
      </SectionCard>
    </div>
  );
}
