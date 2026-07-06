"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { EYAL_WINDOW_OPTIONS } from "@tenants/core/lib/eyal-window";
import type { EyalWindow } from "@tenants/core/sources/eyal";

export function EyalWindowToggle({ window, className }: { window: EyalWindow; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selectWindow(value: EyalWindow) {
    if (value === window) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("window", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {EYAL_WINDOW_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => selectWindow(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            option.value === window
              ? "bg-accent text-accent-foreground"
              : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          title={option.label}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}
