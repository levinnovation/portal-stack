import { Target, TrendingUp, Users } from "lucide-react";

import { BarHorizontal } from "@/components/portal/charts/bar-horizontal";
import { ComboBarLine } from "@/components/portal/charts/combo-bar-line";
import { MatrixHeatmap } from "@/components/portal/charts/matrix-heatmap";
import { ScatterEfficiency } from "@/components/portal/charts/scatter";
import { StackedBar } from "@/components/portal/charts/stacked-bar";
import { SegmentLeadsTable } from "@tenants/core/components/inteligencia/segment-leads-table";
import { SegmentSummaryTable } from "@tenants/core/components/inteligencia/evidence-tables";
import { CommandControl } from "@tenants/core/components/inteligencia/command-control";
import { TimeWindowToggle } from "@tenants/core/components/inteligencia/time-window-toggle";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { money, num, pct } from "@tenants/core/lib/format";
import { getInteligenciaDataOrNull, type InteligenciaRunType, type SegmentEnriched } from "@tenants/core/sources/inteligencia";
import { WindowEmptyState } from "@tenants/core/components/inteligencia/window-empty-state";

export async function InteligenciaSegmentosScreen({ run }: { run: InteligenciaRunType }) {
  let data: Awaited<ReturnType<typeof getInteligenciaDataOrNull>>;
  try {
    data = await getInteligenciaDataOrNull(run);
  } catch (err) {
    return <ErrorState title="No se pudo leer Inteligencia BI" detail={String(err)} />;
  }
  if (!data) return <WindowEmptyState title="Inteligencia · Segmentos" subtitle={`Segmentación de leads (${run})`} run={run} />;

  const segments = data.segments ?? [];
  const segmentMatrix = data.segmentSourceMatrix ?? [];

  // Segment summary table columns
  type SegRow = SegmentEnriched & { [key: string]: unknown };
  const matrixKeys = segmentMatrix.length > 0
    ? Object.keys(segmentMatrix[0]).filter((k) => k !== "name" && k !== "total")
    : [];

  const segSummaryData: SegRow[] = segments.map((s) => {
    const matRow = segmentMatrix.find((r) => r.name === s.name) ?? {};
    const extra: Record<string, unknown> = {};
    for (const k of matrixKeys) extra[k] = matRow[k] ?? 0;
    return { ...s, ...extra } as SegRow;
  });

  // Combo bar+line: leads (bar) + qualified rate (line) per segment
  const comboData = segments.map((s) => ({
    name: s.name.length > 14 ? `${s.name.slice(0, 14)}…` : s.name,
    leads: s.leads ?? s.value,
    qualifiedRate: s.qualifiedRate ?? 0,
  }));

  // Bubble scatter: avgScore (x) vs qualifiedRate (y), size = leads
  const scatterData = segments.map((s) => ({
    name: s.name,
    x: s.avgScore ?? 0,
    y: Math.round((s.qualifiedRate ?? 0) * 1000) / 10,
    z: s.leads ?? s.value,
  }));

  // Heatmap from segment_source_matrix (convert to SourceHeatmap shape)
  const heatmapSources = Array.from(new Set(matrixKeys));
  const heatmapSegmentNames = segmentMatrix.map((r) => String(r.name));
  const heatmapCells = heatmapSegmentNames.flatMap((seg) => {
    const row = segmentMatrix.find((r) => r.name === seg) ?? {};
    return heatmapSources.map((src) => ({ source: seg, bucket: src, value: Number(row[src] ?? 0) }));
  });
  const segSourceHeatmap =
    heatmapSources.length > 0 && heatmapSegmentNames.length > 0
      ? { sources: heatmapSegmentNames, buckets: heatmapSources, cells: heatmapCells, bucket_type: "daily" as const }
      : null;

  return (
    <div className="space-y-6">
      <TimeWindowToggle run={run} />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="CPL" value={money(data.kpis.cpl)} icon={Target} hint="Costo por lead" />
        <KpiCard label="CPL calificado" value={money(data.kpis.cpql)} icon={Target} hint="Costo por lead calificado" />
        <KpiCard label="Tasa calificación" value={pct(data.kpis.leadToQualifiedRate)} icon={TrendingUp} />
        <KpiCard label="Leads analizados" value={num(data.kpis.leads)} icon={Users} />
      </div>

      {/* Segmentos con mayor señal — bar horizontal */}
      <SectionCard title="Segmentos con mayor señal de compra" description="Combinaciones de interés priorizadas por score y conversión">
        {segments.length ? (
          <BarHorizontal data={segments.map((s) => ({ name: s.name, value: s.leads ?? s.value }))} format="num" />
        ) : (
          <EmptyState message="Sin segmentos disponibles" />
        )}
      </SectionCard>

      {/* Acciones sobre segmentos — crear audiencias reales en Meta desde cada segmento */}
      {segments.length ? (
        <SectionCard
          title="Acciones sobre segmentos"
          description="Crea una Custom Audience en Meta Ads sembrada desde el segmento — base para campañas y lookalikes"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {segments.slice(0, 9).map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/20 p-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">{num(s.leads ?? s.value)} leads</p>
                </div>
                <CommandControl
                  label="Crear audiencia"
                  target="meta"
                  op="createCustomAudience"
                  payload={{
                    name: `Seg · ${s.name}`.slice(0, 80),
                    description: `Audiencia generada desde el segmento "${s.name}" (${num(s.leads ?? s.value)} leads)`,
                    customerFileSource: "USER_PROVIDED_ONLY",
                  }}
                  description={`Crea una Custom Audience en Meta para el segmento "${s.name}".`}
                  showResult
                />
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {/* Combo: leads + tasa de calificación por segmento */}
      <SectionCard title="Leads vs tasa de calificación por segmento" description="Barras = leads totales · Línea = tasa de calificación (eje derecho)">
        {comboData.length ? (
          <ComboBarLine
            data={comboData}
            barKey="leads"
            lineKey="qualifiedRate"
            barLabel="Leads"
            lineLabel="Tasa calificación"
          />
        ) : (
          <EmptyState message="Sin datos combinados" />
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Stacked bar: fuentes de adquisición por segmento */}
        <SectionCard title="Mix de fuentes por segmento" description="Cómo llega cada tipo de lead — stacked por canal">
          {matrixKeys.length > 0 ? (
            <StackedBar
              data={segmentMatrix.map((r) => ({ ...r, name: String(r.name) }))}
              keys={matrixKeys}
            />
          ) : (
            <EmptyState message="Sin datos de fuentes por segmento" />
          )}
        </SectionCard>

        {/* Bubble scatter: score vs qualified rate */}
        <SectionCard title="Score vs tasa de calificación" description="Tamaño = leads totales · posición = eficiencia del segmento">
          {scatterData.filter((d) => d.x > 0 || d.y > 0).length ? (
            <ScatterEfficiency data={scatterData} />
          ) : (
            <EmptyState message="Sin datos de score para el periodo" />
          )}
        </SectionCard>
      </div>

      {/* Segment × source heatmap */}
      {segSourceHeatmap && (
        <SectionCard title="Mapa de calor segmento × fuente" description="Intensidad de adquisición de cada canal por segmento de interés">
          <MatrixHeatmap data={segSourceHeatmap} height={220} />
        </SectionCard>
      )}

      {/* Resumen por segmento — aggregate table */}
      <SectionCard
        title="Resumen por segmento"
        description="KPIs agregados por segmento de interés — ordenables y exportables"
      >
        {segSummaryData.length ? (
          <SegmentSummaryTable data={segSummaryData} sourceKeys={matrixKeys} run={run} />
        ) : (
          <EmptyState message="Sin datos de segmentos para el período" />
        )}
      </SectionCard>

      {/* Leads por segmento — lead-level grouped table */}
      <SectionCard
        title="Leads por segmento"
        description="Leads individuales agrupados por segmento — temperatura, transición, riesgo revenue y acción"
      >
        <SegmentLeadsTable runType={run} segments={segments} />
      </SectionCard>
    </div>
  );
}
