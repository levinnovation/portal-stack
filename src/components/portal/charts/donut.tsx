"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { colorAt, TOOLTIP_STYLE } from "./palette";
import { resolveFormat, type FormatKind } from "@/components/portal/chart-format";
import type { Datum } from "./bar-horizontal";

export function Donut({
  data,
  height = 280,
  format = "num",
}: {
  data: Datum[];
  height?: number;
  format?: FormatKind;
}) {
  const fmt = resolveFormat(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colorAt(i)} />
          ))}
        </Pie>
        {/* El 2º elemento es la etiqueta: mostramos el nombre de la tajada (atributo)
            junto al número, en vez de solo el número. */}
        <Tooltip {...TOOLTIP_STYLE} formatter={(v, name) => [fmt(v as number), name]} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: "#c7cddb" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
