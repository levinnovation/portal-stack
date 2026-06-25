import { AlertTriangle, CheckCircle2, CircleAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS = {
  green: { label: "OK", className: "text-emerald-400 bg-emerald-400/10", Icon: CheckCircle2 },
  amber: { label: "Watch", className: "text-amber-300 bg-amber-300/10", Icon: AlertTriangle },
  red: { label: "Risk", className: "text-rose-400 bg-rose-400/10", Icon: CircleAlert },
} as const;

export function KriCard({
  name,
  value,
  threshold,
  status,
  reason,
}: {
  name: string;
  value: number;
  threshold: number;
  status: "green" | "amber" | "red";
  reason: string;
}) {
  const meta = STATUS[status] ?? STATUS.amber;
  const Icon = meta.Icon;
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{name}</p>
          <p className="mt-2 text-2xl font-semibold">{Number.isInteger(value) ? value : value.toFixed(2)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Umbral: {threshold}</p>
        </div>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs", meta.className)}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{reason}</p>
    </Card>
  );
}
