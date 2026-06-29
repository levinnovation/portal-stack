import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Small accessible info affordance: an "i" icon that reveals an explanatory
 * tooltip on hover/focus. SSR-safe (CSS-only, no client state) so it can be
 * dropped into server components like SectionCard / KpiCard.
 *
 * Use it to explain what a KPI / chart / table shows and how it is computed
 * (include the formula in `content`).
 */
export function InfoHint({
  content,
  className,
  side = "bottom",
}: {
  content: React.ReactNode;
  className?: string;
  side?: "bottom" | "top";
}) {
  return (
    <span
      className={cn("group/info relative inline-flex shrink-0 items-center align-middle", className)}
      tabIndex={0}
      aria-label="Más información"
    >
      <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground/60 transition-colors hover:text-foreground" />
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 w-64 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-left text-xs font-normal leading-snug text-popover-foreground opacity-0 shadow-xl transition-opacity duration-150 group-hover/info:opacity-100 group-focus-within/info:opacity-100",
          side === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5"
        )}
      >
        {content}
      </span>
    </span>
  );
}
