"use client";

import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type AiExplainSpec = {
  /** What this element shows, in plain language — rendered instantly, no LLM. */
  description?: string;
  /** The exact calculation, e.g. "actual_usd - planeado_usd" — rendered instantly, no LLM. */
  formula?: string;
  /** "kpi" | "chart" | "table" — only affects the LLM's phrasing. */
  kind?: "kpi" | "chart" | "table";
  /** Serializable snapshot of the current numbers driving this element, sent
   * to the LLM so the interpretation is grounded in what's on screen right
   * now (not a generic canned explanation). Omit if too expensive to compute
   * — the dialog still renders description/formula instantly either way. */
  data?: unknown;
};

/**
 * "Explicar con IA" affordance for any KPI/chart/table: a small sparkle
 * button that opens a dialog showing the static description + formula
 * immediately, then lazily fetches a one-paragraph, data-grounded
 * interpretation from `POST /api/ai/explain` (see
 * `src/lib/ai/explain-metric.ts`) the first time it's opened. Cached in
 * component state for the lifetime of the page — reopening doesn't refetch.
 *
 * Distinct from `<InfoHint>` (a plain hover tooltip with static content):
 * this is click-to-open and always does the LLM interpretation step, so it's
 * reserved for elements that pass a `data` payload worth interpreting.
 */
export function AiExplain({ label, spec, className }: { label: string; spec: AiExplainSpec; className?: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [explanation, setExplanation] = useState("");
  const [errorDetail, setErrorDetail] = useState("");

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && status === "idle") {
      setStatus("loading");
      try {
        const res = await fetch("/api/ai/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label,
            kind: spec.kind ?? "kpi",
            description: spec.description,
            formula: spec.formula,
            data: spec.data,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.detail || body?.error || `Error ${res.status}`);
        setExplanation(String(body?.explanation || ""));
        setStatus("done");
      } catch (e) {
        setErrorDetail(e instanceof Error ? e.message : "Error desconocido");
        setStatus("error");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <button
        type="button"
        aria-label={`Explicar ${label} con IA`}
        onClick={() => handleOpenChange(true)}
        className={cn(
          "inline-flex shrink-0 items-center align-middle text-muted-foreground/60 transition-colors hover:text-accent",
          className,
        )}
      >
        <Sparkles className="h-3.5 w-3.5 cursor-pointer" />
      </button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{label}</DialogTitle>
          {spec.description && <DialogDescription>{spec.description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {spec.formula && (
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Fórmula</div>
              <code className="block rounded-md bg-secondary/60 px-3 py-2 text-xs text-foreground">{spec.formula}</code>
            </div>
          )}

          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Interpretación IA
            </div>
            {status === "loading" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analizando los datos actuales…
              </div>
            )}
            {status === "error" && (
              <div className="flex items-start gap-2 rounded-md border border-dashed border-rose-500/40 bg-rose-500/5 px-3 py-2 text-xs text-rose-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>No se pudo generar la interpretación ({errorDetail || "IA no disponible"}).</span>
              </div>
            )}
            {status === "done" && (
              <p className="leading-relaxed text-foreground">{explanation || "Sin observaciones adicionales."}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
