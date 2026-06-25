import { CalendarRange, CircleDollarSign, Gauge, Target, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

import { ComboSpendReservations } from "@/components/portal/charts/combo";
import { FunnelSimple } from "@/components/portal/charts/funnel";
import { KriCard } from "@tenants/core/components/inteligencia/kri-card";
import { RecommendationCard } from "@tenants/core/components/inteligencia/recommendation-card";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { money, num, pct } from "@tenants/core/lib/format";
import type { InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { loadInteligencia } from "@tenants/core/lib/inteligencia-run";

export async function InteligenciaComandoScreen({ run }: { run: InteligenciaRunType }) {
  const loaded = await loadInteligencia(run);
  if (!loaded.ok) {
    return <ErrorState title="No se pudo leer Inteligencia BI" detail={loaded.error} />;
  }
  const data = loaded.data;

  return (
    <div className="space-y-6">
      <RunSwitch run={run} />
      {data.updatedAt && (
        <p className="text-xs text-muted-foreground">
          Actualizado desde ETL live: {new Date(data.updatedAt).toLocaleString("es-CR")}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard label="Leads analizados" value={num(data.kpis.leads)} icon={Users} />
        <KpiCard label="Calificados" value={num(data.kpis.qualified)} icon={Target} />
        <KpiCard label="Reservas" value={num(data.kpis.reservations)} icon={CalendarRange} />
        <KpiCard label="Inversión pauta" value={money(data.kpis.adSpend, "USD")} icon={CircleDollarSign} />
        <KpiCard label="Show-up rate" value={pct(data.kpis.showUpRate)} hint={`Meta ≥ ${pct(0.6)}`} icon={Gauge} />
        <KpiCard
          label="Forecast reservas"
          value={num(data.kpis.forecastReservationsNextPeriod)}
          hint="Próximo periodo"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Embudo comercial" description="Leads -> calificados -> citas -> reservas">
          {data.funnel.length ? <FunnelSimple data={data.funnel} /> : <EmptyState message="Sin embudo disponible" />}
        </SectionCard>
        <SectionCard title="Inversión vs reservas" description="Diagnóstico de eficiencia por campaña">
          {data.campaigns.length ? (
            <ComboSpendReservations
              data={data.campaigns.map((c) => ({
                name: c.name.length > 18 ? `${c.name.slice(0, 18)}…` : c.name,
                spend: c.spend,
                reservations: c.reservations,
              }))}
              leftFormat="money"
              rightFormat="num"
            />
          ) : (
            <EmptyState message="Sin campañas en el periodo" />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Recomendaciones prescriptivas" description="Qué escalar, pausar o ajustar">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {data.campaigns.map((campaign) => (
            <RecommendationCard
              key={campaign.name}
              action={campaign.action}
              title={campaign.name}
              reason={campaign.reason}
            />
          ))}
        </div>
      </SectionCard>
      <SectionCard title="KRIs operativos" description="Riesgos vivos desde HubSpot + Meta Ads">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          {data.kris.map((kri) => (
            <KriCard key={kri.name} {...kri} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function RunSwitch({ run }: { run: InteligenciaRunType }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Link
        href="/portal/admin/agents/inteligencia?run=weekly"
        className={`rounded-md px-2 py-1 ${run === "weekly" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"}`}
      >
        Weekly
      </Link>
      <Link
        href="/portal/admin/agents/inteligencia?run=monthly"
        className={`rounded-md px-2 py-1 ${run === "monthly" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"}`}
      >
        Monthly
      </Link>
    </div>
  );
}