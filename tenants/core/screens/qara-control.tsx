import { ControlPanel } from "@tenants/core/components/qara/control-panel";
import { ScheduleEditor } from "@tenants/core/components/qara/schedule-editor";
import { SectionCard } from "@tenants/core/components/section-card";

export function QaraControlScreen() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Despertá a Qara, seguí el progreso y ajustá su horario — sin tocar la terminal.
      </p>
      <ControlPanel />
      <SectionCard title="Horario del scan automático" description="A qué horas (Costa Rica) Qara busca leads y hace limpieza">
        <ScheduleEditor />
      </SectionCard>
    </div>
  );
}
