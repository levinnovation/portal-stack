import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RootCauseInsight, RootCauseSeverity } from "@tenants/core/lib/root-causes";

const SEVERITY_DOT: Record<RootCauseSeverity, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-400",
  low: "bg-border",
};

const SEVERITY_LABEL: Record<RootCauseSeverity, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export function RootCauseList({
  insights,
  notes = [],
}: {
  insights: RootCauseInsight[];
  /** Terse upstream signals shown as supporting context below the synthesized insights. */
  notes?: string[];
}) {
  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <div key={insight.id} className="rounded-xl border border-border bg-secondary/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", SEVERITY_DOT[insight.severity])} />
              {insight.title}
            </h3>
            <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
              {SEVERITY_LABEL[insight.severity]}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{insight.detail}</p>
          {insight.evidence.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {insight.evidence.map((e, i) => (
                <span
                  key={`${insight.id}-ev-${i}`}
                  className="inline-flex items-baseline gap-1 rounded-md bg-background/60 px-2 py-1 text-xs"
                >
                  <span className="text-muted-foreground">{e.label}:</span>
                  <span className="font-medium text-foreground">{e.value}</span>
                </span>
              ))}
            </div>
          )}
          {insight.recommendation && (
            <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-accent">
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {insight.recommendation}
            </p>
          )}
        </div>
      ))}

      {notes.length > 0 && (
        <div className="rounded-lg border border-dashed border-border px-3 py-2">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Señales del modelo</p>
          <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
