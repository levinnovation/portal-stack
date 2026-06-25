import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: number | null; // variación relativa (ej. 0.12 = +12%)
  deltaLabel?: string;
  hint?: string;
  /** Para métricas donde subir es malo (ej. días a cierre). Por defecto subir = bueno. */
  invertDelta?: boolean;
};

export function KpiCard({ label, value, icon: Icon, delta, deltaLabel, hint, invertDelta }: Props) {
  const hasDelta = delta !== null && delta !== undefined && isFinite(delta);
  const up = (delta ?? 0) >= 0;
  const bad = invertDelta ? up : !up;

  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/70 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              bad ? "text-rose-400" : "text-emerald-400"
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs((delta ?? 0) * 100).toFixed(1)}%
          </span>
        )}
        {(deltaLabel || hint) && (
          <span className="text-muted-foreground">{deltaLabel ?? hint}</span>
        )}
      </div>
    </Card>
  );
}
