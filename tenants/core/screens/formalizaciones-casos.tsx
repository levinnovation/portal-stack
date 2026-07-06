import { AutoRefresh } from "@/components/portal/auto-refresh";
import { CasosTable } from "@tenants/core/components/formalizaciones/casos-table";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { getFormalizacionesReport, type FormalizacionesReport } from "@tenants/core/sources/formalizaciones";

export async function FormalizacionesCasosScreen() {
  let report: FormalizacionesReport;
  try {
    report = await getFormalizacionesReport();
  } catch (e) {
    return <ErrorState title="No se pudo leer el agente de Formalizaciones" detail={errMsg(e)} />;
  }

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60_000} />
      <p className="text-sm text-muted-foreground">
        Cada caso incluye su <strong>link seguro de carga de documentos</strong> (/f/…): compártelo
        con el cliente por el canal que prefieras, o ábrelo para verificar el formulario. El link es
        firmado y expira; el cliente valida su cédula antes de poder subir.
      </p>
      <SectionCard
        title="Casos de formalización"
        description={`Corte ${report.runDate} · el checklist y los docs pendientes vienen de la Librería de Documentos en Quickbase`}
      >
        {report.caseRows.length ? (
          <CasosTable rows={report.caseRows} />
        ) : (
          <EmptyState message="Sin casos activos" hint="Aparecen cuando el cron detecta casos en Entrega de Unidad" />
        )}
      </SectionCard>
    </div>
  );
}
