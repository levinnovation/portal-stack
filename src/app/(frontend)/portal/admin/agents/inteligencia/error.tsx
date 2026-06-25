"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function InteligenciaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[inteligencia] render error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-500/10">
        <AlertTriangle className="h-6 w-6 text-rose-400" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Inteligencia BI no disponible</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        No se pudo cargar la analítica en vivo (Agent 13). Esto ocurre si el ETL aún no ha
        generado un snapshot o si el servicio de BI está reiniciando. Las demás secciones no se
        ven afectadas.
      </p>
      {error.digest && (
        <p className="text-[11px] text-muted-foreground/60">ref: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-1 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <RefreshCw className="h-4 w-4" /> Reintentar
      </button>
    </div>
  );
}
