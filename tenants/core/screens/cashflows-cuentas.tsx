import { AutoRefresh } from "@/components/portal/auto-refresh";
import { BarHorizontal } from "@/components/portal/charts/bar-horizontal";
import { Donut } from "@/components/portal/charts/donut";
import { MultiLineTrend } from "@/components/portal/charts/multi-line-trend";
import { StackedBar } from "@/components/portal/charts/stacked-bar";
import { AgentRunTrigger } from "@tenants/core/components/agent-run-trigger";
import { AccountsTable } from "@tenants/core/components/cashflows/accounts-table";
import { ProjectFilter } from "@tenants/core/components/cashflows/project-filter";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { compactMoney } from "@tenants/core/lib/format";
import { getCashflowsReport, uniqueProjects, type CashflowsReport } from "@tenants/core/sources/cashflows";

export async function CashflowsCuentasScreen({ project }: { project?: string }) {
  let report: CashflowsReport;
  try {
    report = await getCashflowsReport({ project });
  } catch (e) {
    return <ErrorState title="No se pudo leer el agente de Cashflows" detail={errMsg(e)} />;
  }

  const { cuentasFx } = report;
  const projects = uniqueProjects(report.accounts);
  const fxSeries = cuentasFx.tipoCambioDiario.length
    ? [{ key: "fx", label: "Tipo de cambio venta (CRC/USD)", data: cuentasFx.tipoCambioDiario.map((p) => ({ t: p.dia, v: p.valor })) }]
    : [];
  const currencyKeys = Array.from(new Set(cuentasFx.mezclaMonedaMensual.flatMap((r) => Object.keys(r).filter((k) => k !== "name"))));

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60_000} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Flujo neto del periodo por banco, moneda, proyecto y cuenta (no saldos de apertura), y el tipo
          de cambio venta diario.
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:[&>*]:min-w-0">
        <SectionCard
          title="Flujo neto por banco"
          aiExplain={{ kind: "chart", description: "Suma de amount_usd agrupado por banco.", formula: "Σ amount_usd por banco", data: cuentasFx.flujoPorBanco }}
        >
          {cuentasFx.flujoPorBanco.length ? <Donut data={cuentasFx.flujoPorBanco} format="moneyCompact" /> : <EmptyState message="Sin movimientos" />}
        </SectionCard>
        <SectionCard
          title="Flujo neto por moneda"
          aiExplain={{ kind: "chart", description: "Suma de amount_usd agrupado por moneda original del movimiento.", formula: "Σ amount_usd por moneda", data: cuentasFx.flujoPorMoneda }}
        >
          {cuentasFx.flujoPorMoneda.length ? <Donut data={cuentasFx.flujoPorMoneda} format="moneyCompact" /> : <EmptyState message="Sin movimientos" />}
        </SectionCard>
        <SectionCard
          title="Flujo neto por proyecto"
          aiExplain={{ kind: "chart", description: "Suma de amount_usd agrupado por proyecto.", formula: "Σ amount_usd por proyecto", data: cuentasFx.flujoPorProyecto }}
        >
          {cuentasFx.flujoPorProyecto.length ? <Donut data={cuentasFx.flujoPorProyecto} format="moneyCompact" /> : <EmptyState message="Sin movimientos" />}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:[&>*]:min-w-0">
        <SectionCard
          title="Flujo neto por cuenta"
          description="Top 15 cuentas bancarias por movimiento absoluto"
          aiExplain={{ kind: "chart", description: "Ranking de cuentas por flujo neto absoluto del periodo.", formula: "Σ amount_usd por número de cuenta, top 15 por |valor|", data: cuentasFx.flujoPorCuenta }}
        >
          {cuentasFx.flujoPorCuenta.length ? (
            <BarHorizontal data={cuentasFx.flujoPorCuenta} format="moneyCompact" />
          ) : (
            <EmptyState message="Sin movimientos" />
          )}
        </SectionCard>
        <SectionCard
          title="Tipo de cambio venta diario"
          description="Últimos 90 días registrados en Quickbase"
          aiExplain={{ kind: "chart", description: "Serie diaria del tipo de cambio de venta CRC/USD.", formula: "Lectura directa de Tipo de Cambio (Quickbase), últimos 90 días", data: cuentasFx.tipoCambioDiario }}
        >
          {fxSeries.length ? <MultiLineTrend series={fxSeries} /> : <EmptyState message="Sin tipo de cambio disponible" />}
        </SectionCard>
      </div>

      <SectionCard
        title="Mezcla CRC vs. USD por mes"
        description="Exposición cambiaria: cuánto del movimiento absoluto fue en cada moneda"
        aiExplain={{ kind: "chart", description: "Composición mensual del movimiento absoluto por moneda.", formula: "Σ |amount_usd| agrupado por (mes, moneda)", data: cuentasFx.mezclaMonedaMensual }}
      >
        {cuentasFx.mezclaMonedaMensual.length ? (
          <StackedBar data={cuentasFx.mezclaMonedaMensual} keys={currencyKeys} tickFormatter={compactMoney} />
        ) : (
          <EmptyState message="Sin movimientos" />
        )}
      </SectionCard>

      <SectionCard
        title="Cuentas fideicomiso"
        description={`${cuentasFx.cuentas.length} cuenta(s) registradas`}
        aiExplain={{ kind: "table", description: "Maestro de cuentas bancarias/fideicomiso por proyecto.", formula: "Lectura directa de cashflows_accounts", data: cuentasFx.cuentas.slice(0, 20) }}
      >
        {cuentasFx.cuentas.length ? (
          <AccountsTable accounts={cuentasFx.cuentas} />
        ) : (
          <EmptyState message="Sin cuentas registradas" />
        )}
      </SectionCard>

      {cuentasFx.notes.length ? (
        <p className="text-xs text-muted-foreground/70">{cuentasFx.notes.join(" ")}</p>
      ) : null}
    </div>
  );
}
