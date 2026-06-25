"use client";

import { LiveClock } from "@/components/portal/live-clock";
import { RefreshButton } from "@tenants/core/components/layout/refresh-button";

export function AgentHeaderActions() {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground tabular-nums">
        <LiveClock />
      </span>
      <RefreshButton />
    </div>
  );
}
