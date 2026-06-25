import { FlaskConical } from "lucide-react";

import { Card } from "@/components/ui/card";

export function AbTestCard({
  campaign,
  hypothesis,
  variantA,
  variantB,
  primaryMetric,
  expectedLift,
  minimumSampleSize,
  priority,
  rationale,
}: {
  campaign?: string;
  hypothesis: string;
  variantA: string;
  variantB: string;
  primaryMetric: string;
  expectedLift: number;
  minimumSampleSize: number;
  priority: "low" | "medium" | "high";
  rationale: string;
}) {
  const priorityClass =
    priority === "high" ? "text-rose-300 bg-rose-400/10" : priority === "medium" ? "text-amber-300 bg-amber-300/10" : "text-emerald-300 bg-emerald-300/10";
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FlaskConical className="h-4 w-4 text-primary" />
          {campaign || "Experimento"}
        </div>
        <span className={`rounded-full px-2 py-1 text-xs ${priorityClass}`}>{priority}</span>
      </div>
      <p className="mt-3 text-sm text-foreground">{hypothesis}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
        <div className="rounded-lg border border-border bg-secondary/20 p-3">
          <p className="font-medium text-muted-foreground">Variant A</p>
          <p className="mt-1">{variantA}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/20 p-3">
          <p className="font-medium text-muted-foreground">Variant B</p>
          <p className="mt-1">{variantB}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div>Metric: <span className="text-foreground">{primaryMetric}</span></div>
        <div>Lift: <span className="text-foreground">{Math.round(expectedLift * 100)}%</span></div>
        <div>Sample: <span className="text-foreground">{minimumSampleSize}</span></div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{rationale}</p>
    </Card>
  );
}
