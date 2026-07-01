"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { SectionCard } from "@tenants/core/components/section-card";
import { RunTrigger } from "./run-trigger";
import { LiveStatus } from "./live-status";

// Coordina el trigger y el status en vivo: el trace_id que devuelve el run se pasa
// al timeline. Cliente porque comparte estado entre ambos.
export function ControlPanel() {
  const [traceId, setTraceId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
      <SectionCard title="Despertar a Qara" description="Corré un scan ahora mismo, sin esperar al cron">
        <RunTrigger onStarted={setTraceId} />
      </SectionCard>

      <SectionCard title="Progreso en vivo" description="Qué está haciendo Qara, paso a paso">
        {/* Limpiar disponible siempre que haya un run activo: resetea el panel sin
            recargar toda la pantalla. */}
        {traceId && (
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => setTraceId(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </button>
          </div>
        )}
        <LiveStatus key={traceId ?? "idle"} traceId={traceId} />
      </SectionCard>
    </div>
  );
}
