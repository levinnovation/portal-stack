"use client";
import * as React from "react";
import { Bar, BarChart, Line, LineChart, Area, AreaChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "@/components/portal/empty-state";

export interface ChartBlockProps {
  title?: string;
  subtitle?: string;
  dataset: string;
  kind?: "line" | "bar" | "pie" | "area";
  height?: number;
  data?: unknown;
}

const chartConfig = {
  value: { label: "Valor", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

export function ChartBlock({ title, subtitle, kind = "line", height = 280, data }: ChartBlockProps) {
  const rows = Array.isArray(data) ? (data as { name: string; value: number }[]) : [];

  return (
    <Card>
      <CardContent className="p-6">
        {title && <h3 className="font-display text-xl mb-1">{title}</h3>}
        {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
        {rows.length === 0 ? (
          <EmptyState message="Sin datos para este gráfico" />
        ) : (
          <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
            {kind === "pie" ? (
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
