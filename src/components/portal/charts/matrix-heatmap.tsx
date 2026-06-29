"use client";

import { useState } from "react";

import type { SourceHeatmap } from "@tenants/core/sources/inteligencia";

const INTENSITY_STEPS = [
  "bg-secondary/20",
  "bg-primary/15",
  "bg-primary/30",
  "bg-primary/55",
  "bg-primary/80",
];

function intensityClass(value: number, max: number): string {
  if (max <= 0 || value <= 0) return INTENSITY_STEPS[0];
  const step = Math.min(Math.ceil((value / max) * (INTENSITY_STEPS.length - 1)), INTENSITY_STEPS.length - 1);
  return INTENSITY_STEPS[step];
}

export function MatrixHeatmap({
  data,
  height = 260,
}: {
  data: SourceHeatmap;
  height?: number;
}) {
  const [tooltip, setTooltip] = useState<{ source: string; bucket: string; value: number } | null>(null);

  const { sources, buckets, cells } = data;
  if (!sources.length || !buckets.length) return null;

  const cellMap = new Map(cells.map((c) => [`${c.source}|${c.bucket}`, c.value]));
  const maxVal = Math.max(...cells.map((c) => c.value), 1);
  const MAX_COLS = 30;
  const visibleBuckets = buckets.length > MAX_COLS ? buckets.slice(-MAX_COLS) : buckets;
  const showEveryNth = Math.max(1, Math.floor(visibleBuckets.length / 6));

  return (
    <div style={{ height }} className="relative flex flex-col gap-2 overflow-x-auto pb-1">
      <div
        className="grid gap-px text-[10px] text-muted-foreground"
        style={{ gridTemplateColumns: `96px repeat(${visibleBuckets.length}, minmax(12px, 1fr))` }}
      >
        <div />
        {visibleBuckets.map((bkt, i) => (
          <div key={bkt} className="truncate text-center leading-none">
            {i % showEveryNth === 0 ? bkt.slice(5) : ""}
          </div>
        ))}
      </div>
      {sources.map((src) => (
        <div
          key={src}
          className="grid items-center gap-px"
          style={{ gridTemplateColumns: `96px repeat(${visibleBuckets.length}, minmax(12px, 1fr))` }}
        >
          <span className="truncate pr-2 text-right text-[11px] text-muted-foreground" title={src}>
            {src.length > 12 ? `${src.slice(0, 12)}…` : src}
          </span>
          {visibleBuckets.map((bkt) => {
            const val = cellMap.get(`${src}|${bkt}`) ?? 0;
            return (
              <div
                key={bkt}
                onMouseEnter={() => setTooltip({ source: src, bucket: bkt, value: val })}
                onMouseLeave={() => setTooltip(null)}
                className={`h-3 w-full cursor-default rounded-sm transition-opacity hover:opacity-80 ${intensityClass(val, maxVal)}`}
              />
            );
          })}
        </div>
      ))}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>Menos</span>
        {INTENSITY_STEPS.map((cls, i) => (
          <span key={i} className={`inline-block h-3 w-3 rounded-sm ${cls}`} />
        ))}
        <span>Más</span>
      </div>
      {tooltip && (
        <div className="pointer-events-none absolute left-28 top-1 z-10 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-xl">
          <p className="font-semibold">{tooltip.source}</p>
          <p className="text-muted-foreground">{tooltip.bucket}</p>
          <p>
            <span className="font-medium text-foreground">{tooltip.value}</span> leads
          </p>
        </div>
      )}
    </div>
  );
}

