"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { ErrorState } from "@/components/portal/error-state";

// Last-resort boundary for unexpected RSC errors (not fetch/config — those use ErrorState in screens).
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
    <div className="space-y-4">
      <ErrorState
        title="Error inesperado en Inteligencia BI"
        detail={
          error.message && !error.message.includes("Server Components render")
            ? error.message
            : "Revisá la consola del servidor o reintentá. Si persiste, contactá soporte."
        }
      />
      {error.digest && (
        <p className="text-center text-[11px] text-muted-foreground/60">ref: {error.digest}</p>
      )}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" /> Reintentar
        </button>
      </div>
    </div>
  );
}
