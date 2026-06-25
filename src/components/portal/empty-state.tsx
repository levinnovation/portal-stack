import { Inbox } from "lucide-react";

// Vacío legítimo: la fuente respondió OK pero no hay filas (ej. aún no hay contratos
// este mes). NO confundir con error-state (el fetch falló). Un 401 NO es "sin datos".
export function EmptyState({
  message = "Sin datos todavía",
  hint,
}: {
  message?: string;
  hint?: string;
}) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-center">
      <Inbox className="h-5 w-5 text-muted-foreground/60" />
      <div className="text-sm text-muted-foreground">{message}</div>
      {hint && <div className="text-xs text-muted-foreground/70">{hint}</div>}
    </div>
  );
}
