"use client";

import { TooltipProvider } from "@/components/ui/tooltip";

export function PortalProviders({ children }: { children: React.ReactNode }) {
  return <TooltipProvider delayDuration={200}>{children}</TooltipProvider>;
}
