"use client";

import { useSearchParams } from "next/navigation";
import { EtlControl } from "@tenants/core/components/inteligencia/etl-control";
import { ControlPanel } from "@tenants/core/components/qara/control-panel";
import { ScheduleEditor } from "@tenants/core/components/qara/schedule-editor";
import { resolveRun } from "@tenants/core/lib/inteligencia-run";
import type { InteligenciaRunType } from "@tenants/core/sources/inteligencia";

export type AgentControlBlockProps = {
  title?: string;
  subtitle?: string;
  agentId: string;
  showSchedule?: boolean;
};

export function AgentControlBlock({ title, subtitle, agentId, showSchedule = false }: AgentControlBlockProps) {
  const searchParams = useSearchParams();
  const runRaw = searchParams.get("run") ?? undefined;
  const run = resolveRun({ run: runRaw }) as InteligenciaRunType;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      {title ? <h3 className="font-display text-lg">{title}</h3> : null}
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      {agentId === "inteligencia-13" ? (
        <EtlControl run={run} />
      ) : (
        <div className="space-y-4">
          <ControlPanel />
          {showSchedule ? <ScheduleEditor /> : null}
        </div>
      )}
    </div>
  );
}

