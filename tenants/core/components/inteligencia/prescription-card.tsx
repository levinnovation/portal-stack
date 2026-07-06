"use client";

import { useState } from "react";
import { Flame, Thermometer, Snowflake, TrendingUp, TrendingDown, ArrowRight, Target, Zap, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { money, num } from "@tenants/core/lib/format";
import { PrescriptionDetailDialog } from "./prescription-detail-dialog";
import type { Prescription } from "@tenants/core/sources/inteligencia";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; tone: string }> = {
  scale:     { label: "ESCALAR",     icon: TrendingUp,   tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  pause:     { label: "PAUSAR",      icon: TrendingDown,  tone: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  adjust:    { label: "AJUSTAR",     icon: ArrowRight,    tone: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  reengage:  { label: "RE-ENGANCHAR", icon: Flame,        tone: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  fasttrack: { label: "ACELERAR",    icon: Zap,           tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  recycle:   { label: "RECICLAR",    icon: RefreshCw,     tone: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
};

const PRIORITY_TONE: Record<Prescription["priority"], string> = {
  high:   "bg-rose-400/15 text-rose-300 border-rose-400/30",
  medium: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  low:    "bg-sky-400/15 text-sky-300 border-sky-400/30",
};

const TEMP_ICONS: Record<string, React.ElementType> = {
  hot: Flame, warm: Thermometer, cold: Snowflake,
};

export function PrescriptionCard({
  prescription,
  runType,
}: {
  prescription: Prescription;
  runType: string;
}) {
  const [open, setOpen] = useState(false);
  const typeCfg = TYPE_CONFIG[prescription.type] ?? TYPE_CONFIG.adjust;
  const Icon = typeCfg.icon;

  // Deduplicate transition summary
  const topTransitions = prescription.transitionSummary.slice(0, 3);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        aria-label={`Ver detalle: ${prescription.title}`}
      >
        <Card className={cn(
          "p-4 h-full transition-all duration-150 hover:ring-1 hover:ring-primary/40",
          prescription.priority === "high" && "ring-1 ring-rose-500/20",
        )}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon className={cn("h-4 w-4 shrink-0", typeCfg.tone.split(" ")[1])} />
              <p className="text-sm font-semibold truncate">{prescription.title}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Badge className={cn("text-[10px] border", typeCfg.tone)}>{typeCfg.label}</Badge>
              <Badge className={cn("text-[10px] border", PRIORITY_TONE[prescription.priority])}>
                {prescription.priority.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Reason */}
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{prescription.reason}</p>

          {/* Metrics row */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Target className="h-3 w-3" />
              <span className="font-medium text-foreground">{num(prescription.impactedCount)}</span> leads
            </span>
            {prescription.revenueAtRisk > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="font-medium text-rose-400">{money(prescription.revenueAtRisk)}</span> en riesgo
              </span>
            )}
          </div>

          {/* Transition chips */}
          {topTransitions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {topTransitions.map(({ label, count }) => {
                const parts = label.split("->");
                const fromIcon = parts[0] && TEMP_ICONS[parts[0]] ? TEMP_ICONS[parts[0]] : null;
                const toIcon = parts[1] && TEMP_ICONS[parts[1]] ? TEMP_ICONS[parts[1]] : null;
                const FromIcon = fromIcon;
                const ToIcon = toIcon;
                return (
                  <span key={label} className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] bg-muted border border-border/50">
                    {FromIcon && <FromIcon className="h-2.5 w-2.5" />}
                    {parts[0]}
                    {parts.length > 1 && (
                      <>
                        <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                        {ToIcon && <ToIcon className="h-2.5 w-2.5" />}
                        {parts[1]}
                      </>
                    )}
                    <span className="ml-0.5 text-muted-foreground">·{count}</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* CTA hint */}
          <p className="text-[10px] text-primary/70 mt-2.5">Ver leads impactados →</p>
        </Card>
      </button>

      <PrescriptionDetailDialog
        open={open}
        onOpenChange={setOpen}
        prescription={prescription}
        runType={runType}
      />
    </>
  );
}
