import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function RecommendationCard({
  action,
  title,
  reason,
}: {
  action: "scale" | "pause" | "adjust";
  title: string;
  reason: string;
}) {
  const tone =
    action === "scale"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : action === "pause"
        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
        : "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <Badge className={tone}>{action.toUpperCase()}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{reason}</p>
    </Card>
  );
}
