"use client";

import { Fragment } from "react";
import { colorAt } from "./palette";

export function Heatmap({
  data,
}: {
  data: { x: string; y: string; value: number }[];
}) {
  const xs = Array.from(new Set(data.map((d) => d.x)));
  const ys = Array.from(new Set(data.map((d) => d.y)));
  const max = Math.max(...data.map((d) => d.value), 1);
  const lookup = new Map(data.map((d) => [`${d.x}:${d.y}`, d.value]));

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-1 text-xs" style={{ gridTemplateColumns: `120px repeat(${xs.length}, minmax(72px, 1fr))` }}>
        <div />
        {xs.map((x) => (
          <div key={x} className="px-2 py-1 text-center text-muted-foreground">{x}</div>
        ))}
        {ys.map((y, rowIndex) => (
          <Fragment key={y}>
            <div className="px-2 py-2 text-muted-foreground">{y}</div>
            {xs.map((x) => {
              const value = lookup.get(`${x}:${y}`) ?? 0;
              const opacity = 0.18 + (value / max) * 0.72;
              return (
                <div
                  key={`${x}-${y}`}
                  className="rounded-md px-2 py-2 text-center text-foreground"
                  style={{ backgroundColor: `${colorAt(rowIndex)}${Math.round(opacity * 255).toString(16).padStart(2, "0")}` }}
                >
                  {value}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
