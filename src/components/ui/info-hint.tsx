"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Small accessible info affordance: an "i" icon that reveals an explanatory
 * tooltip on hover/focus (include the formula in `content`).
 *
 * Backed by Radix Tooltip + Portal so the bubble renders on <body> and is never
 * clipped by an ancestor's `overflow-hidden` (e.g. KpiCard) and auto-flips away
 * from viewport edges. Safe to drop into server components like SectionCard /
 * KpiCard since `content` is passed through as serializable children.
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
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Más información"
            className={cn("inline-flex shrink-0 items-center align-middle", className)}
          >
            <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground/60 transition-colors hover:text-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipPrimitive.Portal>
          <TooltipContent
            side={side}
            collisionPadding={12}
            className="w-64 whitespace-normal text-left font-normal leading-snug"
          >
            {content}
          </TooltipContent>
        </TooltipPrimitive.Portal>
      </Tooltip>
    </TooltipProvider>
  );
}
