import { cn } from "@/lib/utils";

export function CoreLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        aria-hidden
        viewBox="0 0 40 40"
        className="h-6 w-6 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.3" opacity="0.18" />
        <circle cx="20" cy="20" r="13" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
        <circle cx="20" cy="20" r="8.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
        <circle cx="20" cy="20" r="3.5" fill="currentColor" opacity="0.9" />
      </svg>
      <span className="font-display text-2xl tracking-tight">CORE</span>
    </span>
  );
}
