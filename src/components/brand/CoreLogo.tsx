import { cn } from "@/lib/utils";

/**
 * CORE wordmark: nested double-C monogram (outer light C + inner lime C, both
 * opening right) followed by the lowercase "core" wordmark. The marks are drawn
 * as arcs with round caps so the gap reads as a "C"; colors are theme tokens so
 * the logo works on the dark sidebar and in light mode alike.
 */
export function CoreMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* outer C — inherits text color so it stays legible on dark sidebar/hero in both themes */}
      <path
        d="M52.4 20.5 A20 20 0 1 0 52.4 43.5"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
      />
      {/* inner C */}
      <path
        d="M39.4 26.8 A9 9 0 1 0 39.4 37.2"
        stroke="hsl(var(--accent))"
        strokeWidth="9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CoreLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <CoreMark className="h-7 w-7" />
      <span className="font-sans text-2xl font-bold lowercase tracking-tight">core</span>
    </span>
  );
}
