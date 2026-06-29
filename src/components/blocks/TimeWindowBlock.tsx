"use client";

import { useSearchParams } from "next/navigation";
import { TimeWindowToggle } from "@tenants/core/components/inteligencia/time-window-toggle";
import { type InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { resolveRun } from "@tenants/core/lib/inteligencia-run";

export type TimeWindowBlockProps = {
  title?: string;
  subtitle?: string;
};

export function TimeWindowBlock({ title, subtitle }: TimeWindowBlockProps) {
  const searchParams = useSearchParams();
  const runRaw = searchParams.get("run") ?? undefined;
  const run = resolveRun({ run: runRaw }) as InteligenciaRunType;
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      {title ? <h3 className="font-display text-lg">{title}</h3> : null}
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      <TimeWindowToggle run={run} />
    </div>
  );
}

