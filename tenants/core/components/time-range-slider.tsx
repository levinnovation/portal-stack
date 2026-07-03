"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { TIME_RANGE_PRESETS, type TimeRangePreset } from "@tenants/core/lib/time-range";

const DAY_MS = 24 * 60 * 60 * 1000;

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("es-CR", { year: "numeric", month: "short", day: "2-digit" });
}

/**
 * Preset buttons (7d/30d/90d/6m/1y/Todo) + a draggable dual-thumb range
 * slider that drives `?from=&to=` (ISO 8601) on the current page — used by
 * historical BI screens reading a worker's append-only snapshot history
 * (Formalizaciones `/api/v1/snapshots/history`, Eyal `serve_report_snapshot`).
 */
export function TimeRangeSlider({
  minTs,
  maxTs = Date.now(),
  className,
}: {
  /** Earliest snapshot timestamp available (epoch ms) — the slider's left bound. */
  minTs: number;
  /** Right bound, defaults to now. */
  maxTs?: number;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const lowerBound = Math.min(minTs, maxTs - DAY_MS);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const activePreset = searchParams.get("preset") as TimeRangePreset | null;

  const initialRange = useMemo<[number, number]>(() => {
    const parsedFrom = fromParam ? new Date(fromParam).getTime() : NaN;
    const parsedTo = toParam ? new Date(toParam).getTime() : NaN;
    return [
      Number.isFinite(parsedFrom) ? Math.max(lowerBound, parsedFrom) : lowerBound,
      Number.isFinite(parsedTo) ? Math.min(maxTs, parsedTo) : maxTs,
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [range, setRange] = useState<[number, number]>(initialRange);

  function pushRange(next: [number, number]) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", new Date(next[0]).toISOString());
    params.set("to", new Date(next[1]).toISOString());
    params.delete("preset");
    router.push(`${pathname}?${params.toString()}`);
  }

  function selectPreset(preset: TimeRangePreset) {
    const config = TIME_RANGE_PRESETS.find((p) => p.value === preset);
    if (!config) return;
    const to = maxTs;
    const from = config.days === null ? lowerBound : Math.max(lowerBound, to - config.days * DAY_MS);
    setRange([from, to]);
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", preset);
    params.delete("from");
    params.delete("to");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={cn("space-y-3 rounded-lg border border-border bg-secondary/30 p-3", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {TIME_RANGE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => selectPreset(preset.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              activePreset === preset.value
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="px-1 pt-1">
        <Slider
          min={lowerBound}
          max={maxTs}
          step={DAY_MS}
          value={range}
          onValueChange={(next) => setRange(next as [number, number])}
          onValueCommit={(next) => pushRange(next as [number, number])}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{fmtDate(range[0])}</span>
        <span>{fmtDate(range[1])}</span>
      </div>
    </div>
  );
}
