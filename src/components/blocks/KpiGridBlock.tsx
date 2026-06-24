"use client";
import * as React from "react";
import * as Icons from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fmtUSD, fmtCOP, fmtDate } from "@/lib/utils";

export interface KpiCardDef {
  label: string;
  dataset: string;
  format?: "number" | "usd" | "cop" | "percent" | "text";
  icon?: string;
}

export interface KpiGridBlockProps {
  title?: string;
  subtitle?: string;
  cards: KpiCardDef[];
  /** Map<datasetKey, value> provided by the BlockRenderer */
  data?: Record<string, unknown>;
}

function formatValue(format: KpiCardDef["format"], value: unknown): string {
  if (value == null) return "—";
  if (format === "usd") return fmtUSD(Number(value));
  if (format === "cop") return fmtCOP(Number(value));
  if (format === "percent") return `${Number(value).toFixed(1)}%`;
  if (format === "text") return String(value);
  if (format === "number" && typeof value === "number") {
    return new Intl.NumberFormat("es-CO").format(value);
  }
  return String(value);
}

export function KpiGridBlock({ title, subtitle, cards, data = {} }: KpiGridBlockProps) {
  return (
    <section>
      {title && <h2 className="font-display text-2xl mb-1">{title}</h2>}
      {subtitle && <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon && (Icons as any)[card.icon] ? (Icons as any)[card.icon] : null;
          const value = data[card.dataset];
          return (
            <Card key={i}>
              <CardContent className="p-5">
                {Icon && <Icon className="h-5 w-5 text-accent mb-3" />}
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{card.label}</div>
                <div className="font-display text-2xl xl:text-3xl text-foreground">
                  {formatValue(card.format, value)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
