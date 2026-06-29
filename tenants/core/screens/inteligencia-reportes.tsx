import { FileDown } from "lucide-react";

import { SectionCard } from "@tenants/core/components/section-card";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { CustomReport } from "@tenants/core/components/inteligencia/custom-report";
import { getInteligenciaDataOrNull, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { WindowEmptyState } from "@tenants/core/components/inteligencia/window-empty-state";

export async function InteligenciaReportesScreen({ run }: { run: InteligenciaRunType }) {
  let data: Awaited<ReturnType<typeof getInteligenciaDataOrNull>>;
  try {
    data = await getInteligenciaDataOrNull(run);
  } catch (err) {
    return <ErrorState title="No se pudo leer Inteligencia BI" detail={String(err)} />;
  }
  if (!data) return <WindowEmptyState title="Inteligencia · Reportes" subtitle={`Narrativa y entregables (${run})`} run={run} />;

  return (
    <div className="space-y-6">
      <SectionCard title="Resumen ejecutivo" description={`Periodo: ${data.periodLabel}`}>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {data.recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Descarga rápida" description={`Reporte completo del periodo (${run})`}>
        <a
          href={`/api/agents/inteligencia/report?run_type=${run}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          download
        >
          <FileDown className="h-4 w-4" />
          Descargar reporte ({run})
        </a>
      </SectionCard>

      <SectionCard title="Reporte personalizado / seguimiento" description="Elegí secciones y un foco para el seguimiento">
        <CustomReport run={run} />
      </SectionCard>
    </div>
  );
}
