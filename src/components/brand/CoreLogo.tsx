import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * CORE brand lockup — the real logo asset (nested double-C + "core" wordmark),
 * cropped from the supplied square art and background-knocked-out to transparent
 * so it sits cleanly on the near-black sidebar/hero in both themes.
 */
export function CoreLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/core-logo-wide.png"
      alt="CORE"
      width={900}
      height={360}
      priority
      className={cn("h-9 w-auto", className)}
    />
  );
}
