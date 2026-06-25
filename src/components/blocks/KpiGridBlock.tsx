"use client";
import * as React from "react";
import * as Icons from "lucide-react";
import { KpiCard } from "@/components/portal/kpi-card";
import { fmtUSD, fmtCOP } from "@/lib/utils";
import { DollarSign } from "lucide-react";

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
          const Icon = (card.icon && (Icons as any)[card.icon]) ? (Icons as any)[card.icon] : DollarSign;
          return (
            <KpiCard
              key={i}
              label={card.label}
              value={formatValue(card.format, data[card.dataset])}
              icon={Icon}
            />
          );
        })}
      </div>
    </section>
  );
}
