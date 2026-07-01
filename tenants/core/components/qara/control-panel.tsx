"use client";

import { useState } from "react";
import { SectionCard } from "@tenants/core/components/section-card";
import { RunTrigger } from "./run-trigger";
import { LiveStatus } from "./live-status";
import type { QaraRun } from "@tenants/core/lib/qara-run";

// Coordina el trigger y el status en vivo: el contexto del run (trace + tipo + lead)
// que devuelve el trigger se pasa al timeline. Cliente porque comparte estado.
export function ControlPanel() {
  const [run, setRun] = useState<QaraRun | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
      <SectionCard title="Despertar a Qara" description="Corré un scan ahora mismo, sin esperar al cron">
        <RunTrigger onStarted={setRun} hasActiveRun={run !== null} />
      </SectionCard>

      <SectionCard title="Progreso en vivo" description="Qué está haciendo Qara, paso a paso">
        <LiveStatus key={run?.traceId ?? "idle"} run={run} onClear={() => setRun(null)} />
      </SectionCard>
    </div>
  );
}
