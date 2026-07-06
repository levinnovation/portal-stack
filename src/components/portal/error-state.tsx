import { AlertTriangle } from "lucide-react";

// El fetch falló (401, 500, timeout, secret faltante). Distinto de EmptyState:
// aquí mostramos el motivo para que el operador de CORE sepa que hay que revisar
// la config/credenciales, no que "no hay leads".
export function ErrorState({
  title = "No se pudo cargar",
  detail,
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-rose-500/40 bg-rose-500/5 text-center">
      <AlertTriangle className="h-5 w-5 text-rose-400" />
      <div className="text-sm font-medium text-rose-300">{title}</div>
      {detail && <div className="max-w-md px-4 text-xs text-rose-400/80">{detail}</div>}
    </div>
  );
}
