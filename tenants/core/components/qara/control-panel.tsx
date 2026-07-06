"use client";

import { useEffect, useRef, useState } from "react";
import { SectionCard } from "@tenants/core/components/section-card";
import { RunTrigger } from "./run-trigger";
import { LiveStatus } from "./live-status";
import type { QaraRun } from "@tenants/core/lib/qara-run";

const ACTIVE_RUN_POLL_MS = 5000;

// Coordina el trigger y el status en vivo: el contexto del run (trace + tipo + lead)
// que devuelve el trigger se pasa al timeline. Cliente porque comparte estado.
export function ControlPanel() {
  const [run, setRun] = useState<QaraRun | null>(null);
  // El trace_id de un cron run que YA mostramos, para no reabrir el panel si el usuario
  // le dio "Limpiar" — solo reaccionamos a corridas nuevas, no a la misma una y otra vez.
  const lastAutoTraceId = useRef<string | null>(null);

  // Descubre corridas disparadas por el cron (9am/10am/11am), que no vienen de un click en
  // este navegador — sin esto, "Progreso en vivo" solo reacciona al botón "Escanear leads
  // ahora". Solo sondea mientras el panel está inactivo (no pisa un run que ya se está
  // mostrando, manual o auto-detectado).
  useEffect(() => {
    if (run) return;
    let stop = false;
    async function tick() {
      try {
        const res = await fetch("/api/agents/qara/active-run", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.active && data.trace_id && data.trace_id !== lastAutoTraceId.current) {
            lastAutoTraceId.current = data.trace_id;
            setRun({
              traceId: data.trace_id,
              startedAt: data.started_at ?? Date.now(),
              mode: data.mode === "cleanup" ? "cleanup" : "scan",
            });
            return;
          }
        }
      } catch {
        /* reintenta */
      }
      if (!stop) timer = setTimeout(tick, ACTIVE_RUN_POLL_MS);
    }
    let timer = setTimeout(tick, 0);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [run]);

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
