import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { InfoHint } from "@/components/ui/info-hint";
import { AiExplain, type AiExplainSpec } from "@/components/portal/ai-explain";

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  info,
  aiExplain,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Optional explanation (what it shows + formula) rendered as an info tooltip next to the title. */
  info?: React.ReactNode;
  /** "Explicar con IA": description/formula + LLM interpretation of the data currently rendered below. */
  aiExplain?: AiExplainSpec;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-1.5 font-display text-base text-foreground">
            {title}
            {info && <InfoHint content={info} />}
            {aiExplain && (
              <AiExplain
                label={title}
                spec={{ ...aiExplain, description: aiExplain.description ?? description, kind: aiExplain.kind ?? "chart" }}
              />
            )}
          </h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}
