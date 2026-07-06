"use client";

import { Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from "recharts";

import { resolveFormat, type FormatKind } from "@/components/portal/chart-format";
import { TOOLTIP_STYLE } from "./palette";

export function FunnelSimple({
  data,
  format = "num",
  height = 280,
}: {
  data: { name: string; value: number }[];
  format?: FormatKind;
  height?: number;
}) {
  const fmt = resolveFormat(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <FunnelChart>
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [fmt(v as number), ""]} />
        <Funnel dataKey="value" data={data} isAnimationActive fill="hsl(var(--primary))">
          <LabelList
            dataKey="name"
            position="right"
            fill="hsl(var(--muted-foreground))"
            style={{ fontSize: 12 }}
          />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}
