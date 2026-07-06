import { DollarSign, FileSignature, CalendarClock, Target, Link2 } from "lucide-react";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { BarHorizontal } from "@/components/portal/charts/bar-horizontal";
import { Donut } from "@/components/portal/charts/donut";
import { AreaTrend } from "@/components/portal/charts/area-trend";
import { Histogram } from "@/components/portal/charts/histogram";
import { getLeahData } from "@tenants/core/sources/quickbase";
import { money, dias, pct, num } from "@tenants/core/lib/format";

export async function LeahDashboardScreen() {
  let data: Awaited<ReturnType<typeof getLeahData>>;
  try {
    data = await getLeahData();
  } catch (e) {
    return (
      <ErrorState
        title="No se pudo leer Quickbase"
        detail={e instanceof Error ? e.message : "Error desconocido"}
      />
    );
  }

  const { kpis, conversion, porCanal, porCampaign, porFuenteMonto, porAsesor, porProyecto, diasACierre, tendenciaMonto } = data;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        De dónde vienen las ventas firmadas — fuente, campaña y canal de primer toque.
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Monto atribuido (total)" value={money(kpis.montoTotal)} icon={DollarSign} />
        <KpiCard
          label="Contratos del mes"
          value={num(kpis.contratosMes)}
          icon={FileSignature}
          hint={`${num(kpis.contratosTotal)} en total`}
        />
        <KpiCard
          label="Días a cierre (prom.)"
          value={dias(kpis.avgDiasACierre)}
          icon={CalendarClock}
          hint="primer toque → firma"
        />
        <KpiCard label="% atribuido por Leah" value={pct(kpis.pctAtribuido)} icon={Target} />
        <KpiCard label="% match en HubSpot" value={pct(kpis.pctMatch)} icon={Link2} />
      </div>

      {/* Conversión por fuente */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Tasa de conversión por fuente"
          description="Compradores ÷ leads, por fuente de primer toque"
        >
          {conversion.length ? (
            <BarHorizontal
              data={conversion.map((c) => ({ name: c.firstTouchSource, value: c.conversionRate }))}
              format="pct"
              color="#2dd4bf"
            />
          ) : (
            <EmptyState message="Sin tabla de conversión todavía" hint="La llena Leah al procesar contratos" />
          )}
        </SectionCard>

        <SectionCard title="Leads vs compradores por fuente" description="Volumen del embudo por fuente">
          {conversion.length ? (
            <BarHorizontal
              data={conversion.map((c) => ({ name: c.firstTouchSource, value: c.leads }))}
              format="num"
            />
          ) : (
            <EmptyState message="Sin datos de conversión" />
          )}
        </SectionCard>
      </div>

      {/* Atribución por canal / campaña */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Atribución por canal" description="Contratos por canal de primer toque">
          {porCanal.length ? (
            <Donut data={porCanal} format="num" />
          ) : (
            <EmptyState message="Sin contratos atribuidos" />
          )}
        </SectionCard>

        <SectionCard title="Atribución por campaña" description="Top campañas que cerraron ventas">
          {porCampaign.length ? (
            <BarHorizontal data={porCampaign} format="num" />
          ) : (
            <EmptyState message="Sin campañas atribuidas" />
          )}
        </SectionCard>
      </div>

      {/* Monto por fuente + días a cierre */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Monto por fuente" description="Colones cerrados por fuente de primer toque">
          {porFuenteMonto.length ? (
            <BarHorizontal data={porFuenteMonto} format="money" color="#a78bfa" />
          ) : (
            <EmptyState message="Sin montos todavía" />
          )}
        </SectionCard>

        <SectionCard title="Distribución de días a cierre" description="Cuánto tardan los leads en firmar">
          {diasACierre.some((b) => b.count > 0) ? (
            <Histogram data={diasACierre} color="#fbbf24" />
          ) : (
            <EmptyState message="Sin días a cierre calculados" />
          )}
        </SectionCard>
      </div>

      {/* Atribución por asesor / proyecto */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Contratos por asesor" description="Ventas firmadas cerradas por cada asesor">
          {porAsesor.length ? (
            <BarHorizontal data={porAsesor} format="num" color="#38bdf8" />
          ) : (
            <EmptyState message="Sin contratos atribuidos" />
          )}
        </SectionCard>

        <SectionCard title="Atribución por proyecto" description="Contratos firmados por proyecto">
          {porProyecto.length ? (
            <Donut data={porProyecto} format="num" />
          ) : (
            <EmptyState message="Sin proyecto atribuido" />
          )}
        </SectionCard>
      </div>

      {/* Tendencia de monto */}
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
