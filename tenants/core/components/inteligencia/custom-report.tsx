"use client";

import { useState } from "react";
import { FileDown, SlidersHorizontal } from "lucide-react";
import type { InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { cn } from "@/lib/utils";

const SECTIONS: { id: string; label: string }[] = [
  { id: "resumen", label: "Resumen ejecutivo" },
  { id: "kpis", label: "KPIs" },
  { id: "embudo", label: "Embudo" },
  { id: "campanas", label: "Pauta" },
  { id: "equipo", label: "Equipo" },
  { id: "riesgos", label: "KRIs / riesgos" },
  { id: "prediccion", label: "Predicción" },
];

// Custom follow-up report builder. Picks sections + an optional focus note and
// downloads a composed report from the reconciled snapshot for the active window.
export function CustomReport({ run }: { run: InteligenciaRunType }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(SECTIONS.map((s) => s.id)));
  const [note, setNote] = useState("");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function buildUrl(): string {
    const params = new URLSearchParams({ run_type: run });
    const secs = SECTIONS.filter((s) => selected.has(s.id)).map((s) => s.id);
    if (secs.length && secs.length < SECTIONS.length) params.set("sections", secs.join(","));
    if (note.trim()) params.set("note", note.trim());
    return `/api/agents/inteligencia/report?${params.toString()}`;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Secciones a incluir
      </div>
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              selected.has(s.id)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Foco del seguimiento (opcional): p. ej. 'priorizar campañas con CAC alto y leads sin follow-up'"
        rows={2}
        className="w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm text-foreground"
      />
      <a
        href={buildUrl()}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        download
      >
        <FileDown className="h-4 w-4" />
        Descargar reporte ({run})
      </a>
    </div>
  );
}
