import { CalendarClock, DollarSign, FileSignature, Link2, Target } from "lucide-react";
import { AreaTrend } from "@tenants/core/components/charts/area-trend";
import { BarHorizontal } from "@tenants/core/components/charts/bar-horizontal";
import { Donut } from "@tenants/core/components/charts/donut";
import { Histogram } from "@tenants/core/components/charts/histogram";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { dias, money, num, pct } from "@tenants/core/lib/format";
import { getLeahData } from "@tenants/core/sources/quickbase";

export async function LeahDashboardScreen() {
  let data: Awaited<ReturnType<typeof getLeahData>>;
  try {
    data = await getLeahData();
  } catch (e) {
    return <ErrorState title="No se pudo leer Quickbase" detail={errMsg(e)} />;
  }

  const { kpis, conversion, porCanal, porCampaign, porFuenteMonto, diasACierre, tendenciaMonto } = data;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        De dónde vienen las ventas firmadas — fuente, campaña y canal de primer toque.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Monto atribuido (total)" value={money(kpis.montoTotal)} icon={DollarSign} />
        <KpiCard label="Contratos del mes" value={num(kpis.contratosMes)} icon={FileSignature} hint={`${num(kpis.contratosTotal)} en total`} />
        <KpiCard label="Días a cierre (prom.)" value={dias(kpis.avgDiasACierre)} icon={CalendarClock} />
        <KpiCard label="% atribuido por Leah" value={pct(kpis.pctAtribuido)} icon={Target} />
        <KpiCard label="% match en HubSpot" value={pct(kpis.pctMatch)} icon={Link2} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Tasa de conversión por fuente" description="Compradores ÷ leads, por fuente de primer toque">
          {conversion.length ? (
            <BarHorizontal
              data={conversion.map((c) => ({ name: c.firstTouchSource, value: c.conversionRate }))}
              format="pct"
              color="hsl(var(--accent))"
            />
          ) : (
            <EmptyState message="Sin tabla de conversión todavía" hint="La llena Leah al procesar contratos" />
          )}
        </SectionCard>
        <SectionCard title="Leads vs compradores por fuente" description="Volumen del embudo por fuente">
          {conversion.length ? (
            <BarHorizontal data={conversion.map((c) => ({ name: c.firstTouchSource, value: c.leads }))} format="num" />
          ) : (
            <EmptyState message="Sin datos de conversión" />
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Atribución por canal" description="Contratos por canal de primer toque">
          {porCanal.length ? <Donut data={porCanal} format="num" /> : <EmptyState message="Sin contratos atribuidos" />}
        </SectionCard>
        <SectionCard title="Atribución por campaña" description="Top campañas que cerraron ventas">
          {porCampaign.length ? <BarHorizontal data={porCampaign} format="num" /> : <EmptyState message="Sin campañas atribuidas" />}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Monto por fuente" description="Colones cerrados por fuente de primer toque">
          {porFuenteMonto.length ? (
            <BarHorizontal data={porFuenteMonto} format="money" color="hsl(var(--primary-glow))" />
          ) : (
            <EmptyState message="Sin montos todavía" />
          )}
        </SectionCard>
        <SectionCard title="Distribución de días a cierre" description="Cuánto tardan los leads en firmar">
          {diasACierre.some((b) => b.count > 0) ? (
            <Histogram data={diasACierre} color="hsl(var(--accent))" />
          ) : (
            <EmptyState message="Sin días a cierre calculados" />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Tendencia de monto firmado" description="Por fecha de firma del contrato">
        {tendenciaMonto.length ? (
          <AreaTrend data={tendenciaMonto} label="Monto firmado" />
        ) : (
          <EmptyState message="Sin contratos firmados todavía" />
        )}
      </SectionCard>
    </div>
  );
}
