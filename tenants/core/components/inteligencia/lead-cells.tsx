"use client";

/**
 * Shared cell-level presentational helpers for lead temperature tables.
 * Used by PrescriptionDetailDialog, SegmentLeadsTable, and any other
 * component that renders per-lead rows.
 */

import { ArrowRight, Flame, Thermometer, Snowflake, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeadTemp } from "@tenants/core/sources/inteligencia";

export const TEMP_CONFIG: Record<LeadTemp, { label: string; icon: React.ElementType; classes: string }> = {
  hot: {
    label: "Caliente",
    icon: Flame,
    classes: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  warm: {
    label: "Tibio",
    icon: Thermometer,
    classes: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  cold: {
    label: "Frío",
    icon: Snowflake,
    classes: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
};

export const DIRECTION_CONFIG: Record<string, { icon: React.ElementType; label: string; classes: string }> = {
  warming: { icon: TrendingUp, label: "Calentando", classes: "text-emerald-400" },
  cooling: { icon: TrendingDown, label: "Enfriando", classes: "text-rose-400" },
  stable: { icon: Minus, label: "Estable", classes: "text-muted-foreground" },
};

export const TYPE_TONE: Record<string, string> = {
  scale: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pause: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  adjust: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  reengage: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  fasttrack: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  recycle: "bg-violet-500/15 text-violet-300 border-violet-500/30",
};

export const PRIORITY_TONE: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  low: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

export function TempBadge({ temp }: { temp: LeadTemp | null | undefined }) {
  if (!temp) return <span className="text-muted-foreground text-xs">—</span>;
  const cfg = TEMP_CONFIG[temp];
  if (!cfg) return <span className="text-muted-foreground text-xs">{temp}</span>;
  const Icon = cfg.icon;
  return (
    <Badge className={cn("gap-1 text-xs border", cfg.classes)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

export function TransitionArrow({ from, to }: { from: LeadTemp | null | undefined; to: LeadTemp }) {
  if (!from || from === to) {
    return <TempBadge temp={to} />;
  }
  return (
    <span className="flex items-center gap-1.5">
      <TempBadge temp={from} />
      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
      <TempBadge temp={to} />
    </span>
  );
}

export function DirectionChip({ direction }: { direction: string }) {
  const cfg = DIRECTION_CONFIG[direction] ?? DIRECTION_CONFIG.stable;
  const Icon = cfg.icon;
  return (
    <span className={cn("flex items-center gap-1 text-xs", cfg.classes)}>
      <Icon className="h-3 w-3 shrink-0" />
      {cfg.label}
    </span>
  );
}

export function DaysSinceTouch({ days }: { days: number | null | undefined }) {
  if (days == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={days >= 7 ? "text-rose-400" : days >= 2 ? "text-amber-400" : "text-muted-foreground"}>
      {days.toFixed(0)}d
    </span>
  );
}

export function ConfidenceCell({ confidence }: { confidence: number }) {
  if (!confidence) return <span className="text-muted-foreground">—</span>;
  const pctVal = `${Math.round(confidence * 100)}%`;
  return (
    <span className={confidence >= 0.75 ? "text-rose-400" : confidence >= 0.5 ? "text-amber-400" : "text-muted-foreground"}>
      {pctVal}
    </span>
  );
}
