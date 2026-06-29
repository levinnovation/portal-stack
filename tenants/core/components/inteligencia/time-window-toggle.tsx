"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { INTEL_RUN_COOKIE, RUN_TYPE_OPTIONS } from "@tenants/core/lib/inteligencia-run";
import type { InteligenciaRunType } from "@tenants/core/sources/inteligencia";

export function TimeWindowToggle({ run, className }: { run: InteligenciaRunType; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selectWindow(value: InteligenciaRunType) {
    if (value === run) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("run", value);
    try {
      window.document.cookie = `${INTEL_RUN_COOKIE}=${value}; path=/; max-age=2592000; SameSite=Lax`;
    } catch {
      // ignore cookie failures
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {RUN_TYPE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => selectWindow(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            option.value === run
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-muted-foreground hover:text-foreground",
          )}
          title={option.label}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}

