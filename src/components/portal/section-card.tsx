import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { InfoHint } from "@/components/ui/info-hint";

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  info,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Optional explanation (what it shows + formula) rendered as an info tooltip next to the title. */
  info?: React.ReactNode;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-1.5 font-display text-base text-foreground">
            {title}
            {info && <InfoHint content={info} />}
          </h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}
