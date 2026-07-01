"use client";

import { CartesianGrid, LabelList, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

import { resolveFormat, type FormatKind } from "@/components/portal/chart-format";
import { TOOLTIP_STYLE } from "./palette";

export function ScatterEfficiency({
  data,
  height = 280,
  xName = "Costo/Lead calificado",
  yName = "Costo/Reserva",
  zName = "Tamaño",
  xFormat = "num",
  yFormat = "num",
  showLabels = false,
}: {
  data: { name: string; x: number; y: number; z?: number }[];
  height?: number;
  xName?: string;
  yName?: string;
  zName?: string;
  xFormat?: FormatKind;
  yFormat?: FormatKind;
  showLabels?: boolean;
}) {
  const xfmt = resolveFormat(xFormat);
  const yfmt = resolveFormat(yFormat);
  // Only size bubbles when there's real variation to show; otherwise keep a uniform dot.
  const hasZ = data.some((d) => typeof d.z === "number" && (d.z ?? 0) > 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 18, right: 24, bottom: 20, left: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          dataKey="x"
          name={xName}
          domain={[0, "dataMax"]}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={(v) => xfmt(v as number)}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yName}
          domain={[0, "dataMax"]}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={(v) => yfmt(v as number)}
        />
        {hasZ ? <ZAxis type="number" dataKey="z" range={[80, 520]} name={zName} /> : null}
        <Tooltip
          {...TOOLTIP_STYLE}
          cursor={{ strokeDasharray: "3 3" }}
          formatter={(v, key) => {
            if (key === xName) return [xfmt(Number(v ?? 0)), xName];
            if (key === yName) return [yfmt(Number(v ?? 0)), yName];
            return [Number(v ?? 0).toFixed(1), key];
          }}
          labelFormatter={(_, payload) => String(payload?.[0]?.payload?.name ?? "")}
        />
        <Scatter data={data} fill="hsl(var(--accent))" fillOpacity={0.72} stroke="hsl(var(--accent))" strokeWidth={1}>
          {showLabels ? (
            <LabelList dataKey="name" position="top" fill="hsl(var(--muted-foreground))" fontSize={10} />
          ) : null}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
