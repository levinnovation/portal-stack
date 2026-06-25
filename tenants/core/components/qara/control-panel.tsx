"use client";

import { useState } from "react";
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
        <LiveStatus key={traceId ?? "idle"} traceId={traceId} />
      </SectionCard>
    </div>
  );
}
