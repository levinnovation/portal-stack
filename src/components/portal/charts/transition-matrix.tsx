"use client";

import { cn } from "@/lib/utils";
import type { TransitionMatrix } from "@tenants/core/sources/inteligencia";

const TEMP_LABELS: Record<string, string> = {
  cold: "Frío",
  warm: "Tibio",
  hot: "Caliente",
};

const TEMP_COLOR: Record<string, string> = {
  cold: "text-sky-400",
  warm: "text-amber-400",
  hot: "text-rose-400",
};

function cellIntensity(value: number, maxVal: number): string {
  if (maxVal === 0 || value === 0) return "bg-muted/20";
  const ratio = value / maxVal;
  if (ratio >= 0.75) return "bg-rose-500/70";
  if (ratio >= 0.5) return "bg-amber-500/60";
  if (ratio >= 0.25) return "bg-amber-400/30";
  if (ratio >= 0.1) return "bg-sky-400/25";
  return "bg-muted/30";
}

export function TransitionMatrixChart({ data, className }: { data: TransitionMatrix; className?: string }) {
  const states = data.states ?? ["cold", "warm", "hot"];
  const maxVal = Math.max(...data.cells.map((c) => c.value), 1);
  const lookup: Record<string, Record<string, number>> = {};
  for (const cell of data.cells) {
    if (!lookup[cell.from]) lookup[cell.from] = {};
    lookup[cell.from][cell.to] = cell.value;
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="min-w-[300px]">
        <div className="mb-1 ml-20 flex">
          <p className="mr-2 self-center text-[10px] text-muted-foreground">→ Destino</p>
          {states.map((to) => (
            <div key={to} className="flex-1 text-center">
              <span className={cn("text-[11px] font-medium", TEMP_COLOR[to])}>{TEMP_LABELS[to] ?? to}</span>
            </div>
          ))}
        </div>
        {states.map((from, ri) => (
          <div key={from} className="mb-1 flex items-center gap-1">
            <div className="w-20 shrink-0 pr-2 text-right">
              {ri === 0 && <span className="mb-0.5 block text-[9px] text-muted-foreground">Origen ↓</span>}
              <span className={cn("text-[11px] font-medium", TEMP_COLOR[from])}>{TEMP_LABELS[from] ?? from}</span>
            </div>
            {states.map((to) => {
              const val = lookup[from]?.[to] ?? 0;
              const isDiag = from === to;
              return (
                <div
                  key={to}
                  className={cn(
                    "flex h-10 flex-1 items-center justify-center rounded text-xs font-semibold transition-colors",
                    cellIntensity(val, maxVal),
                    isDiag && "ring-1 ring-white/10",
                  )}
                  title={`${TEMP_LABELS[from] ?? from} → ${TEMP_LABELS[to] ?? to}: ${val}`}
                >
                  {val > 0 ? val : "–"}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

