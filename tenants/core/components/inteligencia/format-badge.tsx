"use client";

import {
  FORMAT_ICONS,
  FORMAT_LABELS,
  type DisplayFormat,
  formatLabel,
  formatMixTooltip,
  normalizeDisplayFormat,
} from "@tenants/core/lib/ad-formats";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type FormatBadgeProps = {
  /** Ad-level format or campaign displayFormat (`mixed` | primary). */
  format: string | null | undefined;
  /** Spend-weighted shares — enables Mixto tooltip detail when present. */
  formatMix?: Record<string, number> | null;
  onClick?: () => void;
  className?: string;
  /** Accessible name when used as a button (e.g. open drill-down). */
  title?: string;
};

/**
 * Localized creative-format chip (Reel, Video, Foto, …, Mixto).
 * Mixto shows a spend-weighted share tooltip when formatMix is available.
 */
export function FormatBadge({ format, formatMix, onClick, className, title }: FormatBadgeProps) {
  const display = normalizeDisplayFormat(format);
  if (!display) {
    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          title={title ?? "Ver anuncios"}
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-secondary/50",
            className,
          )}
        >
          —
        </button>
      );
    }
    return <span className="text-muted-foreground">—</span>;
  }

  const label = FORMAT_LABELS[display as DisplayFormat] ?? formatLabel(format);
  const icon = FORMAT_ICONS[display as DisplayFormat] ?? "📄";
  const isMixed = display === "mixed";

  const chip = (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 whitespace-nowrap rounded-full border border-border bg-secondary/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground",
        onClick && "cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground",
        className,
      )}
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </span>
  );

  const wrapped = onClick ? (
    <button
      type="button"
      onClick={onClick}
      title={title ?? `Ver anuncios · ${label}`}
      className="inline-flex max-w-full rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {chip}
    </button>
  ) : (
    chip
  );

  if (!isMixed) return wrapped;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{wrapped}</TooltipTrigger>
        <TooltipContent
          side="bottom"
          collisionPadding={12}
          className="max-w-xs whitespace-normal text-left font-normal leading-snug"
        >
          {formatMixTooltip(formatMix)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
