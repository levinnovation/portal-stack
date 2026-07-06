import Link from "next/link";
import { ArrowRight, DollarSign, FileSignature, Flame, Users } from "lucide-react";
import { BarHorizontal } from "@tenants/core/components/charts/bar-horizontal";
import { BarVertical } from "@tenants/core/components/charts/bar-vertical";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { money, num } from "@tenants/core/lib/format";
import { getLeahData } from "@tenants/core/sources/quickbase";
import { getQaraData } from "@tenants/core/sources/hubspot";

export async function AgentsOverviewScreen() {
  const [leahR, qaraR] = await Promise.allSettled([getLeahData(), getQaraData()]);
  const leah = leahR.status === "fulfilled" ? leahR.value : null;
  const qara = qaraR.status === "fulfilled" ? qaraR.value : null;
  const leahErr = leahR.status === "rejected" ? errMsg(leahR.reason) : null;
  const qaraErr = qaraR.status === "rejected" ? errMsg(qaraR.reason) : null;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Salida en vivo de agentes CORE — atribución (Leah / QuickBase) y leads (Qara / HubSpot).
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Monto atribuido (mes)" value={leah ? money(leah.kpis.montoMes) : "—"} icon={DollarSign} hint="Leah" />
        <KpiCard label="Contratos del mes" value={leah ? num(leah.kpis.contratosMes) : "—"} icon={FileSignature} hint="Leah" />
        <KpiCard label="Leads nuevos hoy" value={qara ? num(qara.kpis.nuevosHoy) : "—"} icon={Users} hint="Qara" />
        <KpiCard label="Alta intención (≥8)" value={qara ? num(qara.kpis.altaIntencion) : "—"} icon={Flame} hint="Qara" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Leah · Conversión por fuente"
          description="Tasa de cierre por fuente de primer toque"
          action={<VerMas href="/portal/admin/agents/leah" />}
        >
          {leahErr ? (
            <ErrorState title="No se pudo leer Quickbase" detail={leahErr} />
          ) : leah && leah.conversion.length ? (
            <BarHorizontal
              data={leah.conversion.map((c) => ({ name: c.firstTouchSource, value: c.conversionRate }))}
              format="pct"
              color="hsl(var(--accent))"
            />
          ) : (
            <EmptyState message="Sin datos de conversión todavía" />
          )}
        </SectionCard>

        <SectionCard
          title="Qara · Embudo de leads"
          description="Leads por estado del pipeline"
          action={<VerMas href="/portal/admin/agents/qara" />}
        >
          {qaraErr ? (
            <ErrorState title="No se pudo leer HubSpot" detail={qaraErr} />
          ) : qara && qara.funnel.length ? (
            <BarVertical data={qara.funnel} format="num" />
          ) : (
            <EmptyState message="Sin leads en el embudo" />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Control de Qara" description="Despertá a Qara y seguí el progreso en vivo">
        <Link
          href="/portal/admin/agents/qara/control"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Ir al plano de control <ArrowRight className="h-4 w-4" />
        </Link>
      </SectionCard>
    </div>
  );
}

function VerMas({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
      Ver más <ArrowRight className="h-3 w-3" />
    </Link>
  );
}
