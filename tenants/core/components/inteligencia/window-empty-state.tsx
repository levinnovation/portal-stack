import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { TimeWindowToggle } from "@tenants/core/components/inteligencia/time-window-toggle";
import { RUN_TYPE_OPTIONS } from "@tenants/core/lib/inteligencia-run";
import type { InteligenciaRunType } from "@tenants/core/sources/inteligencia";

/**
 * Shared empty state for Inteligencia sub-pages when the selected time window has
 * no silver snapshot yet (API 404). Each window (7d/1m/3m/6m/12m/full) is its own
 * on-demand snapshot, so an absent window is an expected empty state — not an
 * outage. Keeps the TimeWindowToggle visible so the user can switch windows or go
 * back to Comando to trigger the ETL, instead of tripping the error boundary.
 */
export function WindowEmptyState({
  title,
  subtitle,
  run,
}: {
  title: string;
  subtitle?: string;
  run: InteligenciaRunType;
}) {
  const windowLabel = RUN_TYPE_OPTIONS.find((o) => o.value === run)?.label ?? run;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-lg text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <TimeWindowToggle run={run} />
      <SectionCard
        title={`Sin snapshot para "${windowLabel}"`}
        description="Cada ventana es un snapshot independiente del silver layer y se genera bajo demanda."
      >
        <EmptyState message='Esta ventana aún no tiene datos reconciliados. Volvé a "Comando" y usá "Actualizar datos" para generar el snapshot de este periodo, o elegí otra ventana.' />
      </SectionCard>
    </div>
  );
}
