import Link from "next/link";
import { AlertTriangle, Building2, Landmark, Wallet } from "lucide-react";
import { AutoRefresh } from "@/components/portal/auto-refresh";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { money } from "@tenants/core/lib/format";
import { getCashflowsReport, type CashflowsReport } from "@tenants/core/sources/cashflows";

export async function CashflowsProyectosScreen() {
  let report: CashflowsReport;
  try {
    report = await getCashflowsReport({});
  } catch (e) {
    return <ErrorState title="No se pudo leer el agente de Cashflows" detail={errMsg(e)} />;
  }

  const { proyectos } = report;

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60_000} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Vista consolidada por proyecto — selecciona un proyecto para ver Flujo, CxC, CxP, Deuda y
          Cuentas &amp; FX filtrados a ese proyecto.
        </p>
      </div>

      {proyectos.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proyectos.map((p) => (
            <SectionCard
              key={p.project}
              title={p.project}
              action={
                <Link
                  href={`/portal/admin/agents/cashflows/flujo?project=${encodeURIComponent(p.project)}`}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Ver detalle →
                </Link>
              }
              aiExplain={{
                kind: "kpi",
                description: "Resumen consolidado del proyecto: posición neta acumulada, AR abierto, AR vencido y saldo de préstamo de sus fideicomisos.",
                formula: "Cada métrica se filtra por el campo `project` de movimientos/AR/fideicomisos",
                data: p,
              }}
            >
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground/70" />
                  <div>
                    <div className="text-xs text-muted-foreground">Posición neta</div>
                    <div className={p.netPositionUsd >= 0 ? "font-medium text-emerald-400" : "font-medium text-rose-400"}>
                      {money(p.netPositionUsd)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground/70" />
                  <div>
                    <div className="text-xs text-muted-foreground">AR total</div>
                    <div className="font-medium">{money(p.arTotalUsd)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground/70" />
                  <div>
                    <div className="text-xs text-muted-foreground">AR vencido</div>
                    <div className={p.arVencidoUsd > 0 ? "font-medium text-amber-400" : "font-medium"}>{money(p.arVencidoUsd)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-muted-foreground/70" />
                  <div>
                    <div className="text-xs text-muted-foreground">Saldo préstamo</div>
                    <div className="font-medium">{money(p.saldoPrestamoUsd)}</div>
                  </div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      ) : (
        <EmptyState message="Sin proyectos con datos" hint="Corre el pipeline de ingestión primero" />
      )}
    </div>
  );
}
