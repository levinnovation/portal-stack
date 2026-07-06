import { FormEmbed } from "@tenants/core/components/formalizaciones/form-embed";
import { SectionCard } from "@tenants/core/components/section-card";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { errMsg } from "@tenants/core/lib/errors";
import { getFormalizacionesReport, type FormalizacionesReport } from "@tenants/core/sources/formalizaciones";

export async function FormalizacionesFormularioScreen() {
  let report: FormalizacionesReport;
  try {
    report = await getFormalizacionesReport();
  } catch (e) {
    return <ErrorState title="No se pudo leer el agente de Formalizaciones" detail={errMsg(e)} />;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Vista del <strong>formulario seguro de carga</strong> tal como lo ve el cliente al abrir el
        link de su correo. Selecciona un caso para previsualizar (o probar) su formulario: la
        validación de cédula y la subida ocurren contra el agente de Formalizaciones, igual que en
        producción.
      </p>
      <SectionCard
        title="Formulario seguro por caso"
        description="Servido por agent-5 en /f/{token} — link firmado con expiración, validación de cédula y límites de archivo"
      >
        <FormEmbed rows={report.caseRows} />
      </SectionCard>
    </div>
  );
}
