import { FileDown } from "lucide-react";

import { SectionCard } from "@tenants/core/components/section-card";
import { getInteligenciaData, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";

export async function InteligenciaReportesScreen({ run }: { run: InteligenciaRunType }) {
  const data = await getInteligenciaData(run);
  const pdfUrl = run === "monthly" ? "/api/agents/inteligencia/report" : "";

  return (
    <div className="space-y-6">
      <SectionCard title="Resumen ejecutivo" description={`Periodo: ${data.periodLabel}`}>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {data.recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Descarga de reporte" description="Disponible en ejecución mensual">
        {run === "monthly" ? (
          <a
            href={pdfUrl}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <FileDown className="h-4 w-4" />
            Descargar PDF mensual
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            Cambiá a `run=monthly` para habilitar descarga del reporte.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
