import { cn } from "@/lib/utils";

// Placeholder mientras el server component resuelve. Se usa en loading.tsx por ruta.
export function ChartSkeleton({ height = 280, className }: { height?: number; className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-secondary/40", className)}
      style={{ height }}
    />
  );
}

export function KpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary/40" />
      ))}
    </div>
  );
}
