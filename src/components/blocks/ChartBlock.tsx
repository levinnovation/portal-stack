"use client";
import * as React from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

export interface ChartBlockProps {
  title?: string;
  subtitle?: string;
  dataset: string;
  kind?: "line" | "bar" | "pie" | "area";
  height?: number;
  /** Result of the dataset, expected to be an array of objects */
  data?: unknown;
}

const COLORS = ["hsl(var(--accent))", "hsl(var(--primary))", "hsl(var(--muted-foreground))", "#A8B5C7", "#D4AF7A"];

export function ChartBlock({ title, subtitle, dataset, kind = "line", height = 280, data }: ChartBlockProps) {
  const rows = Array.isArray(data) ? (data as any[]) : [];
  return (
    <Card>
      <CardContent className="p-6">
        {title && <h3 className="font-display text-xl mb-1">{title}</h3>}
        {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
        {rows.length === 0 ? (
          <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height }}>
            Sin datos
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            {kind === "pie" ? (
              <PieChart>
                <Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="42%" innerRadius="42%" outerRadius="72%" paddingAngle={2}>
                  {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="bottom" height={36} iconSize={8} />
              </PieChart>
            ) : kind === "bar" ? (
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : kind === "area" ? (
              <AreaChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.3} />
              </AreaChart>
            ) : (
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
        <div className="text-[10px] text-muted-foreground mt-2">dataset: {dataset}</div>
      </CardContent>
    </Card>
  );
}
