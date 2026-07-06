"use client";
import * as React from "react";
import { Bar, BarChart, Line, LineChart, Area, AreaChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "@/components/portal/empty-state";
import { FunnelSimple } from "@/components/portal/charts/funnel";
import { ComboSpendReservations } from "@/components/portal/charts/combo";
import { ScatterEfficiency } from "@/components/portal/charts/scatter";
import { Gauge } from "@/components/portal/charts/gauge";
import { AreaTrend } from "@/components/portal/charts/area-trend";
import { ParetoChart } from "@/components/portal/charts/pareto";
import { WaterfallChart } from "@/components/portal/charts/waterfall";
import { MatrixHeatmap } from "@/components/portal/charts/matrix-heatmap";
import { StackedBar } from "@/components/portal/charts/stacked-bar";
import { ForecastLine } from "@/components/portal/charts/forecast-line";
import { AnomalyTimeline } from "@/components/portal/charts/anomaly-timeline";
import { TransitionMatrixChart } from "@/components/portal/charts/transition-matrix";

export interface ChartBlockProps {
  title?: string;
  subtitle?: string;
  dataset: string;
  kind?: "line" | "bar" | "pie" | "area" | "funnel" | "combo" | "scatter" | "gauge" | "area-trend" | "pareto" | "waterfall" | "matrix-heatmap" | "stacked-bar" | "forecast" | "anomaly" | "transition-matrix";
  height?: number;
  data?: unknown;
}

const chartConfig = {
  value: { label: "Valor", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

export function ChartBlock({ title, subtitle, kind = "line", height = 280, data }: ChartBlockProps) {
  const rows = Array.isArray(data) ? (data as { name: string; value: number }[]) : [];
  const genericRows = Array.isArray(data) ? (data as Record<string, any>[]) : [];

  return (
    <Card>
      <CardContent className="p-6">
        {title && <h3 className="font-display text-xl mb-1">{title}</h3>}
        {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
        {rows.length === 0 ? (
          <EmptyState message="Sin datos para este gráfico" />
        ) : (
          <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
            {kind === "funnel" ? (
              <FunnelSimple data={rows} />
            ) : kind === "combo" ? (
              <ComboSpendReservations data={genericRows.map((r) => ({ name: String(r.name ?? ""), spend: Number(r.spend ?? 0), reservations: Number(r.reservations ?? 0) }))} />
            ) : kind === "scatter" ? (
              <ScatterEfficiency data={genericRows.map((r) => ({ name: String(r.name ?? ""), x: Number(r.x ?? 0), y: Number(r.y ?? 0), z: Number(r.z ?? 0) }))} />
            ) : kind === "gauge" ? (
              <Gauge value={Number(genericRows[0]?.value ?? 0)} threshold={Number(genericRows[0]?.threshold ?? 0.6)} />
            ) : kind === "area-trend" ? (
              <AreaTrend data={genericRows.map((r) => ({ dia: String(r.dia ?? r.date ?? r.name ?? ""), valor: Number(r.valor ?? r.value ?? 0) }))} />
            ) : kind === "pareto" ? (
              <ParetoChart data={genericRows.map((r) => ({ name: String(r.name ?? ""), value: Number(r.value ?? 0), cumulative: Number(r.cumulative ?? 0) }))} />
            ) : kind === "waterfall" ? (
              <WaterfallChart data={genericRows.map((r) => ({ name: String(r.name ?? ""), value: Number(r.value ?? 0), type: (r.type ?? "delta") as "total" | "delta" }))} />
            ) : kind === "matrix-heatmap" ? (
              <MatrixHeatmap data={data as any} />
            ) : kind === "stacked-bar" ? (
              <StackedBar data={genericRows} keys={Object.keys(genericRows[0] ?? {}).filter((k) => k !== "name")} />
            ) : kind === "forecast" ? (
              <ForecastLine data={genericRows as any} />
            ) : kind === "anomaly" ? (
              <AnomalyTimeline data={genericRows as any} anomalies={genericRows as any} />
            ) : kind === "transition-matrix" ? (
              <TransitionMatrixChart data={data as any} />
            ) : kind === "pie" ? (
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="42%" outerRadius="72%" paddingAngle={2}>
                  {rows.map((_, i) => (
                    <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} />
                  ))}
                </Pie>
              </PieChart>
            ) : kind === "bar" ? (
              <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : kind === "area" ? (
              <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="value" fill="var(--color-value)" stroke="var(--color-value)" fillOpacity={0.25} />
              </AreaChart>
            ) : (
              <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            )}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
